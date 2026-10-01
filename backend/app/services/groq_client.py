"""Groq client with ordered API-key rotation on quota/key failures."""

import logging
import threading
from typing import Any

from openai import OpenAI

from app.config import settings


logger = logging.getLogger(__name__)


class RotatingGroqClient:
    """Keep using one key until it is rejected, then move to the next key."""

    def __init__(self, api_keys: list[str] | None = None):
        self._api_keys = api_keys or settings.get_groq_api_keys()
        if not self._api_keys:
            raise RuntimeError("No Groq API key is configured.")

        self._clients = [
            OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
            )
            for api_key in self._api_keys
        ]
        self._active_index = 0
        self._lock = threading.Lock()

    @property
    def key_count(self) -> int:
        return len(self._clients)

    def _active_client(self) -> tuple[int, OpenAI]:
        with self._lock:
            index = self._active_index
        return index, self._clients[index]

    def _rotate(self, failed_index: int) -> bool:
        with self._lock:
            # Another concurrent request may already have rotated the key.
            if self._active_index == failed_index:
                if failed_index + 1 >= len(self._clients):
                    return False
                self._active_index = failed_index + 1
            return True

    @staticmethod
    def _should_rotate(error: Exception) -> bool:
        status_code = getattr(error, "status_code", None)
        if status_code in {401, 403, 429}:
            return True

        message = str(error).lower()
        markers = (
            "rate limit",
            "rate_limit",
            "quota",
            "token limit",
            "tokens per",
            "exceeded",
            "too many requests",
        )
        return any(marker in message for marker in markers)

    def create_chat_completion(self, **kwargs: Any):
        """Create a completion and retry on each remaining key if necessary."""
        attempted = set()

        while True:
            index, client = self._active_client()
            if index in attempted:
                raise RuntimeError("All configured Groq API keys are exhausted.")
            attempted.add(index)

            try:
                return client.chat.completions.create(**kwargs)
            except Exception as error:
                if not self._should_rotate(error):
                    raise

                logger.warning(
                    "Groq key %d/%d was rejected (%s); rotating to the next key.",
                    index + 1,
                    len(self._clients),
                    type(error).__name__,
                )
                if not self._rotate(index):
                    raise RuntimeError(
                        "All configured Groq API keys are exhausted."
                    ) from error


_client: RotatingGroqClient | None = None
_client_lock = threading.Lock()


def get_groq_client() -> RotatingGroqClient:
    """Return the process-wide client so rotation survives across requests."""
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = RotatingGroqClient()
    return _client
