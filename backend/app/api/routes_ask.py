from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AskRequest, AskResponse
from app.services import rag_service


router = APIRouter(
    prefix="/ask",
    tags=["Ask AI"],
)


@router.post("", response_model=AskResponse)
def ask_ai(
    request: AskRequest,
    db: Session = Depends(get_db),
):
    """
    RAG-powered Q&A endpoint.

    Retrieves relevant article IDs from ChromaDB,
    fetches authoritative article data from MySQL,
    and generates an answer using Gemini.
    """

    result = rag_service.ask(
        db=db,
        question=request.question,
        conversation_history=(
            [
                msg.model_dump()
                for msg in request.conversation_history
            ]
            if request.conversation_history
            else None
        ),
    )

    return result