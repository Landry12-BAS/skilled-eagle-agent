import os
from typing import Iterator, List, Dict, Any
from .base import BaseLLMProvider
import google.generativeai as genai

class GeminiProvider(BaseLLMProvider):
    """
    Provider implementation for Google Gemini using the official SDK.
    """

    def __init__(self, api_key: str, model: str, **kwargs):
        self.api_key = api_key
        # Gemini typically uses models like 'gemini-1.5-flash'
        self.model = model
        genai.configure(api_key=self.api_key)

    def _convert_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert standard OpenAI-style messages to Gemini format.
        Gemini roles: 'user' and 'model' (instead of 'assistant').
        """
        gemini_msgs = []
        system_prompt = ""
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                if isinstance(content, list):
                    system_prompt += " ".join([c["text"] for c in content if c.get("type") == "text"]) + "\n\n"
                else:
                    system_prompt += str(content) + "\n\n"
            elif role == "assistant":
                if isinstance(content, list):
                    parts = [c["text"] for c in content if c.get("type") == "text"]
                    gemini_msgs.append({"role": "model", "parts": parts})
                else:
                    gemini_msgs.append({"role": "model", "parts": [str(content)]})
            else:
                # user
                parts = []
                if isinstance(content, list):
                    for c in content:
                        if c.get("type") == "text":
                            parts.append(c["text"])
                        elif c.get("type") == "image_url":
                            url = c["image_url"]["url"]
                            if url.startswith("data:"):
                                mime_b64 = url.split(";base64,")
                                if len(mime_b64) == 2:
                                    mime = mime_b64[0].replace("data:", "")
                                    b64 = mime_b64[1]
                                    import base64
                                    parts.append({
                                        "mime_type": mime,
                                        "data": base64.b64decode(b64)
                                    })
                else:
                    parts = [str(content)]
                
                gemini_msgs.append({"role": "user", "parts": parts})
                
        # If there is a system prompt, prepend it to the first user message
        if system_prompt and gemini_msgs:
            first_user = next((m for m in gemini_msgs if m["role"] == "user"), None)
            if first_user:
                if isinstance(first_user["parts"][0], str):
                    first_user["parts"][0] = system_prompt + first_user["parts"][0]
                else:
                    first_user["parts"].insert(0, system_prompt)
            else:
                gemini_msgs.insert(0, {"role": "user", "parts": [system_prompt]})
                
        return gemini_msgs

    def generate_response(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        """
        Send a full conversation history and get a single complete string response.
        """
        gemini_msgs = self._convert_messages(messages)
        model = genai.GenerativeModel(self.model)
        
        generation_config = genai.types.GenerationConfig(
            temperature=kwargs.get("temperature", 0.7),
            max_output_tokens=kwargs.get("max_tokens", 1024),
        )
        
        response = model.generate_content(
            gemini_msgs,
            generation_config=generation_config,
            stream=False
        )
        return response.text

    def stream_response(self, messages: List[Dict[str, Any]], **kwargs) -> Iterator[str]:
        """
        Send a full conversation history and get a streamed response back token by token.
        """
        gemini_msgs = self._convert_messages(messages)
        model = genai.GenerativeModel(self.model)
        
        generation_config = genai.types.GenerationConfig(
            temperature=kwargs.get("temperature", 0.7),
            max_output_tokens=kwargs.get("max_tokens", 1024),
        )
        
        response = model.generate_content(
            gemini_msgs,
            generation_config=generation_config,
            stream=True
        )
        
        for chunk in response:
            if chunk.text:
                yield chunk.text
