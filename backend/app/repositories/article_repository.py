from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from app.models import Article


class ArticleRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        article_id: str,
    ) -> Article | None:
        return db.get(Article, article_id)

    @staticmethod
    def exists_by_id(
        db: Session,
        article_id: str,
    ) -> bool:
        return db.get(Article, article_id) is not None

    @staticmethod
    def create(
        db: Session,
        article: Article,
    ) -> Article:
        db.add(article)
        return article

    @staticmethod
    def get_latest(
        db: Session,
        limit: int = 20,
        offset: int = 0,
        category: str | None = None,
        source: str | None = None,
        search: str | None = None,
    ) -> list[Article]:

        stmt = select(Article)

        if category:
            stmt = stmt.where(
                Article.category == category
            )

        if source:
            stmt = stmt.where(
                Article.source == source
            )

        if search:
            search_pattern = f"%{search}%"

            stmt = stmt.where(
                or_(
                    Article.title.ilike(search_pattern),
                    Article.summary.ilike(search_pattern),
                    Article.content.ilike(search_pattern),
                )
            )

        stmt = (
            stmt
            .order_by(
                desc(Article.published_at),
                desc(Article.ingested_at),
                desc(Article.id),
            )
            .limit(limit)
            .offset(offset)
        )

        return db.scalars(stmt).all()

    @staticmethod
    def get_topics(db: Session) -> list[dict]:

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

    @staticmethod
    def get_sources(db: Session):

        stmt = (
            select(
                Article.source,
                func.count().label("article_count"),
                func.max(
                    Article.published_at
                ).label("latest_article"),
            )
            .group_by(Article.source)
            .order_by(func.count().desc())
        )

        return db.execute(stmt).all()
    
    

    @staticmethod
    def count(db: Session) -> int:
        return (
            db.scalar(
                select(func.count())
                .select_from(Article)
            )
            or 0
        )

    @staticmethod
    def latest_ingestion(db: Session):
        return db.scalar(
            select(func.max(Article.ingested_at))
        )

    @staticmethod
    def get_all(db: Session) -> list[Article]:
        return db.scalars(
            select(Article)
        ).all()

    @staticmethod
    def get_by_ids(
        db: Session,
        article_ids: list[str],
    ) -> list[Article]:

        if not article_ids:
            return []

        stmt = select(Article).where(
            Article.id.in_(article_ids)
        )

        return db.scalars(stmt).all()