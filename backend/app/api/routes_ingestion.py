from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import IngestionResponse
from app.services.ingestion_service import (
    run_ingestion,
    get_ingestion_status,
    backfill_vectors,
)

router = APIRouter(
    prefix="/ingestion",
    tags=["Ingestion"],
)


@router.post(
    "/run",
    response_model=IngestionResponse,
)
def run_ingestion_route(
    db: Session = Depends(get_db),
):
    return run_ingestion(db)


@router.get("/status")
def ingestion_status_route(
    db: Session = Depends(get_db),
):
    return get_ingestion_status(db)


@router.post("/backfill-vectors")
def backfill_vectors_route(
    db: Session = Depends(get_db),
):
    return backfill_vectors(db)