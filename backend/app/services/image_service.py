from typing import Iterable

import httpx

from app.config import settings


class ImageValidator:
    """Verify that a candidate URL actually resolves to a real image."""

    def __init__(self, timeout: float = 8.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0 Safari/537.36"
            )
        }

    def is_valid(self, url: str | None) -> bool:
        if not url or not url.startswith(("http://", "https://")):
            return False

        try:
            with httpx.Client(
                timeout=self.timeout,
                follow_redirects=True,
                headers=self.headers,
            ) as client:
                response = client.head(url)

                # Some servers reject HEAD (405/403); fall back to a
                # header-only streamed GET so we never download the full image.
                if response.status_code >= 400:
                    with client.stream("GET", url) as streamed:
                        if streamed.status_code >= 400:
                            return False
                        content_type = streamed.headers.get(
                            "content-type", ""
                        )
                        return content_type.lower().startswith("image/")

                content_type = response.headers.get("content-type", "")
                return content_type.lower().startswith("image/")

        except Exception:
            return False


image_validator = ImageValidator()


def resolve_image_url(candidates: Iterable[str | None]) -> str:
    """Return the first candidate that resolves to a real image.

    Falls back to the configured general placeholder image when none of the
    candidates are valid, so every stored article always has an image URL.
    """
    for candidate in candidates:
        if image_validator.is_valid(candidate):
            return candidate

    return settings.default_article_image
