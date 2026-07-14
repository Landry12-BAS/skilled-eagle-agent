import os
from typing import Optional
from .base import BaseLLMProvider
from .groq import GroqProvider
from .gemini import GeminiProvider
from .openrouter import OpenRouterProvider
from .nvidia import NvidiaProvider

class ProviderFactory:
    """
    Factory to instantiate the correct AI Provider based on configuration.
    """
    
    @staticmethod
    def get_provider(provider_name: str, model_name: Optional[str] = None, db_api_key: Optional[str] = None) -> BaseLLMProvider:
        provider_name = provider_name.lower().strip()
        
        if provider_name == "groqcloud":
            api_key = db_api_key or os.environ.get("GROQ_API_KEY")
            model = model_name or os.environ.get("GROQ_DEFAULT_MODEL", "llama3-70b-8192")
            return GroqProvider(api_key=api_key, model=model)
            
        elif provider_name == "gemini":
            api_key = db_api_key or os.environ.get("GEMINI_API_KEY")
            model = model_name or os.environ.get("GEMINI_DEFAULT_MODEL", "gemini-1.5-flash")
            return GeminiProvider(api_key=api_key, model=model)
            
        elif provider_name == "openrouter":
            api_key = db_api_key or os.environ.get("OPENROUTER_API_KEY")
            model = model_name or os.environ.get("OPENROUTER_DEFAULT_MODEL", "openai/gpt-4o")
            return OpenRouterProvider(api_key=api_key, model=model)
            
        elif provider_name == "nvidia":
            api_key = db_api_key or os.environ.get("NVIDIA_API_KEY")
            model = model_name or os.environ.get("NVIDIA_DEFAULT_MODEL", "meta/llama3-70b-instruct")
            return NvidiaProvider(api_key=api_key, model=model)
            
        else:
            raise ValueError(f"Unsupported AI Provider: {provider_name}")
