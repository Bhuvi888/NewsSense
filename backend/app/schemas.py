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




class ArticleListResponse(BaseModel):
    id: str
    title: str
    source: str
    source_url: str
    published_at: datetime | None
    category: str
    author: str | None
    summary: str | None
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)

class SourceResponse(BaseModel):
    source: str
    article_count: int
    latest_article: datetime | None

class TopicResponse(BaseModel):
    topic: str
    article_count: int


class ChatMessage(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    question: str
    conversation_history: list[ChatMessage] | None = None


class AskSourceResponse(BaseModel):
    title: str
    source: str
    url: str
    published_at: str


class AskResponse(BaseModel):
    answer: str
    sources: list[AskSourceResponse]