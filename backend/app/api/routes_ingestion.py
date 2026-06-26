from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Article
from app.schemas import IngestionResponse
from app.services.rss_service import ingest_all_feeds

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


@router.post("/run", response_model=IngestionResponse)
def run_ingestion(db: Session = Depends(get_db)):
    return ingest_all_feeds(db)


@router.get("/status")
def ingestion_status(db: Session = Depends(get_db)):
    article_count = db.scalar(select(func.count()).select_from(Article)) or 0
    latest_ingestion = db.scalar(select(func.max(Article.ingested_at)))

    return {
        "article_count": article_count,
        "latest_ingestion_at": latest_ingestion,
    }