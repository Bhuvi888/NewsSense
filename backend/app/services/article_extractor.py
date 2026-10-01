from dataclasses import dataclass

import httpx
import trafilatura
from bs4 import BeautifulSoup


@dataclass
class ExtractedArticle:
    content: str
    final_url: str
    status_code: int
    image_url: str | None = None


class ArticleExtractor:
    def __init__(
        self,
        timeout: float = 15.0,
        max_content_length: int = 5_000_000,
    ):
        self.timeout = timeout
        self.max_content_length = max_content_length

        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0 Safari/537.36"
            )
        }

    def fetch_html(self, url: str) -> tuple[str, str, int]:
        with httpx.Client(
            timeout=self.timeout,
            follow_redirects=True,
            headers=self.headers,
        ) as client:
            response = client.get(url)
            response.raise_for_status()

            content_length = len(response.content)

            if content_length > self.max_content_length:
                raise ValueError(
                    f"Response too large: {content_length} bytes"
                )

            return (
                response.text,
                str(response.url),
                response.status_code,
            )

    def extract_image_url(self, html: str) -> str | None:
        """Pull the canonical hero image from Open Graph / Twitter meta tags."""
        try:
            soup = BeautifulSoup(html, "html.parser")

            for key in (
                "og:image",
                "og:image:secure_url",
                "twitter:image",
                "twitter:image:src",
            ):
                tag = soup.find(
                    "meta", attrs={"property": key}
                ) or soup.find(
                    "meta", attrs={"name": key}
                )

                content = tag.get("content") if tag else None

                if content and content.strip():
                    return content.strip()

        except Exception as exc:
            print(f"Image meta parsing failed: {exc}")

        return None

    def extract(self, url: str) -> ExtractedArticle | None:
        try:
            html, final_url, status_code = self.fetch_html(url)

            content = trafilatura.extract(
                html,
                url=final_url,
                include_comments=False,
                include_tables=False,
                favor_precision=True,
            )

            if not content:
                return None

            content = content.strip()

            if not content:
                return None

            return ExtractedArticle(
                content=content,
                final_url=final_url,
                status_code=status_code,
                image_url=self.extract_image_url(html),
            )

        except Exception as exc:
            print(
                f"Article extraction failed for {url}: {exc}"
            )
            return None


article_extractor = ArticleExtractor()