from __future__ import annotations

import re
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection

from .config import DOCS_DIR, settings


engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
server_engine = create_engine(settings.server_url, pool_pre_ping=True, future=True)


@contextmanager
def db() -> Iterator[Connection]:
    with engine.begin() as conn:
        yield conn


def _split_sql(sql: str) -> list[str]:
    cleaned = re.sub(r"^\s*--.*$", "", sql, flags=re.MULTILINE)
    return [part.strip() for part in cleaned.split(";") if part.strip()]


def initialize_schema() -> None:
    schema_path = DOCS_DIR / "erp_ledger_schema.sql"
    statements = _split_sql(schema_path.read_text(encoding="utf-8"))
    with server_engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


def table_count(table: str) -> int:
    with db() as conn:
        return int(conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0)

