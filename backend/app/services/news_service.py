from sqlalchemy import desc, select, func, or_
from sqlalchemy.orm import Session

from app.models import Article


def get_latest_articles(
    db: Session,
    limit: int = 40,
    offset: int = 0,
    category: str | None = None,
    source: str | None = None,
    search: str | None = None,
):
    stmt = select(Article)

    if category:
        stmt = stmt.where(Article.category == category)

    if source:
        stmt = stmt.where(Article.source == source)

    if search:
        stmt = stmt.where(
            or_(
                Article.title.ilike(f"%{search}%"),
                Article.summary.ilike(f"%{search}%"),
                Article.content.ilike(f"%{search}%"),
            )
        )

    stmt = (
        stmt.order_by(desc(Article.published_at))
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(stmt).all()

def get_topics(db: Session):
    stmt = (
        select(
            Article.category.label("topic"),
            func.count().label("article_count"),
        )
        .group_by(Article.category)
        .order_by(func.count().desc())
    )

    rows = db.execute(stmt)

    return [
        {
            "topic": row.topic,
            "article_count": row.article_count,
        }
        for row in rows
    ]

def get_article_by_id(
    db: Session,
    article_id: str,
) -> Article | None:
    return db.get(Article, article_id)

def get_sources(db: Session):
    stmt = (
        select(
            Article.source,
            func.count().label("article_count"),
            func.max(Article.published_at).label("latest_article"),
        )
        .group_by(Article.source)
        .order_by(func.count().desc())
    )

    return db.execute(stmt).all()