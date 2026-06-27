from __future__ import annotations

from fastapi import APIRouter, Query
from sqlalchemy import text

from ..db import db
from ..serializers import clean_rows

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


@router.get("")
def list_purchases(
    project_id: str | None = None,
    order_id: str | None = None,
    manager: str | None = None,
    department: str | None = None,
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> dict:
    conditions = ["1=1"]
    params: dict[str, object] = {"limit": limit, "offset": offset}
    if project_id:
        conditions.append("project_code LIKE :project_id")
        params["project_id"] = f"%{project_id}%"
    if order_id:
        conditions.append("order_no LIKE :order_id")
        params["order_id"] = f"%{order_id}%"
    if manager:
        conditions.append("account_manager LIKE :manager")
        params["manager"] = f"%{manager}%"
    if department:
        conditions.append("department = :department")
        params["department"] = department
    where_sql = " AND ".join(conditions)
    with db() as conn:
        total = conn.execute(text(f"SELECT COUNT(*) FROM v_order_line_finance WHERE {where_sql}"), params).scalar()
        rows = conn.execute(
            text(
                f"""
                SELECT project_code, order_no, account_manager, department, supplier_name,
                       purchase_contract_no, purchase_contract_signed_amount,
                       purchase_amount, total_paid, accounts_payable
                FROM v_order_line_finance
                WHERE {where_sql}
                ORDER BY order_date DESC, project_code
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        ).mappings().all()
    return {"total": int(total or 0), "items": clean_rows(rows)}

