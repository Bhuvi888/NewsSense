"""Evaluate the end-to-end Newsense RAG pipeline with Ragas.

Fill evaluation/ragas_golden_set.json with verified questions, reference
answers, and supporting reference passages before running this script.
"""

import json
import sys
import types
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

vertexai_module = types.ModuleType(
    "langchain_community.chat_models.vertexai"
)
# Ragas imports this legacy symbol during startup. The evaluator uses the
# Gemini adapter below, so no Vertex AI implementation is needed here.
vertexai_module.ChatVertexAI = type("ChatVertexAI", (), {})
sys.modules[
    "langchain_community.chat_models.vertexai"
] = vertexai_module

from ragas import evaluate
from ragas.dataset_schema import EvaluationDataset, SingleTurnSample
from ragas.metrics import ContextPrecision, ContextRecall, Faithfulness
from ragas.llms import LangchainLLMWrapper
from ragas.run_config import RunConfig

from app.config import settings
from app.database import SessionLocal
from app.services.rag_service import ask
from app.services.vector_store import vector_store
from app.services.groq_client import get_groq_client
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult


DATASET_PATH = Path("evaluation/ragas_golden_set.json")


class RotatingGroqChatModel(BaseChatModel):
    """Minimal LangChain adapter backed by the shared rotating Groq client."""

    client: object
    model: str
    temperature: float = 0

    @property
    def _llm_type(self) -> str:
        return "rotating_groq"

    @staticmethod
    def _message_to_dict(message: BaseMessage) -> dict[str, str]:
        if isinstance(message, SystemMessage):
            role = "system"
        elif isinstance(message, AIMessage):
            role = "assistant"
        elif isinstance(message, HumanMessage):
            role = "user"
        else:
            role = "user"
        return {"role": role, "content": str(message.content)}

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs,
    ) -> ChatResult:
        response = self.client.create_chat_completion(
            model=self.model,
            messages=[self._message_to_dict(message) for message in messages],
            temperature=self.temperature,
        )
        content = response.choices[0].message.content or ""
        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=content))]
        )


def load_cases() -> list[dict]:
    cases = json.loads(DATASET_PATH.read_text(encoding="utf-8"))

    if not cases or cases[0]["question"].startswith("REPLACE_WITH_"):
        raise ValueError(
            f"Fill {DATASET_PATH} with real questions, reference answers, "
            "and reference contexts before running Ragas."
        )

    required = {"question", "reference", "reference_contexts"}
    for index, case in enumerate(cases, start=1):
        missing = required - case.keys()
        if missing:
            raise ValueError(
                f"Case {index} is missing: {', '.join(sorted(missing))}"
            )

    return cases


def main() -> None:
    cases = load_cases()
    samples = []
    db = SessionLocal()

    try:
        for case in cases:
            retrieval = vector_store.search(
                query=case["question"],
                top_k=5,
                max_distance=0.50,
            )
            response = ask(db, case["question"])["answer"]

            samples.append(
                SingleTurnSample(
                    user_input=case["question"],
                    response=response,
                    reference=case["reference"],
                    retrieved_contexts=[
                        item["document"] for item in retrieval
                    ],
                    reference_contexts=case["reference_contexts"],
                )
            )
    finally:
        db.close()

    dataset = EvaluationDataset(samples=samples)

    llm = LangchainLLMWrapper(
        RotatingGroqChatModel(
            model=settings.groq_model,
            temperature=0,
            client=get_groq_client(),
        )
    )
    result = evaluate(
        dataset,
        metrics=[
            ContextPrecision(),
            ContextRecall(),
            Faithfulness(),
        ],
        llm=llm,
        run_config=RunConfig(
            max_workers=1,
            timeout=60,
            max_retries=1,
        ),
    )

    print(result)
    result.to_pandas().to_json(
        "evaluation/ragas_results.json",
        orient="records",
        indent=2,
    )


if __name__ == "__main__":
    main()
