from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ArticleResponse, ArticleListResponse, SourceResponse, TopicResponse
from app.services.news_service import get_latest_articles, get_article_by_id, get_sources, get_topics

router = APIRouter(
    prefix="/news",
    tags=["News"],
)


@router.get(
    "",
    response_model=list[ArticleListResponse],
)
def get_news(
    limit: int = 20,
    offset: int = 0,
    category: str | None = None,
    source: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    return get_latest_articles(
        db=db,
        limit=limit,
        offset=offset,
        category=category,
        source=source,
        search=search,
    )
@router.get(
    "/sources",
    response_model=list[SourceResponse],
)
def sources(
    db: Session = Depends(get_db),
):
    rows = get_sources(db)

    return [
        SourceResponse(
            source=row.source,
            article_count=row.article_count,
            latest_article=row.latest_article,
        )
        for row in rows
    ]

@router.get(
    "/topics",
    response_model=list[TopicResponse],
)
def topics(
    db: Session = Depends(get_db),
):
    return get_topics(db)
@router.get(
    "/{article_id}",
    response_model=ArticleResponse,
)
def get_article(
    article_id: str,
    db: Session = Depends(get_db),
):
    article = get_article_by_id(
        db=db,
        article_id=article_id,
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="Article not found",
        )

    return article

