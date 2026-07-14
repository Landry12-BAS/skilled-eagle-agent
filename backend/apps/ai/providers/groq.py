import os
from typing import Iterator, List, Dict, Any
from .base import BaseLLMProvider
from groq import Groq

class GroqProvider(BaseLLMProvider):
    """
    Provider implementation for GroqCloud using the official Groq SDK.
    """

    def __init__(self, api_key: str, model: str, **kwargs):
        self.api_key = api_key
        self.model = model
        # Initialize Groq client
        self.client = Groq(api_key=self.api_key)

    def generate_response(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        """
        Send a full conversation history and get a single complete string response.
        """
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1024),
            stream=False,
        )
        return completion.choices[0].message.content or ""

    def stream_response(self, messages: List[Dict[str, Any]], **kwargs) -> Iterator[str]:
        """
        Send a full conversation history and get a streamed response back token by token.
        """
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1024),
            stream=True,
        )
        
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
