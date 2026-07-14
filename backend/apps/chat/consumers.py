import json
import asyncio
import re
import logging
import traceback
import os
import chromadb
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from apps.ai.models import AIProviderConfig
from apps.ai.providers.factory import ProviderFactory
from apps.ai.tools import fetch_page, search_web
from .models import Conversation, ChatMessage

logger = logging.getLogger(__name__)

# Initialize ChromaDB client pointing to CHROMA_DB_DIR
CHROMA_DB_DIR = os.environ.get('CHROMA_DB_DIR', getattr(settings, 'CHROMA_DB_DIR', None))
if not CHROMA_DB_DIR:
    try:
        CHROMA_DB_DIR = os.path.join(settings.BASE_DIR, 'chroma_db')
    except Exception:
        CHROMA_DB_DIR = '/app/chroma_db'

if not os.path.exists(CHROMA_DB_DIR):
    try:
        os.makedirs(CHROMA_DB_DIR, exist_ok=True)
    except Exception:
        pass

chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)


# Matches http(s):// URLs and www. domains, avoids matching filenames like plan.md
URL_PATTERN = re.compile(
    r'(?:https?://|www\.)[^\s<>"]+',
    re.IGNORECASE
)


def auto_enrich_messages(messages, memory_context=None, text_documents=None):
    """
    Inspect the last user message. If it contains a URL or seems to ask
    about something real-time, fetch/search and inject the result into the
    system context — no tool-calling protocol required.
    """
    last_user = next((m for m in reversed(messages) if m.get("role") == "user"), None)
    if not last_user:
        return messages, None

    raw_content = last_user.get("content", "")
    text_content = ""
    if isinstance(raw_content, list):
        text_content = " ".join([c.get("text", "") for c in raw_content if c.get("type") == "text"])
    else:
        text_content = str(raw_content)

    urls = URL_PATTERN.findall(text_content)
    status_msg = None

    enriched_messages = list(messages)

    # Base rules always injected so ANY model behaves correctly
    base_rules = (
        "STRICT RULES — follow these at all times:\n"
        "1. Always respond in the SAME language the user writes in.\n"
        "2. Be highly structured, professional, and opinionated. Act as an expert AI consultant.\n"
        "3. Use rich markdown formatting: use bullet points, bold text, numbered lists, and tables where appropriate.\n"
        "4. Use emojis tastefully to make your response engaging and easy to read (e.g., ✅, 🚀, ⭐, 👉).\n"
        "5. Provide actionable examples, code snippets, or configuration templates when relevant.\n"
        "6. ALWAYS wrap code snippets in markdown triple backticks (e.g., ```python ... ```). Never output raw internal tool logs or bracketed chain-of-thought.\n"
        "7. Integrate facts from the User Memory naturally into your recommendations to make them highly personalized.\n"
        "8. If your answer includes factual claims or recommendations, append a final markdown section titled 'Sources' with clickable links.\n"
        "9. If no reliable link is available for a factual/recommendation answer, explicitly write: Sources: none.\n"
    )

    injection = "\n\n" + base_rules
    
    if memory_context:
        injection += f"\n\n[USER MEMORY & PREFERENCES]\n{memory_context}\n[END OF USER MEMORY]\n(Use these facts naturally in conversation when relevant)."

    if urls:
        # Filter out very short strings that aren't real domains (e.g. 'a.b')
        real_urls = [u for u in urls if '.' in u and len(u) > 5]
        if real_urls:
            url = real_urls[0]
            if not url.startswith("http"):
                url = "https://" + url
            logger.info(f"Auto-enriching: fetching {url}")
            page_text = fetch_page(url)
            injection += (
                f"\n[LIVE WEB CONTENT — fetched from {url}]\n"
                f"{page_text}\n"
                f"[END OF WEB CONTENT]\n\n"
                "Use ONLY the above content to answer. Do not guess or invent information."
            )
            status_msg = f"Fetching: {url}"
    else:
        # Check for real-time keywords
        realtime_keywords = [
            "latest", "current", "today", "right now", "news", "weather",
            "price", "stock", "trending", "recently", "what happened",
            "who won", "who wins", "winner", "score", "match", "game",
            "world cup", "olympics", "election", "update", "2024", "2025", "2026", "this year",
            "live", "results", "standings", "schedule", "did", "how is"
        ]
        needs_search = any(kw in text_content.lower() for kw in realtime_keywords)
        if needs_search:
            logger.info(f"Auto-enriching: searching web for user query")
            results = search_web(text_content[:200])
            injection += (
                f"\n[LIVE WEB SEARCH RESULTS]\n"
                f"{results}\n"
                f"[END OF SEARCH RESULTS]\n\n"
                "SYSTEM OVERRIDE: You DO have access to real-time information. The LIVE WEB SEARCH RESULTS provided above contain up-to-date facts. "
                "You MUST use this provided information to answer the user's question directly. "
                "DO NOT say you don't have access to live data, sports schedules, or current events. "
                "Synthesize the provided search results into a confident, factual answer."
            )
            status_msg = "Searching the web..."

    # Generic rule to stop AI from claiming it can't read files
    if "(I have uploaded a document:" in text_content:
        injection += "\n[SYSTEM RULE] The user just uploaded a document. The system has automatically processed it and stored it in the knowledge base. Acknowledge the upload and ask how you can help with it. Do NOT say you cannot read files."

    # Check if documents_collection exists in ChromaDB. If it contains documents, query the collection using the user query.
    try:
        collections = chroma_client.list_collections()
        collection_names = [col.name if hasattr(col, 'name') else col for col in collections]
        if "documents_collection" in collection_names:
            collection = chroma_client.get_collection("documents_collection")
            if collection.count() > 0:
                results = collection.query(
                    query_texts=[text_content],
                    n_results=3
                )
                docs = results.get('documents', [])
                metadatas = results.get('metadatas', [])
                if docs and docs[0]:
                    for idx, doc_text in enumerate(docs[0]):
                        meta = metadatas[0][idx] if (metadatas and len(metadatas) > 0 and len(metadatas[0]) > idx) else {}
                        filename = meta.get('filename', 'Unknown')
                        chunk_idx = meta.get('chunk_index', 0)
                        
                        chunk_format = (
                            f"[RELEVANT PRIVATE DOCUMENT CONTEXT]\n"
                            f"Source File: {filename} (Chunk #{chunk_idx})\n"
                            f"Content:\n{doc_text}\n"
                            f"---\n"
                            f"[END OF PRIVATE DOCUMENT CONTEXT]\n\n"
                            f"Use the above relevant private document context to help answer the user's query. If the context is not relevant, answer normally."
                        )
                        injection += "\n" + chunk_format
    except Exception as e:
        logger.error(f"Error querying ChromaDB in auto_enrich_messages: {e}")

    # Inject explicit attached text documents
    if text_documents:
        for doc in text_documents:
            if doc.extracted_text:
                chunk_format = (
                    f"[ATTACHED DOCUMENT CONTEXT]\n"
                    f"Source File: {doc.filename}\n"
                    f"Content:\n{doc.extracted_text}\n"
                    f"---\n"
                    f"[END OF ATTACHED DOCUMENT CONTEXT]\n\n"
                    f"Use the above attached document context to help answer the user's query."
                )
                injection += "\n" + chunk_format

    # Find or create the system message and append the injection
    has_system = any(m.get("role") == "system" for m in enriched_messages)
    if has_system:
        for m in enriched_messages:
            if m.get("role") == "system":
                m["content"] += injection
                break
    else:
        enriched_messages.insert(0, {"role": "system", "content": injection})

    return enriched_messages, status_msg


def _maybe_set_title_sync(conversation, last_user_msg):
    if conversation.title == "New Conversation" and last_user_msg:
        content = last_user_msg.get("content", "")
        conversation.title = content[:60] + ("..." if len(content) > 60 else "")
        conversation.save(update_fields=["title"])


@sync_to_async
def _maybe_set_title(self, conversation, last_user_msg):
    return _maybe_set_title_sync(conversation, last_user_msg)


@sync_to_async
def _get_user_memory_sync(user):
    from apps.accounts.models import UserMemory
    try:
        memory = UserMemory.objects.get(user=user)
        return memory.context
    except UserMemory.DoesNotExist:
        return None


@sync_to_async
def _get_documents_sync(doc_ids, user):
    from apps.documents.models import Document
    return list(Document.objects.filter(id__in=doc_ids, user=user))


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"chat_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        # Allow a "stop" message to cancel the current stream
        if text_data:
            try:
                peek = json.loads(text_data)
                if peek.get("type") == "stop":
                    self._stop_requested = True
                    return
            except Exception:
                pass

        self._stop_requested = False

        try:
            data = json.loads(text_data)
            messages = data.get("messages", [])
            conversation_id = data.get("conversation_id")
            # Optional overrides from frontend
            requested_model_id = data.get("model_id")          # AIModel PK
            effort = data.get("effort", "medium")              # low|medium|high|max

            logger.info(f"Received {len(messages)} messages, conversation_id={conversation_id}, effort={effort}, model_id={requested_model_id}")

            if not messages:
                return

            # --- Resolve conversation ---
            conversation = await self._get_or_create_conversation(conversation_id)

            # --- Save the latest user message to DB ---
            last_user_msg = next(
                (m for m in reversed(messages) if m.get("role") == "user"), None
            )
            if last_user_msg:
                await self._save_message(conversation, "user", last_user_msg["content"])

            # --- Fetch AI config (respect frontend model override) ---
            if requested_model_id:
                config = await sync_to_async(self._get_config_for_model)(requested_model_id)
            else:
                config = await sync_to_async(AIProviderConfig.get_active_config)()

            if not config:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "content": "No AI provider is configured. Please go to Django Admin → AI → AI Providers and set an active model."
                }))
                return

            provider_name = config.provider_name
            model_name = config.model_name
            db_api_key = config.api_key

            # --- Map effort to generation params ---
            EFFORT_PARAMS = {
                "low":    {"temperature": 0.3, "max_tokens": 512},
                "medium": {"temperature": 0.7, "max_tokens": 1024},
                "high":   {"temperature": 0.9, "max_tokens": 4096},
                "max":    {"temperature": 1.0, "max_tokens": 8192},
            }
            gen_params = EFFORT_PARAMS.get(effort, EFFORT_PARAMS["medium"])

            provider = ProviderFactory.get_provider(provider_name, model_name, db_api_key)

            # --- Fetch user memory ---
            memory_context = await _get_user_memory_sync(self.user)

            # --- Fetch attached documents ---
            document_ids = data.get("document_ids", [])
            documents = []
            if document_ids:
                documents = await _get_documents_sync(document_ids, self.user)

            text_docs = []
            if documents and last_user_msg:
                import base64
                text_content = last_user_msg.get("content", "")
                new_content = [{"type": "text", "text": text_content}]
                has_images = False
                
                for doc in documents:
                    if doc.file_type == "image" and doc.file:
                        has_images = True
                        try:
                            with doc.file.open('rb') as f:
                                b64 = base64.b64encode(f.read()).decode('utf-8')
                            ext = os.path.splitext(doc.filename)[1].lower().replace('.', '')
                            if ext == 'jpg': ext = 'jpeg'
                            mime = f"image/{ext}"
                            new_content.append({
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime};base64,{b64}"}
                            })
                        except Exception as e:
                            logger.error(f"Failed to load image document {doc.id}: {e}")
                    else:
                        text_docs.append(doc)
                
                if has_images:
                    last_user_msg["content"] = new_content

            # --- Auto-enrich messages with live web data, memory, and text docs ---
            loop = asyncio.get_running_loop()
            enriched_messages, status_msg = await loop.run_in_executor(
                None, auto_enrich_messages, messages, memory_context, text_docs
            )

            # --- Stream response ---
            full_response = []

            # If we fetched live data, send a status token first
            if status_msg:
                await self.send(text_data=json.dumps({"type": "status", "content": status_msg}))

            stop_flag = self  # reference so the thread can read _stop_requested

            def sync_stream_and_queue(q, event_loop):
                try:
                    for token in provider.stream_response(enriched_messages, **gen_params):
                        if getattr(stop_flag, '_stop_requested', False):
                            event_loop.call_soon_threadsafe(q.put_nowait, {"type": "stopped"})
                            return
                        full_response.append(token)
                        event_loop.call_soon_threadsafe(q.put_nowait, {"type": "token", "content": token})
                    event_loop.call_soon_threadsafe(q.put_nowait, {"type": "done"})
                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    event_loop.call_soon_threadsafe(q.put_nowait, {"type": "error", "content": str(e)})

            q = asyncio.Queue()
            loop.run_in_executor(None, sync_stream_and_queue, q, loop)

            while True:
                item = await q.get()
                if item["type"] == "token":
                    await self.send(text_data=json.dumps({
                        "type": "token",
                        "content": item["content"]
                    }))
                elif item["type"] in ("done", "stopped"):
                    # Save whatever was collected
                    if full_response:
                        assistant_content = "".join(full_response)
                        await self._save_message(conversation, "assistant", assistant_content)
                        await self._maybe_set_title(conversation, last_user_msg)
                    await self.send(text_data=json.dumps({
                        "type": "done",
                        "conversation_id": conversation.id
                    }))
                    break
                elif item["type"] == "error":
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "content": item["content"]
                    }))
                    break

        except Exception as e:
            logger.error(f"WebSocket error: {e}\n{traceback.format_exc()}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "content": f"An internal error occurred: {str(e)}"
            }))

    def _get_config_for_model(self, model_pk):
        """Return an AIProviderConfig for a specific AIModel PK, or fall back to active."""
        from apps.ai.models import AIModel, AIProviderConfig
        try:
            m = AIModel.objects.select_related('provider').get(pk=model_pk)
            return AIProviderConfig(m.provider, m)
        except AIModel.DoesNotExist:
            return AIProviderConfig.get_active_config()

    @sync_to_async
    def _get_or_create_conversation(self, conversation_id):
        if conversation_id:
            try:
                return Conversation.objects.get(id=conversation_id, user=self.user)
            except Conversation.DoesNotExist:
                pass
        return Conversation.objects.create(user=self.user, title="New Conversation")

    @sync_to_async
    def _save_message(self, conversation, role, content):
        msg = ChatMessage.objects.create(
            conversation=conversation,
            role=role,
            content=content
        )
        # Update conversation's updated_at
        conversation.save(update_fields=["updated_at"])
        return msg

    @sync_to_async
    def _maybe_set_title(self, conversation, last_user_msg):
        """Set the conversation title from the first user message if still default."""
        return _maybe_set_title_sync(conversation, last_user_msg)