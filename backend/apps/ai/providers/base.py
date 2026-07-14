import abc
from typing import Iterator, List, Dict, Any

class BaseLLMProvider(abc.ABC):
    """
    Abstract base class defining the contract for all AI LLM Providers.
    """

    @abc.abstractmethod
    def __init__(self, api_key: str, model: str, **kwargs):
        """
        Initialize the provider with the necessary credentials and configuration.
        """
        pass

    @abc.abstractmethod
    def generate_response(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        """
        Send a full conversation history and get a single complete string response.
        
        :param messages: List of dictionaries, e.g., [{"role": "user", "content": "hello"}]
        :return: The generated text response.
        """
        pass

    @abc.abstractmethod
    def stream_response(self, messages: List[Dict[str, Any]], **kwargs) -> Iterator[str]:
        """
        Send a full conversation history and get a streamed response back token by token.
        
        :param messages: List of dictionaries, e.g., [{"role": "user", "content": "hello"}]
        :return: An iterator of string tokens.
        """
        pass
