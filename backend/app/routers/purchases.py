from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from ..auth import CurrentUser, apply_department_scope, can_access_department, get_current_user, require_permission
from ..db import db
from ..serializers import clean_row, clean_rows

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


class PurchaseContractCreate(BaseModel):
    purchase_contract_no: str | None = None
    payment_terms: str | None = None
    performance_period: str | None = None
    signed_amount: float | None = None
    unsigned_amount: float | None = None


class PurchaseInvoiceCreate(BaseModel):
    received_invoice_date: str | None = None
    invoice_no: str | None = None
    invoice_amount: float | None = None


class PurchasePaymentCreate(BaseModel):
    due_payment_date: str | None = None
    payment_date: str | None = None
    payment_voucher_no: str | None = None
    payment_amount: float | None = None


@router.get("")
def list_purchases(
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
                SELECT order_line_id, project_code, order_no, account_manager, department, supplier_name,
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


@router.get("/{order_line_id}")
def get_purchase_detail(order_line_id: int, user: CurrentUser = Depends(get_current_user)) -> dict:
    with db() as conn:
        summary = conn.execute(
            text(
                """
                SELECT order_line_id, project_code, order_no, department, branch_company,
                       account_manager, order_date, business_type, statistic_category,
                       customer_unit_name, project_name, close_status, goods_name,
                       specification_model, unit_name, quantity, revenue_no_tax, order_value,
                       supplier_name, cost_no_tax, purchase_amount, delivery_quantity,
                       delivery_value, purchase_contract_no, purchase_contract_signed_amount,
                       total_paid, accounts_payable, gross_profit
                FROM v_order_line_finance
                WHERE order_line_id = :order_line_id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().first()
        if summary is None:
            raise HTTPException(status_code=404, detail="Purchase order line not found")
        if not can_access_department(user, str(summary["department"]) if summary["department"] is not None else None):
            raise HTTPException(status_code=403, detail="Department permission denied")

        contracts = conn.execute(
            text(
                """
                SELECT id, purchase_contract_no, payment_terms, performance_period,
                       signed_amount, unsigned_amount, created_at
                FROM purchase_contract
                WHERE order_line_id = :order_line_id AND deleted_at IS NULL
                ORDER BY id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().all()
        invoices = conn.execute(
            text(
                """
                SELECT id, phase_no, received_invoice_date, received_invoice_date_text,
                       invoice_no, invoice_amount, created_at
                FROM purchase_invoice
                WHERE order_line_id = :order_line_id AND deleted_at IS NULL
                ORDER BY phase_no, id
                """
            ),
            {"order_line_id": order_line_id},
        ).mappings().all()
        payments = conn.execute(
            text(
                """
                SELECT id, phase_no, due_payment_date, payment_date, payment_date_text,
                       payment_voucher_no, payment_amount, created_at
                FROM purchase_payment
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
        "payments": clean_rows(payments),
    }


@router.post("/{order_line_id}/contracts")
def add_purchase_contract(
    order_line_id: int,
    payload: PurchaseContractCreate,
    user: CurrentUser = Depends(require_permission("purchase_entry")),
) -> dict:
    _ensure_order_line(order_line_id, user, require_entry=True)
    with db() as conn:
        conn.execute(
            text(
                """
                INSERT INTO purchase_contract
                  (order_line_id, purchase_contract_no, payment_terms, performance_period,
                   signed_amount, unsigned_amount)
                VALUES
                  (:order_line_id, :purchase_contract_no, :payment_terms, :performance_period,
                   :signed_amount, :unsigned_amount)
                """
            ),
            {"order_line_id": order_line_id, **_payload_dict(payload)},
        )
    return get_purchase_detail(order_line_id, user)


@router.post("/{order_line_id}/invoices")
def add_purchase_invoice(
    order_line_id: int,
    payload: PurchaseInvoiceCreate,
    user: CurrentUser = Depends(require_permission("purchase_entry")),
) -> dict:
    _ensure_order_line(order_line_id, user, require_entry=True)
    with db() as conn:
        phase_no = _next_phase(conn, "purchase_invoice", order_line_id)
        conn.execute(
            text(
                """
                INSERT INTO purchase_invoice
                  (order_line_id, phase_no, received_invoice_date, received_invoice_date_text,
                   invoice_no, invoice_amount)
                VALUES
                  (:order_line_id, :phase_no, :received_invoice_date, :received_invoice_date,
                   :invoice_no, :invoice_amount)
                """
            ),
            {"order_line_id": order_line_id, "phase_no": phase_no, **_payload_dict(payload)},
        )
    return get_purchase_detail(order_line_id, user)


@router.post("/{order_line_id}/payments")
def add_purchase_payment(
    order_line_id: int,
    payload: PurchasePaymentCreate,
    user: CurrentUser = Depends(require_permission("purchase_entry")),
) -> dict:
    _ensure_order_line(order_line_id, user, require_entry=True)
    with db() as conn:
        phase_no = _next_phase(conn, "purchase_payment", order_line_id)
        data = _payload_dict(payload)
        if phase_no > 1:
            data["due_payment_date"] = None
        conn.execute(
            text(
                """
                INSERT INTO purchase_payment
                  (order_line_id, phase_no, due_payment_date, payment_date, payment_date_text,
                   payment_voucher_no, payment_amount)
                VALUES
                  (:order_line_id, :phase_no, :due_payment_date, :payment_date, :payment_date,
                   :payment_voucher_no, :payment_amount)
                """
            ),
            {"order_line_id": order_line_id, "phase_no": phase_no, **data},
        )
    return get_purchase_detail(order_line_id, user)


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
