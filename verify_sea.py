import os
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
import sys
import django
import asyncio
import json
from unittest.mock import MagicMock, patch

# Initialize Django
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from channels.testing import WebsocketCommunicator
from config.asgi import application

class MockProvider:
    def __init__(self, *args, **kwargs):
        self.call_count = 0

    def stream_response(self, messages, **kwargs):
        self.call_count += 1
        if self.call_count == 1:
            # First turn: trigger a read_file tool call on QUICK_START.md
            yield "I will read the file.\nAction:\n```json\n{\n  \"tool\": \"read_file\",\n  \"arguments\": {\"path\": \"QUICK_START.md\"}\n}\n```"
        else:
            # Second turn: final answer based on tool output
            # Check if user observation is in messages
            observation_msg = next((m for m in reversed(messages) if m.get("role") == "user" and "Observation:" in m.get("content", "")), None)
            if observation_msg:
                yield f"Final answer: Successfully read the file. Content length: {len(observation_msg['content'])}"
            else:
                yield "Final answer: Observation not found."

from asgiref.sync import sync_to_async

@sync_to_async
def setup_user_and_get_token():
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import RefreshToken
    User = get_user_model()
    user, created = User.objects.get_or_create(username="seatestuser", email="sea@example.com")
    if created:
        user.set_password("seapassword123")
        user.save()
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

async def test_sea_react_loop():
    # 1. Setup user and token
    token = await setup_user_and_get_token()

    # 2. Mock provider config and provider factory
    mock_config = MagicMock()
    mock_config.provider_name = "gemini"
    mock_config.model_name = "gemini-1.5-flash"
    mock_config.api_key = "mock-key"

    mock_provider = MockProvider()

    print("Starting verification test...")

    # We patch the AI config and factory inside the consumers module
    with patch("apps.ai.models.AIProviderConfig.get_active_config", return_value=mock_config), \
         patch("apps.ai.providers.factory.ProviderFactory.get_provider", return_value=mock_provider):

        # 3. Connect to the WebSocket route using WebsocketCommunicator
        # The routing maps /ws/sea/ to SEAConsumer.as_asgi()
        communicator = WebsocketCommunicator(application, f"ws/sea/?token={token}")
        connected, subprotocol = await communicator.connect()
        if not connected:
            print("FAILED: Could not connect to WebSocket.")
            sys.exit(1)

        print("Connected to WebSocket successfully.")

        # 4. Send a user request
        await communicator.send_json_to({
            "message": "Please read QUICK_START.md using the tool"
        })

        # 5. Listen and assert events
        tool_started = False
        tool_done = False
        tokens_received = []
        done_received = False

        # Read responses
        for _ in range(50):  # limit loop to prevent infinite hang
            try:
                response = await communicator.receive_json_from(timeout=2.0)
                print("Received Event:", response)
                
                type_ = response.get("type")
                if type_ == "token":
                    tokens_received.append(response.get("content"))
                elif type_ == "tool_start":
                    if response.get("tool") == "read_file" and response.get("arguments", {}).get("path") == "QUICK_START.md":
                        tool_started = True
                elif type_ == "tool_done":
                    if response.get("tool") == "read_file" and "quick start" in response.get("output", "").lower():
                        tool_done = True
                elif type_ == "done":
                    done_received = True
                    break
                elif type_ == "error":
                    print("Error event received:", response)
                    break
            except asyncio.TimeoutError:
                break

        # 6. Disconnect
        await communicator.disconnect()

        # 7. Check assertions
        print("\n--- Test Assertions ---")
        print(f"Tool execution started: {tool_started}")
        print(f"Tool execution done: {tool_done}")
        print(f"Tokens streamed: {len(tokens_received) > 0} (count: {len(tokens_received)})")
        print(f"Done event received: {done_received}")

        assert tool_started, "Tool start event was not received or incorrect"
        assert tool_done, "Tool done event was not received or did not return QUICK_START.md content"
        assert done_received, "Done event was not received"
        print("SUCCESS: All verification assertions passed!")

if __name__ == "__main__":
    asyncio.run(test_sea_react_loop())
