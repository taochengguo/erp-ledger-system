from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from ..auth import CurrentUser, apply_department_scope, can_access_department, get_current_user, require_permission
from ..db import db
from ..serializers import clean_row, clean_rows

router = APIRouter(prefix="/api/sales", tags=["sales"])


class SalesContractCreate(BaseModel):
    contract_signed_date: str | None = None
    sales_contract_no: str | None = None
    contract_value: float | None = None
    performance_period: str | None = None
    unsigned_contract_amount: float | None = None


class SalesInvoiceCreate(BaseModel):
    invoice_doc_no: str | None = None
    invoice_date: str | None = None
    invoice_no: str | None = None
    invoice_amount: float | None = None
    pending_invoice_amount: float | None = None
    delivered_not_invoiced_amount: float | None = None


class SalesReceiptCreate(BaseModel):
    receipt_date: str | None = None
    payment_notice_no: str | None = None
    receipt_amount: float | None = None
    receipt_ratio: float | None = None


SUMMARY_AMOUNT_FIELDS = {
    "order_value",
    "purchase_amount",
    "delivery_value",
    "purchase_contract_signed_amount",
    "sales_contract_value",
    "sales_invoice_amount",
    "total_received",
    "accounts_receivable",
    "gross_profit",
}


@router.get("")
def list_sales(
    project_id: str | None = None,
    order_id: str | None = None,
    manager: str | None = None,
    department: str | None = None,
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: CurrentUser = Depends(get_current_user),
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
    apply_department_scope(conditions, params, user)
    where_sql = " AND ".join(conditions)
    with db() as conn:
        total = conn.execute(text(f"SELECT COUNT(*) FROM v_order_line_finance WHERE {where_sql}"), params).scalar()
        rows = conn.execute(
            text(
                f"""
                SELECT order_line_id, project_code, order_no, account_manager, department, sales_contract_no,
                       sales_contract_signed_date, sales_contract_value, sales_invoice_amount,
                       total_received, accounts_receivable
                FROM v_order_line_finance
                WHERE {where_sql}
                ORDER BY order_date DESC, project_code
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        ).mappings().all()
    return {"total": int(total or 0), "items": clean_rows(rows)}


@router.get("/by-order")
def get_sales_detail_by_order(project_id: str, order_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    with db() as conn:
        summary_rows = conn.execute(
            text(
                """
                SELECT order_line_id, project_code, order_no, department, branch_company,
                       account_manager, order_date, business_type, statistic_category,
                       customer_unit_name, project_name, close_status, goods_name,
                       specification_model, unit_name, quantity, revenue_no_tax, order_value,
                       supplier_name, purchase_amount, delivery_quantity, delivery_value,
                       purchase_contract_no, purchase_contract_signed_amount,
                       sales_contract_no, sales_contract_signed_date, sales_contract_value,
                       sales_invoice_amount, total_received, accounts_receivable, gross_profit
                FROM v_order_line_finance
                WHERE project_code = :project_id AND order_no = :order_id
                ORDER BY order_line_id
                """
            ),
            {"project_id": project_id, "order_id": order_id},
        ).mappings().all()
        if not summary_rows:
            raise HTTPException(status_code=404, detail="Sales order not found")
        if any(
            not can_access_department(user, str(row["department"]) if row["department"] is not None else None)
            for row in summary_rows
        ):
            raise HTTPException(status_code=403, detail="Department permission denied")

        line_filter_sql = """
            SELECT order_line_id
            FROM v_order_line_finance
            WHERE project_code = :project_id AND order_no = :order_id
        """
        contracts = conn.execute(
            text(
                f"""
                SELECT id, order_line_id, contract_signed_date, contract_signed_date_text,
                       sales_contract_no, contract_value, performance_period,
                       unsigned_contract_amount, created_at
                FROM sales_contract
                WHERE order_line_id IN ({line_filter_sql}) AND deleted_at IS NULL
                ORDER BY order_line_id, id
                """
            ),
            {"project_id": project_id, "order_id": order_id},
        ).mappings().all()
        invoices = conn.execute(
            text(
                f"""
                SELECT id, order_line_id, phase_no, invoice_doc_no, invoice_date,
                       invoice_date_text, invoice_no, invoice_amount,
                       pending_invoice_amount, delivered_not_invoiced_amount, created_at
                FROM sales_invoice
                WHERE order_line_id IN ({line_filter_sql}) AND deleted_at IS NULL
                ORDER BY order_line_id, phase_no, id
                """
            ),
            {"project_id": project_id, "order_id": order_id},
        ).mappings().all()
        receipts = conn.execute(
            text(
                f"""
                SELECT id, order_line_id, phase_no, receipt_date, receipt_date_text,
                       payment_notice_no, receipt_amount, receipt_ratio, created_at
                FROM sales_receipt
                WHERE order_line_id IN ({line_filter_sql}) AND deleted_at IS NULL
                ORDER BY order_line_id, phase_no, id
                """
            ),
            {"project_id": project_id, "order_id": order_id},
        ).mappings().all()

    return {
        "summary": clean_row(_aggregate_summary(summary_rows)),
        "contracts": clean_rows(contracts),
        "invoices": clean_rows(invoices),
        "receipts": clean_rows(receipts),
    }


@router.get("/{order_line_id}")
def get_sales_detail(order_line_id: int, user: CurrentUser = Depends(get_current_user)) -> dict:
    with db() as conn:
        summary = conn.execute(
            text(
                """
                SELECT order_line_id, project_code, order_no, department, branch_company,
                       account_manager, order_date, business_type, statistic_category,
                       customer_unit_name, project_name, close_status, goods_name,
                       specification_model, unit_name, quantity, revenue_no_tax, order_value,
                       supplier_name, purchase_amount, delivery_quantity, delivery_value,
                       purchase_contract_no, purchase_contract_signed_amount,
                       sales_contract_no, sales_contract_signed_date, sales_contract_value,
                       sales_invoice_amount, total_received, accounts_receivable, gross_profit
                FROM v_order_line_finance
                WHERE order_line_id = :order_line_id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().first()
        if summary is None:
            raise HTTPException(status_code=404, detail="Sales order line not found")
        if not can_access_department(user, str(summary["department"]) if summary["department"] is not None else None):
            raise HTTPException(status_code=403, detail="Department permission denied")

        contracts = conn.execute(
            text(
                """
                SELECT id, contract_signed_date, contract_signed_date_text, sales_contract_no,
                       contract_value, performance_period, unsigned_contract_amount, created_at
                FROM sales_contract
                WHERE order_line_id = :order_line_id AND deleted_at IS NULL
                ORDER BY id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().all()
        invoices = conn.execute(
            text(
                """
                SELECT id, phase_no, invoice_doc_no, invoice_date, invoice_date_text,
                       invoice_no, invoice_amount, pending_invoice_amount,
                       delivered_not_invoiced_amount, created_at
                FROM sales_invoice
                WHERE order_line_id = :order_line_id AND deleted_at IS NULL
                ORDER BY phase_no, id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().all()
        receipts = conn.execute(
            text(
                """
                SELECT id, phase_no, receipt_date, receipt_date_text, payment_notice_no,
                       receipt_amount, receipt_ratio, created_at
                FROM sales_receipt
                WHERE order_line_id = :order_line_id AND deleted_at IS NULL
                ORDER BY phase_no, id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().all()

    return {
        "summary": clean_row(summary),
        "contracts": clean_rows(contracts),
        "invoices": clean_rows(invoices),
        "receipts": clean_rows(receipts),
    }


@router.post("/{order_line_id}/contracts")
def add_sales_contract(
    order_line_id: int,
    payload: SalesContractCreate,
    user: CurrentUser = Depends(require_permission("sales_entry")),
) -> dict:
    _ensure_order_line(order_line_id, user, require_entry=True)
    with db() as conn:
        conn.execute(
            text(
                """
                INSERT INTO sales_contract
                  (order_line_id, contract_signed_date, contract_signed_date_text,
                   sales_contract_no, contract_value, performance_period,
                   unsigned_contract_amount)
                VALUES
                  (:order_line_id, :contract_signed_date, :contract_signed_date,
                   :sales_contract_no, :contract_value, :performance_period,
                   :unsigned_contract_amount)
                """
            ),
            {"order_line_id": order_line_id, **_payload_dict(payload)},
        )
    return get_sales_detail(order_line_id, user)


@router.post("/{order_line_id}/invoices")
def add_sales_invoice(
    order_line_id: int,
    payload: SalesInvoiceCreate,
    user: CurrentUser = Depends(require_permission("sales_entry")),
) -> dict:
    _ensure_order_line(order_line_id, user, require_entry=True)
    with db() as conn:
        phase_no = _next_phase(conn, "sales_invoice", order_line_id)
        conn.execute(
            text(
                """
                INSERT INTO sales_invoice
                  (order_line_id, phase_no, invoice_doc_no, invoice_date,
                   invoice_date_text, invoice_no, invoice_amount,
                   pending_invoice_amount, delivered_not_invoiced_amount)
                VALUES
                  (:order_line_id, :phase_no, :invoice_doc_no, :invoice_date,
                   :invoice_date, :invoice_no, :invoice_amount,
                   :pending_invoice_amount, :delivered_not_invoiced_amount)
                """
            ),
            {"order_line_id": order_line_id, "phase_no": phase_no, **_payload_dict(payload)},
        )
    return get_sales_detail(order_line_id, user)


@router.post("/{order_line_id}/receipts")
def add_sales_receipt(
    order_line_id: int,
    payload: SalesReceiptCreate,
    user: CurrentUser = Depends(require_permission("sales_entry")),
) -> dict:
    _ensure_order_line(order_line_id, user, require_entry=True)
    with db() as conn:
        phase_no = _next_phase(conn, "sales_receipt", order_line_id)
        conn.execute(
            text(
                """
                INSERT INTO sales_receipt
                  (order_line_id, phase_no, receipt_date, receipt_date_text,
                   payment_notice_no, receipt_amount, receipt_ratio)
                VALUES
                  (:order_line_id, :phase_no, :receipt_date, :receipt_date,
                   :payment_notice_no, :receipt_amount, :receipt_ratio)
                """
            ),
            {"order_line_id": order_line_id, "phase_no": phase_no, **_payload_dict(payload)},
        )
    return get_sales_detail(order_line_id, user)


def _ensure_order_line(order_line_id: int, user: CurrentUser, require_entry: bool = False) -> None:
    with db() as conn:
        row = conn.execute(
            text(
                """
                SELECT department
                FROM v_order_line_finance
                WHERE order_line_id = :order_line_id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Order line not found")
    if not can_access_department(user, str(row["department"]) if row["department"] is not None else None, require_entry):
        raise HTTPException(status_code=403, detail="Department permission denied")


def _payload_dict(payload: BaseModel) -> dict:
    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    return payload.dict()


def _next_phase(conn, table_name: str, order_line_id: int) -> int:
    phase = conn.execute(
        text(
            f"""
            SELECT COALESCE(MAX(phase_no), 0) + 1
            FROM {table_name}
            WHERE order_line_id = :order_line_id AND deleted_at IS NULL
            """
        ),
        {"order_line_id": order_line_id},
    ).scalar()
    return int(phase or 1)


def _aggregate_summary(rows) -> dict:
    first = dict(rows[0])
    result = dict(first)
    for field in SUMMARY_AMOUNT_FIELDS:
        result[field] = sum(row.get(field) or 0 for row in rows)
    for row in rows:
        for key, value in row.items():
            if result.get(key) in (None, "") and value not in (None, ""):
                result[key] = value
    result["primary_order_line_id"] = first.get("order_line_id")
    result["matched_line_count"] = len(rows)
    return result
