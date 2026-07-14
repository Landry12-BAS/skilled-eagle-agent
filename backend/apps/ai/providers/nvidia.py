import logging
import time
from typing import Iterator, List, Dict, Any
from openai import OpenAI, RateLimitError
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 5  # seconds


class NvidiaProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "meta/llama3-70b-instruct", **kwargs):
        if not api_key:
            raise ValueError("NVIDIA_API_KEY is required for NvidiaProvider")

        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
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
            logger.error(f"Nvidia error: {e}")
            raise e

    def stream_response(self, messages: List[Dict[str, Any]], depth: int = 0, **kwargs) -> Iterator[str]:
        delay = INITIAL_RETRY_DELAY

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    stream=True,
                    **kwargs
                )

                for chunk in response:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield delta.content

                # Successful stream — we're done
                return

            except RateLimitError as e:
                if attempt < MAX_RETRIES:
                    logger.warning(f"Nvidia 429 rate limit hit (attempt {attempt}/{MAX_RETRIES}). Retrying in {delay}s...")
                    yield f"*⏳ AI rate limit reached. Retrying in {delay} seconds (attempt {attempt}/{MAX_RETRIES})...*\n\n"
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                else:
                    logger.error(f"Nvidia rate limit exceeded after {MAX_RETRIES} attempts: {e}")
                    yield (
                        f"\n\n*❌ The AI model ({self.model}) is currently rate-limited by Nvidia NIM.*\n\n"
                        f"**Please try one of the following:**\n"
                        f"- Wait 1-2 minutes and try again\n"
                        f"- Go to [Django Admin](http://localhost:8000/admin/ai/aiproviderconfig/) and switch to a different model\n"
                    )
                    return

            except Exception as e:
                logger.error(f"Nvidia streaming error: {e}")
                yield f"\n\n*❌ Error communicating with the AI: {str(e)}*"
                return
