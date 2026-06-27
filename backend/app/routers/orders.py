from __future__ import annotations

from fastapi import APIRouter, Query
from sqlalchemy import text

from ..db import db
from ..serializers import clean_rows

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("")
def list_orders(
    project_id: str | None = None,
    order_id: str | None = None,
    business_type: str | None = None,
    client_unit: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
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
    if business_type:
        conditions.append("business_type = :business_type")
        params["business_type"] = business_type
    if client_unit:
        conditions.append("customer_unit_name LIKE :client_unit")
        params["client_unit"] = f"%{client_unit}%"
    if start_date:
        conditions.append("order_date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        conditions.append("order_date <= :end_date")
        params["end_date"] = end_date
    where_sql = " AND ".join(conditions)
    with db() as conn:
        total = conn.execute(text(f"SELECT COUNT(*) FROM v_order_line_finance WHERE {where_sql}"), params).scalar()
        rows = conn.execute(
            text(
                f"""
                SELECT project_code, order_no, order_date, goods_name, unit_name, quantity,
                       order_value, delivery_quantity, business_type, customer_unit_name
                FROM v_order_line_finance
                WHERE {where_sql}
                ORDER BY order_date DESC, order_no
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        ).mappings().all()
    return {"total": int(total or 0), "items": clean_rows(rows)}

