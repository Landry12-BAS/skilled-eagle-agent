import logging
import json
from typing import Iterator, List, Dict, Any
from openai import OpenAI
from .base import BaseLLMProvider
from apps.ai.tools import OPENAI_TOOLS, execute_tool

logger = logging.getLogger(__name__)

class OpenRouterProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "openai/gpt-4o", **kwargs):
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is required for OpenRouterProvider")
        
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        self.model = model

    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=False,
                **kwargs
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenRouter error: {e}")
            raise e

    def stream_response(self, messages: List[Dict[str, Any]], depth: int = 0, **kwargs) -> Iterator[str]:
        if depth > 3:
            yield "\n\n*⚠️ AI stopped: Exceeded maximum tool execution depth. The model is struggling to process the tool results.*"
            return
            
        try:
            native_tools = kwargs.pop("tools", OPENAI_TOOLS)
            request_kwargs = {
                "model": self.model,
                "messages": messages,
                "stream": True,
                **kwargs
            }
            if native_tools is not None:
                request_kwargs["tools"] = native_tools

            response = self.client.chat.completions.create(
                **request_kwargs
            )
            
            tool_calls = {}
            
            for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
                
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls:
                            tool_calls[idx] = {
                                "id": tc.id, 
                                "function": {"name": tc.function.name, "arguments": ""}
                            }
                        if tc.function.arguments:
                            tool_calls[idx]["function"]["arguments"] += tc.function.arguments

            if not tool_calls:
                return

            # Add the assistant's tool calls to the message history
            assistant_message = {
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": call["id"],
                        "type": "function",
                        "function": {
                            "name": call["function"]["name"],
                            "arguments": call["function"]["arguments"]
                        }
                    } for call in tool_calls.values()
                ]
            }
            messages.append(assistant_message)
            
            # Execute tools
            for call in tool_calls.values():
                name = call["function"]["name"]
                arguments_str = call["function"]["arguments"]
                
                try:
                    arguments = json.loads(arguments_str)
                    # Execute tool silently
                    # yield f"\n\n*⚙️ Running tool: {name}({json.dumps(arguments)})*\n\n"
                    result = execute_tool(name, arguments)
                except Exception as e:
                    logger.error(f"Tool execution failed: {e}")
                    result = f"Error: {e}"
                    
                messages.append({
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "name": name,
                    "content": str(result)
                })
            
            # Ask the model to generate the final response
            yield from self.stream_response(messages, depth=depth + 1, tools=native_tools, **kwargs)
                
        except Exception as e:
            logger.error(f"OpenRouter streaming error: {e}")
            yield f"\n\n*❌ Error communicating with the AI: {str(e)}*"
