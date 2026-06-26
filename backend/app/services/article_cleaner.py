import re

from bs4 import BeautifulSoup


def clean_html(raw_html: str | None) -> str:
    if not raw_html:
        return ""

    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(" ", strip=True)

    return re.sub(r"\s+", " ", text).strip()