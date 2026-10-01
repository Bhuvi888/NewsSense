"""Run one production ingestion pass for a scheduled container job."""

import json
import sys

from app.database import SessionLocal
from app.services.ingestion_service import run_ingestion


def main() -> int:
    db = SessionLocal()
    try:
        stats = run_ingestion(db)
    finally:
        db.close()

    print(json.dumps(stats, default=str))

    # A non-zero exit lets Azure mark the execution as failed and retry it.
    if stats["errors"]:
        print("Ingestion completed with errors; requesting a retry.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
