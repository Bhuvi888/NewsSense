from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleResponse(BaseModel):
    id: str
    title: str
    source: str
    source_url: str
    published_at: datetime | None
    category: str
    author: str | None
    summary: str | None
    content: str | None
    image_url: str | None
    ingested_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IngestionResponse(BaseModel):
    feeds_processed: int
    articles_found: int
    articles_added: int
    duplicates_skipped: int
    errors: list[str]