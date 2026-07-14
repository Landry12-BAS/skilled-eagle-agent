#!/usr/bin/env python
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Boot Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.contrib.auth import get_user_model
from apps.chat.models import Conversation, ChatMessage
from apps.chat.consumers import auto_enrich_messages
from apps.ai.tools import search_web, query_knowledge_base

User = get_user_model()

class VerificationTests(unittest.TestCase):

    def setUp(self):
        # Create a test user for database tests
        self.user, created = User.objects.get_or_create(
            username="test_verification_user",
            email="test_verify@example.com"
        )
        if created:
            self.user.set_password("secure_password_123")
            self.user.save()

    def tearDown(self):
        # Clean up database records
        ChatMessage.objects.filter(conversation__user=self.user).delete()
        Conversation.objects.filter(user=self.user).delete()

    # =========================================================================
    # 1. RAG INTEGRATION VERIFICATION
    # =========================================================================
    @patch('chromadb.PersistentClient')
    def test_rag_chunking_and_storage(self, mock_chroma_client):
        """
        Verify that document upload splits content correctly and calls collection.add.
        """
        from apps.documents.views import DocumentUploadView
        from rest_framework.test import APIRequestFactory
        from django.core.files.uploadedfile import SimpleUploadedFile
        import json

        # Mock collection behaviour
        mock_collection = MagicMock()
        mock_client_instance = MagicMock()
        mock_client_instance.get_or_create_collection.return_value = mock_collection
        mock_chroma_client.return_value = mock_client_instance

        # Patch the global chroma_client in the view module
        with patch('apps.documents.views.chroma_client', mock_client_instance):
            factory = APIRequestFactory()
            
            # Create a mock text file of 2500 words to test chunking
            word_list = ["word"] * 2500
            file_content = " ".join(word_list).encode('utf-8')
            uploaded_file = SimpleUploadedFile("test_doc.txt", file_content, content_type="text/plain")
            
            request = factory.post('/api/documents/upload/', {'file': uploaded_file}, format='multipart')
            
            # Authenticate request
            from rest_framework.test import force_authenticate
            force_authenticate(request, user=self.user)
            
            view = DocumentUploadView.as_view()
            response = view(request)
            
            # Assertions
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.data['filename'], "test_doc.txt")
            
            # 2500 words with chunk_size=1000 should result in 3 chunks (1000, 1000, 500)
            self.assertEqual(response.data['chunks_stored'], 3)
            
            # Verify ChromaDB add was called once with 3 chunks
            mock_collection.add.assert_called_once()
            called_kwargs = mock_collection.add.call_args[1]
            self.assertEqual(len(called_kwargs['documents']), 3)
            self.assertEqual(len(called_kwargs['ids']), 3)
            self.assertEqual(called_kwargs['metadatas'][0]['filename'], "test_doc.txt")
            self.assertEqual(called_kwargs['metadatas'][0]['chunk_index'], 0)
            self.assertEqual(called_kwargs['metadatas'][1]['chunk_index'], 1)
            self.assertEqual(called_kwargs['metadatas'][2]['chunk_index'], 2)

    @patch('chromadb.PersistentClient')
    def test_rag_querying_tools(self, mock_chroma_client):
        """
        Verify that query_knowledge_base in tools.py fetches matching chunks.
        """
        mock_collection = MagicMock()
        mock_collection.name = "documents_collection"
        mock_collection.query.return_value = {
            'documents': [['This is a matching chunk of private document.']],
            'metadatas': [[{'filename': 'secret_doc.txt', 'chunk_index': 0}]]
        }
        
        mock_client_instance = MagicMock()
        mock_client_instance.list_collections.return_value = [mock_collection]
        mock_client_instance.get_collection.return_value = mock_collection
        mock_chroma_client.return_value = mock_client_instance

        # Test query_knowledge_base
        result = query_knowledge_base("some query")
        
        # Verify result contains the mock documents
        self.assertIn("This is a matching chunk", result)
        self.assertIn("secret_doc.txt", result)
        mock_collection.query.assert_called_once_with(
            query_texts=["some query"],
            n_results=5
        )

    @patch('chromadb.PersistentClient')
    def test_rag_auto_enrich_consumers(self, mock_chroma_client):
        """
        Verify that auto_enrich_messages queries ChromaDB and injects it into system message.
        """
        mock_collection = MagicMock()
        mock_collection.name = "documents_collection"
        mock_collection.count.return_value = 1
        mock_collection.query.return_value = {
            'documents': [['Private chunk content from test document.']],
            'metadatas': [[{'filename': 'test_private.txt', 'chunk_index': 1}]]
        }

        mock_client_instance = MagicMock()
        mock_client_instance.list_collections.return_value = [mock_collection]
        mock_client_instance.get_collection.return_value = mock_collection
        mock_chroma_client.return_value = mock_client_instance

        # Patch the global chroma_client in apps.chat.consumers
        with patch('apps.chat.consumers.chroma_client', mock_client_instance):
            messages = [{"role": "user", "content": "How do I setup project X?"}]
            enriched, status = auto_enrich_messages(messages)
            
            # The system message should have been inserted at index 0 and contain the private chunk content
            system_msg = next((m for m in enriched if m["role"] == "system"), None)
            self.assertIsNotNone(system_msg)
            self.assertIn("Private chunk content from test document.", system_msg["content"])
            self.assertIn("Source File: test_private.txt", system_msg["content"])
            self.assertIn("Chunk #1", system_msg["content"])

    # =========================================================================
    # 2. WEB SEARCH VERIFICATION
    # =========================================================================
    @patch('apps.ai.tools.DDGS')
    def test_web_search_logic(self, mock_ddgs):
        """
        Verify that search_web parses and returns results correctly.
        """
        mock_ddgs_instance = MagicMock()
        mock_ddgs_instance.text.return_value = [
            {"title": "Result 1", "href": "https://example.com/1", "body": "Body 1"},
            {"title": "Result 2", "href": "https://example.com/2", "body": "Body 2"}
        ]
        mock_ddgs.return_value.__enter__.return_value = mock_ddgs_instance

        results_str = search_web("python test")
        
        self.assertIn("Result 1", results_str)
        self.assertIn("https://example.com/2", results_str)
        self.assertIn("Body 1", results_str)
        mock_ddgs_instance.text.assert_called_once_with("python test", max_results=5)

    def test_live_web_search_attempt(self):
        """
        Attempt a live web search request to verify DuckDuckGo works in the current environment
        or errors out gracefully due to standard network blockages (CODE_ONLY).
        """
        print("\n--- Live Web Search Test ---")
        try:
            # We use a simple query
            res = search_web("test query", max_results=1)
            print(f"Web search run result length: {len(res)}")
            print(f"Sample response: {res[:200]}...")
            # If we are blocked by network, it will return an error string
            if "Error searching the web" in res:
                print(f"Network block active or service down. Error message: {res}")
            else:
                self.assertTrue(len(res) > 0)
                print("DuckDuckGo live search executed successfully!")
        except Exception as e:
            print(f"Live web search raised exception: {e}")

    # =========================================================================
    # 3. CONVERSATION HISTORY SIDEBAR VERIFICATION
    # =========================================================================
    def test_conversation_history_lifecycle(self):
        """
        Verify conversations and messages are successfully saved in database,
        and can be ordered and retrieved correctly.
        """
        # 1. Create a conversation
        conv = Conversation.objects.create(user=self.user, title="New Conversation")
        self.assertIsNotNone(conv.id)
        self.assertEqual(conv.title, "New Conversation")

        # 2. Save user message
        msg1 = ChatMessage.objects.create(
            conversation=conv,
            role="user",
            content="Hello AI, this is user input."
        )
        self.assertEqual(msg1.conversation, conv)
        self.assertEqual(msg1.role, "user")
        self.assertEqual(msg1.content, "Hello AI, this is user input.")

        # 3. Save assistant message
        msg2 = ChatMessage.objects.create(
            conversation=conv,
            role="assistant",
            content="Hello User! How can I help you?"
        )
        self.assertEqual(msg2.role, "assistant")
        
        # 4. Check auto-title logic
        # If conversation is "New Conversation", it should set title to first message
        # Let's test the title updater helper from consumers.py
        class MockConsumer:
            def __init__(self, user):
                self.user = user
            
            from apps.chat.consumers import _maybe_set_title
        
        consumer = MockConsumer(self.user)
        # Call the bound title setter
        import asyncio
        from asgiref.sync import async_to_sync
        
        @async_to_sync
        async def run_title_set():
            await consumer._maybe_set_title(conv, {"content": "Hello AI, this is user input."})
            
        run_title_set()
        
        # Re-fetch from DB
        conv.refresh_from_db()
        self.assertEqual(conv.title, "Hello AI, this is user input.")

        # 5. Verify ordering: newer updated_at first
        conv2 = Conversation.objects.create(user=self.user, title="Older Conversation")
        # Touch conv to update its updated_at
        conv.title = "Touched Conversation"
        conv.save()
        
        conversations = Conversation.objects.filter(user=self.user)
        self.assertEqual(conversations[0], conv) # Newest updated should be first
        self.assertEqual(conversations[1], conv2)

    # =========================================================================
    # 4. SPEECH-TO-TEXT EVENT HANDLERS VERIFICATION
    # =========================================================================
    def test_frontend_speech_recognition_bindings(self):
        """
        Statically parse ChatInterface.tsx to verify SpeechRecognition handlers
        are correctly defined and bind to input.
        """
        print("\n--- Speech-To-Text Static Verification ---")
        chat_interface_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '../frontend/src/features/chat/components/ChatInterface.tsx')
        )
        
        self.assertTrue(os.path.exists(chat_interface_path), f"File not found: {chat_interface_path}")
        
        with open(chat_interface_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check browser SpeechRecognition API support definition
        self.assertIn("SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition", content,
            "SpeechRecognition instantiation does not fall back to webkitSpeechRecognition correctly.")
        
        # Check event handlers
        self.assertIn("recognition.onstart", content, "Missing recognition.onstart handler.")
        self.assertIn("recognition.onerror", content, "Missing recognition.onerror handler.")
        self.assertIn("recognition.onend", content, "Missing recognition.onend handler.")
        self.assertIn("recognition.onresult", content, "Missing recognition.onresult handler.")

        # Check binding of result to input state
        self.assertIn("setInput((prev) => prev ? `${prev} ${transcript}` : transcript)", content,
            "SpeechRecognition result does not bind transcript to the input state correctly.")

        # Check toggle button binds to toggleSpeechRecognition
        self.assertIn("onClick={toggleSpeechRecognition}", content,
            "The Speech recognition toggler click handler is not bound to the correct function.")
            
        print("Frontend Speech-to-Text static verification checks passed successfully!")

if __name__ == '__main__':
    unittest.main()
