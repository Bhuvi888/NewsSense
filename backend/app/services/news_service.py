from sqlalchemy.orm import Session

from app.repositories.article_repository import ArticleRepository


def get_latest_articles(
    db: Session,
    limit: int = 20,
    offset: int = 0,
    category: str | None = None,
    source: str | None = None,
    search: str | None = None,
):
    return ArticleRepository.get_latest(
        db=db,
        limit=limit,
        offset=offset,
        category=category,
        source=source,
        search=search,
    )


def get_article_by_id(
    db: Session,
    article_id: str,
):
    return ArticleRepository.get_by_id(
        db,
        article_id,
    )


def get_sources(db: Session):
    return ArticleRepository.get_sources(db)


def get_topics(db: Session):
    return ArticleRepository.get_topics(db)