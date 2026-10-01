import re


TARGET_WORDS = 400
OVERLAP_WORDS = 60


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def split_into_paragraphs(text: str) -> list[str]:
    paragraphs = re.split(
        r"\n\s*\n+",
        text.strip(),
    )

    return [
        normalize_text(paragraph)
        for paragraph in paragraphs
        if paragraph.strip()
    ]


def chunk_article(
    text: str,
    target_words: int = TARGET_WORDS,
    overlap_words: int = OVERLAP_WORDS,
) -> list[str]:

    if not text or not text.strip():
        return []

    words = normalize_text(text).split()

    if len(words) <= target_words:
        return [" ".join(words)]

    chunks = []

    start = 0
    total_words = len(words)

    while start < total_words:

        end = min(
            start + target_words,
            total_words,
        )

        chunk = words[start:end]

        chunks.append(
            " ".join(chunk)
        )

        if end >= total_words:
            break

        start = end - overlap_words

    return chunks