import json
import asyncio
import os
import re
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.conf import settings
from apps.ai.models import AIProviderConfig
from apps.ai.providers.factory import ProviderFactory
from apps.chat.models import ChatMessage, Conversation
from .tools import github_list_branches, github_list_repositories, github_read_file, read_file, write_file, list_dir, run_shell

logger = logging.getLogger(__name__)

def parse_action(text):
    """
    Parses the ReAct action block from the assistant's response.
    Supports formats:
    Action:
    ```json
    {
      "tool": "...",
      "arguments": {...}
    }
    ```
    And also direct Action: { ... } without backticks.
    """
    pattern1 = r"Action:\s*```(?:json)?\s*(\{.*?\})\s*```"
    match = re.search(pattern1, text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            action_data = json.loads(match.group(1).strip())
            tool = action_data.get("tool")
            arguments = action_data.get("arguments", {})
            if not isinstance(arguments, dict):
                # Fallback: if arguments are at root level
                arguments = {k: v for k, v in action_data.items() if k not in ("tool", "arguments")}
            return tool, arguments, match.start(), match.end()
        except Exception:
            pass

    pattern2 = r"Action:\s*(\{.*?\})"
    match = re.search(pattern2, text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            action_data = json.loads(match.group(1).strip())
            tool = action_data.get("tool")
            arguments = action_data.get("arguments", {})
            if not isinstance(arguments, dict):
                arguments = {k: v for k, v in action_data.items() if k not in ("tool", "arguments")}
            return tool, arguments, match.start(), match.end()
        except Exception:
            pass

    return None, None, -1, -1


def display_message_from_payload(messages, display_message=""):
    if display_message:
        return str(display_message)

    last_user_msg = next((m for m in reversed(messages) if m.get("role") == "user"), None)
    if not last_user_msg:
        return ""

    content = last_user_msg.get("content", "")
    if isinstance(content, list):
        return " ".join(str(item.get("text", "")) for item in content if item.get("type") == "text").strip()

    text = str(content)
    marker = "\n\nRequest: "
    return text.rsplit(marker, 1)[-1].strip() if marker in text else text.strip()


def is_github_repository_list_request(text):
    normalized = str(text or "").lower()
    github_terms = ("github", "git hub")
    repository_terms = ("repo", "repos", "repository", "repositories", "repertory", "repertories")
    return (
        any(term in normalized for term in github_terms)
        and any(term in normalized for term in repository_terms)
    )


def github_repository_from_text(text):
    match = re.search(r"\b([\w.-]+/[\w.-]+)\b", str(text or ""))
    return match.group(1).rstrip(".,:;") if match else ""


def is_github_repository_inspect_request(text):
    normalized = str(text or "").lower()
    if not github_repository_from_text(text):
        return False
    inspect_terms = ("tell me about", "explain", "inspect", "what is", "describe", "about this")
    return any(term in normalized for term in inspect_terms)


class SEAConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"sea_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
            messages = data.get("messages")
            if not messages:
                prompt = data.get("message") or data.get("content")
                if prompt:
                    messages = [{"role": "user", "content": prompt}]

            if not messages:
                return
            github_context = data.get("github_context") or {}
            conversation_id = data.get("conversation_id")
            requested_model_id = data.get("model_id")
            display_message = display_message_from_payload(messages, data.get("display_message") or "")

            # Start the autonomous ReAct agent loop
            asyncio.create_task(self.run_agent_loop(messages, github_context, conversation_id, display_message, requested_model_id))

        except Exception as e:
            logger.error(f"Error in SEAConsumer receive: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "content": f"Failed to process message: {str(e)}"
            }))

    async def run_agent_loop(self, messages, github_context=None, conversation_id=None, display_message="", requested_model_id=None):
        try:
            conversation = await self._get_or_create_conversation(conversation_id)
            if display_message:
                await self._save_message(conversation, "user", display_message)

            github_context = github_context or {}
            github_token = github_context.get("token") or ""
            github_account = github_context.get("account") or ""
            github_repository = github_context.get("repository") or ""
            github_branch = github_context.get("branch") or ""
            logger.info(f"SEA agent loop: github_token={'YES' if github_token else 'NO'}, account={github_account}, repo={github_repository}, branch={github_branch}")

            if is_github_repository_list_request(display_message):
                if github_token:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "sea.event",
                            "payload": {
                                "type": "tool_start",
                                "tool": "github_list_repositories",
                                "arguments": {}
                            }
                        }
                    )
                    repos = await sync_to_async(github_list_repositories)(github_token)
                    response = f"GitHub repositories for @{github_account or 'connected account'}:\n\n{repos}"
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "sea.event",
                            "payload": {
                                "type": "tool_done",
                                "tool": "github_list_repositories",
                                "output": repos
                            }
                        }
                    )
                else:
                    response = "GitHub is not connected for this SEA session. Connect GitHub from Plugins, then try again."

                await self._save_message(conversation, "assistant", response)
                if display_message:
                    await self._maybe_set_title(conversation, display_message)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "sea.event",
                        "payload": {
                            "type": "token",
                            "content": response
                        }
                    }
                )
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "sea.event",
                        "payload": {
                            "type": "done",
                            "conversation_id": conversation.id
                        }
                    }
                )
                return

            if is_github_repository_inspect_request(display_message):
                repository = github_repository_from_text(display_message)
                if github_token:
                    root = await sync_to_async(github_read_file)(github_token, repository, "", github_branch or None)
                    readme = ""
                    for readme_path in ("README.md", "readme.md", "README"):
                        readme = await sync_to_async(github_read_file)(github_token, repository, readme_path, github_branch or None)
                        if not readme.startswith("GitHub repository, branch, or file was not found"):
                            break
                    package_json = await sync_to_async(github_read_file)(github_token, repository, "package.json", github_branch or None)
                    response_parts = [
                        f"Repository: {repository}",
                        "",
                        "Root files:",
                        root[:4000],
                    ]
                    if readme and not readme.startswith("GitHub repository, branch, or file was not found"):
                        response_parts.extend(["", "README:", readme[:4000]])
                    if package_json and not package_json.startswith("GitHub repository, branch, or file was not found"):
                        response_parts.extend(["", "package.json:", package_json[:2500]])
                    response = "\n".join(response_parts)
                else:
                    response = "GitHub is not connected for this SEA session. Connect GitHub from Plugins, then try again."

                await self._save_message(conversation, "assistant", response)
                if display_message:
                    await self._maybe_set_title(conversation, display_message)
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "sea.event", "payload": {"type": "token", "content": response}}
                )
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "sea.event", "payload": {"type": "done", "conversation_id": conversation.id}}
                )
                return

            # 1. Prepare system prompt
            current_dir = os.path.dirname(os.path.abspath(__file__))
            eagle_path = os.path.join(current_dir, "prompts", "eagle.txt")
            eagle_text = ""
            if os.path.exists(eagle_path):
                with open(eagle_path, 'r', encoding='utf-8') as f:
                    eagle_text = f.read()
            else:
                # Fallback: extract it if the file doesn't exist yet but PDF exists
                pdf_path = "/Users/kibobodjona/.gemini/antigravity/brain/6b5df5da-ac4a-41ba-bb27-313dbbb105a8/media__1783896270586.pdf"
                if os.path.exists(pdf_path):
                    try:
                        import fitz
                        doc = fitz.open(pdf_path)
                        eagle_text = "".join(page.get_text() for page in doc)
                        os.makedirs(os.path.dirname(eagle_path), exist_ok=True)
                        with open(eagle_path, 'w', encoding='utf-8') as f:
                            f.write(eagle_text)
                    except Exception as err:
                        logger.error(f"Fallback extraction failed: {err}")

            # Build tool and GitHub instructions FIRST so the model always sees them
            tool_preamble = (
                "=== AVAILABLE TOOLS ===\n"
                "You have the following tools available. To use a tool, respond with:\n"
                "Action:\n"
                "```json\n"
                "{\n"
                "  \"tool\": \"tool_name\",\n"
                "  \"arguments\": {\"arg_name\": \"arg_value\"}\n"
                "}\n"
                "```\n"
                "After using a tool, you will receive: Observation: [output]\n"
                "Then you can use another tool or respond to the user.\n\n"
                "LOCAL FILESYSTEM TOOLS:\n"
                "- read_file: Read file contents. Arguments: {\"path\": \"<file_path>\"}\n"
                "- write_file: Create or overwrite a file. Arguments: {\"path\": \"<file_path>\", \"content\": \"<content>\"}\n"
                "- list_dir: List directory contents. Arguments: {\"path\": \"<directory_path>\"}\n"
                "- run_shell: Run a shell command. Arguments: {\"command\": \"<shell_command>\"}\n\n"
            )

            if github_token:
                github_section = (
                    "GITHUB TOOLS (ACTIVE — GitHub IS connected):\n"
                    f"- Connected GitHub account: {github_account or 'unknown'}\n"
                    f"- Selected repository: {github_repository or 'none'}\n"
                    f"- Selected branch: {github_branch or 'none'}\n\n"
                    "- github_list_repositories: List all repositories accessible by the connected GitHub account. Arguments: {} (no arguments needed)\n"
                    "- github_list_branches: List branches of a repository. Arguments: {\"repository\": \"owner/repo\"}\n"
                    "- github_read_file: Read a file or list a directory in a GitHub repo. Arguments: {\"repository\": \"owner/repo\", \"path\": \"<path>\", \"ref\": \"<branch>\"}\n\n"
                    "IMPORTANT: GitHub IS connected. Do NOT say GitHub tools are unavailable. "
                    "When the user asks about GitHub repos, use github_list_repositories immediately. "
                    "When asked about branches, use github_list_branches. "
                    "When asked to read files from GitHub, use github_read_file.\n"
                    "=== END TOOLS ===\n\n"
                )
            else:
                github_section = (
                    "GITHUB TOOLS: Not connected for this session. GitHub tools are not available.\n"
                    "=== END TOOLS ===\n\n"
                )

            system_content = tool_preamble + github_section + eagle_text

            # Prepend system prompt to the messages list
            agent_messages = [{"role": "system", "content": system_content}] + [
                m for m in messages if m.get("role") != "system"
            ]

            # 2. Get active provider config
            if requested_model_id:
                config = await sync_to_async(self._get_config_for_model)(requested_model_id)
            else:
                config = await sync_to_async(AIProviderConfig.get_active_config)()
            if not config:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "sea.event",
                        "payload": {
                            "type": "error",
                            "content": "No active AI provider configuration found."
                        }
                    }
                )
                return

            provider = ProviderFactory.get_provider(config.provider_name, config.model_name, config.api_key)

            # 3. Autonomous agent loop
            while True:
                q = asyncio.Queue()
                loop = asyncio.get_running_loop()
                full_response = []
                action_detected = False

                def sync_stream_and_queue(queue, event_loop, msgs):
                    try:
                        # stream response with slightly lower temperature for tools
                        for token in provider.stream_response(msgs, temperature=0.1, max_tokens=2048, tools=None):
                            full_response.append(token)
                            event_loop.call_soon_threadsafe(queue.put_nowait, {"type": "token", "content": token})
                        event_loop.call_soon_threadsafe(queue.put_nowait, {"type": "done"})
                    except Exception as err:
                        event_loop.call_soon_threadsafe(queue.put_nowait, {"type": "error", "content": str(err)})

                # Run stream_response generator in thread pool executor
                loop.run_in_executor(None, sync_stream_and_queue, q, loop, agent_messages)

                while True:
                    item = await q.get()
                    if item["type"] == "token":
                        token = item["content"]
                        current_full = "".join(full_response)
                        if "action:" in current_full.lower():
                            action_detected = True

                        if not action_detected:
                            await self.channel_layer.group_send(
                                self.group_name,
                                {
                                    "type": "sea.event",
                                    "payload": {
                                        "type": "token",
                                        "content": token
                                    }
                                }
                            )
                    elif item["type"] == "done":
                        break
                    elif item["type"] == "error":
                        await self.channel_layer.group_send(
                            self.group_name,
                            {
                                "type": "sea.event",
                                "payload": {
                                    "type": "error",
                                    "content": item["content"]
                                }
                            }
                        )
                        return

                assistant_response = "".join(full_response)
                agent_messages.append({"role": "assistant", "content": assistant_response})

                # Parse tool call
                tool, arguments, _, _ = parse_action(assistant_response)

                if tool:
                    # Broadcast tool_start
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "sea.event",
                            "payload": {
                                "type": "tool_start",
                                "tool": tool,
                                "arguments": arguments
                            }
                        }
                    )

                    # Execute the tool
                    tool_output = ""
                    try:
                        if tool == "read_file":
                            path = arguments.get("path") or arguments.get("file_path")
                            tool_output = read_file(path)
                        elif tool == "write_file":
                            path = arguments.get("path") or arguments.get("file_path")
                            content = arguments.get("content")
                            tool_output = write_file(path, content)
                        elif tool == "list_dir":
                            path = arguments.get("path", ".") or arguments.get("directory", ".")
                            tool_output = list_dir(path)
                        elif tool == "run_shell":
                            command = arguments.get("command")
                            lines = []
                            async for stream_type, line in run_shell(command):
                                lines.append(line)
                                await self.channel_layer.group_send(
                                    self.group_name,
                                    {
                                        "type": "sea.event",
                                        "payload": {
                                            "type": "terminal_log",
                                            "stream": stream_type,
                                            "content": line
                                        }
                                    }
                                )
                            tool_output = "".join(lines)
                        elif tool == "github_list_repositories":
                            tool_output = github_list_repositories(github_token)
                        elif tool == "github_list_branches":
                            repository = arguments.get("repository") or github_repository
                            tool_output = github_list_branches(github_token, repository)
                        elif tool == "github_read_file":
                            repository = arguments.get("repository") or github_repository
                            path = arguments.get("path") or arguments.get("file_path")
                            ref = arguments.get("ref") or arguments.get("branch") or github_branch
                            tool_output = github_read_file(github_token, repository, path, ref)
                        else:
                            tool_output = f"Error: Unknown tool '{tool}'."
                    except Exception as err:
                        tool_output = f"Error executing tool: {str(err)}"

                    # Broadcast tool_done
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "sea.event",
                            "payload": {
                                "type": "tool_done",
                                "tool": tool,
                                "output": tool_output
                            }
                        }
                    )

                    # Append tool observation
                    agent_messages.append({"role": "user", "content": f"Observation: {tool_output}"})
                    # Loop again
                    continue
                else:
                    # Final assistant message streamed and no tool called
                    await self._save_message(conversation, "assistant", assistant_response)
                    if display_message:
                        await self._maybe_set_title(conversation, display_message)
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "sea.event",
                            "payload": {
                                "type": "done",
                                "conversation_id": conversation.id
                            }
                        }
                    )
                    break

        except Exception as e:
            logger.error(f"Error in run_agent_loop: {e}")
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "sea.event",
                    "payload": {
                        "type": "error",
                        "content": f"Internal agent error: {str(e)}"
                    }
                }
            )

    async def sea_event(self, event):
        """
        Receives messages sent via channel_layer.group_send and forwards them to the WebSocket.
        """
        await self.send(text_data=json.dumps(event["payload"]))

    @sync_to_async
    def _get_or_create_conversation(self, conversation_id):
        if conversation_id:
            try:
                return Conversation.objects.get(id=conversation_id, user=self.user)
            except Conversation.DoesNotExist:
                pass
        return Conversation.objects.create(
            user=self.user,
            kind=Conversation.KIND_SEA,
            title="New Task"
        )

    @sync_to_async
    def _save_message(self, conversation, role, content):
        message = ChatMessage.objects.create(
            conversation=conversation,
            role=role,
            content=content
        )
        conversation.save(update_fields=["updated_at"])
        return message

    @sync_to_async
    def _maybe_set_title(self, conversation, user_content):
        if conversation.title not in {"New Conversation", "New Task"} or not user_content:
            return
        conversation.title = user_content[:60] + ("..." if len(user_content) > 60 else "")
        conversation.save(update_fields=["title"])

    def _get_config_for_model(self, model_pk):
        from apps.ai.models import AIModel, AIProviderConfig
        try:
            model = AIModel.objects.select_related("provider").get(pk=model_pk, is_active=True)
            return AIProviderConfig(model.provider, model)
        except AIModel.DoesNotExist:
            return AIProviderConfig.get_active_config()
