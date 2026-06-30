from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from ..auth import CurrentUser, get_current_user, require_permission
from ..db import db
from ..importer import import_excel
from ..serializers import clean_rows

router = APIRouter(tags=["system"], dependencies=[Depends(get_current_user)])


@router.post("/api/import/excel")
def run_import(_: CurrentUser = Depends(require_permission("system_admin"))) -> dict:
    with db() as conn:
        return import_excel(conn, reset=True)


@router.get("/api/logs")
def logs(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)) -> dict:
    with db() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM operation_log")).scalar()
        rows = conn.execute(
            text(
                """
                SELECT id, user_name, module_name, action_name, detail, status, created_at
                FROM operation_log
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {"limit": limit, "offset": offset},
        ).mappings().all()
    return {"total": int(total or 0), "items": clean_rows(rows)}


@router.get("/api/backups")
def backups(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)) -> dict:
    with db() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM backup_record")).scalar()
        rows = conn.execute(
            text(
                """
                SELECT id, file_name, file_size_label, backup_type, status, storage_path, backup_time
                FROM backup_record
                ORDER BY backup_time DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {"limit": limit, "offset": offset},
        ).mappings().all()
    return {"total": int(total or 0), "items": clean_rows(rows)}
