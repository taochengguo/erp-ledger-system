from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from ..db import db
from ..serializers import clean_rows

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary() -> dict[str, float | int]:
    with db() as conn:
        row = conn.execute(
            text(
                """
                SELECT
                  COALESCE(SUM(order_value), 0) AS order_amount,
                  COALESCE(SUM(gross_profit), 0) AS gross_profit,
                  COUNT(DISTINCT order_no) AS order_count,
                  COALESCE(SUM(accounts_receivable), 0) AS accounts_receivable,
                  COALESCE(SUM(accounts_payable), 0) AS accounts_payable,
                  SUM(CASE WHEN close_status = '关闭' OR accounts_receivable = 0 THEN 1 ELSE 0 END) AS closed_count
                FROM v_order_line_finance
                """
            )
        ).mappings().one()
    return {
        "orderAmount": float(row["order_amount"]),
        "grossProfit": float(row["gross_profit"]),
        "orderCount": int(row["order_count"]),
        "accountsReceivable": float(row["accounts_receivable"]),
        "accountsPayable": float(row["accounts_payable"]),
        "closedCount": int(row["closed_count"] or 0),
    }


@router.get("/trends")
def trends() -> list[dict]:
    with db() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                  DATE_FORMAT(order_date, '%Y-%m') AS month,
                  COALESCE(SUM(order_value), 0) AS order_amount,
                  COALESCE(SUM(gross_profit), 0) AS gross_profit
                FROM v_order_line_finance
                WHERE order_date IS NOT NULL
                GROUP BY DATE_FORMAT(order_date, '%Y-%m')
                ORDER BY month
                """
            )
        ).mappings().all()
    return clean_rows(rows)


@router.get("/department-ranking")
def department_ranking() -> list[dict]:
    with db() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                  COALESCE(department, '未分配') AS department,
                  COALESCE(SUM(order_value), 0) AS order_amount,
                  COALESCE(SUM(gross_profit), 0) AS gross_profit
                FROM v_order_line_finance
                GROUP BY department
                ORDER BY order_amount DESC
                LIMIT 10
                """
            )
        ).mappings().all()
    return clean_rows(rows)

