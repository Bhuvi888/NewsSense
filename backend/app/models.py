from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.mysql import LONGTEXT
from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    source_url: Mapped[str] = mapped_column(
        String(768),
        unique=True,
        nullable=False,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    author: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    content: Mapped[str | None] = mapped_column(
        LONGTEXT,
        nullable=True,
    )

    # Article content extraction metadata
    content_source: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )
    content_extracted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    content_word_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    ingested_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )