"""Copy the existing Newsense MySQL tables into Azure MySQL Flexible Server."""

import os
from pathlib import Path

from sqlalchemy import MetaData, create_engine, select
from sqlalchemy.engine import URL


def read_env(name: str) -> str:
    for line in (Path("backend/.env").read_text(encoding="utf-8").splitlines()):
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    return ""


def main() -> None:
    local_url = read_env("DATABASE_URL")
    if not local_url:
        raise RuntimeError("DATABASE_URL was not found in backend/.env")

    remote_url = URL.create(
        drivername="mysql+pymysql",
        username=os.environ["AZURE_MYSQL_USER"],
        password=os.environ["AZURE_MYSQL_PASSWORD"],
        host=os.environ["AZURE_MYSQL_HOST"],
        port=3306,
        database="newsense",
        query={"charset": "utf8mb4"},
    )

    source = create_engine(local_url, pool_pre_ping=True)
    destination = create_engine(remote_url, pool_pre_ping=True)

    source_metadata = MetaData()
    source_metadata.reflect(bind=source)
    if not source_metadata.tables:
        raise RuntimeError("The local database contains no tables to migrate.")

    source_metadata.create_all(destination)
    destination_metadata = MetaData()
    destination_metadata.reflect(bind=destination)

    with source.connect() as source_connection, destination.begin() as destination_connection:
        for table in source_metadata.sorted_tables:
            rows = source_connection.execute(select(table)).mappings().all()
            if not rows:
                print(f"{table.name}: 0 rows")
                continue

            # Reflection creates equivalent tables on the destination. Insert in
            # batches so the migration remains safe for larger article bodies.
            target_table = destination_metadata.tables[table.name]
            for offset in range(0, len(rows), 200):
                destination_connection.execute(
                    target_table.insert(), rows[offset : offset + 200]
                )
            print(f"{table.name}: {len(rows)} rows")


if __name__ == "__main__":
    main()
