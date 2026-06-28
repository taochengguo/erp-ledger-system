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
                SELECT
                       project_code,
                       order_no,
                       gross_net_type AS amount_type,
                       department,
                       branch_company,
                       account_manager,
                       order_date,
                       business_type,
                       statistic_category AS statistical_category,
                       team_level3_name AS team_name,
                       customer_unit_name,
                       end_user_name AS user_name,
                       regional_platform,
                       project_name,
                       goods_name,
                       specification_model AS spec_model,
                       unit_name,
                       quantity,
                       sales_unit_price_no_tax AS net_unit_price,
                       sales_unit_price AS unit_price,
                       revenue_no_tax AS net_revenue,
                       order_value,
                       supplier_name,
                       purchase_unit_price_no_tax,
                       purchase_unit_price,
                       cost_no_tax,
                       purchase_amount,
                       delivery_date,
                       delivery_quantity,
                       delivery_revenue_no_tax,
                       delivery_value,
                       delivery_cost_no_tax,
                       delivery_cost,
                       pending_delivery_quantity,
                       pending_delivery_amount_no_tax,
                       pending_delivery_amount
                FROM (
                    SELECT
                           p.project_code,
                           so.order_no,
                           so.gross_net_type,
                           p.department,
                           p.branch_company,
                           p.account_manager,
                           p.team_level3_name,
                           p.end_user_name,
                           p.regional_platform,
                           so.order_date,
                           so.business_type,
                           so.statistic_category,
                           p.customer_unit_name,
                           p.project_name,
                           ol.goods_name,
                           ol.specification_model,
                           ol.unit_name,
                           ol.quantity,
                           ol.sales_unit_price_no_tax,
                           ol.sales_unit_price,
                           ol.revenue_no_tax,
                           ol.order_value,
                           pi.supplier_name,
                           pi.purchase_unit_price_no_tax,
                           pi.purchase_unit_price,
                           pi.cost_no_tax,
                           pi.purchase_amount,
                           dr.delivery_date,
                           dr.delivery_quantity,
                           dr.delivery_revenue_no_tax,
                           dr.delivery_value,
                           dr.delivery_cost_no_tax,
                           dr.delivery_cost,
                           dr.pending_delivery_quantity,
                           dr.pending_delivery_amount_no_tax,
                           dr.pending_delivery_amount
                    FROM project p
                    JOIN sales_order so ON so.project_id = p.id AND so.deleted_at IS NULL
                    JOIN order_line ol ON ol.sales_order_id = so.id AND ol.deleted_at IS NULL
                    LEFT JOIN purchase_info pi ON pi.order_line_id = ol.id AND pi.deleted_at IS NULL
                    LEFT JOIN delivery_record dr ON dr.order_line_id = ol.id AND dr.deleted_at IS NULL
                    WHERE p.deleted_at IS NULL
                ) order_detail
                WHERE {where_sql}
                ORDER BY order_date DESC, order_no
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        ).mappings().all()
    return {"total": int(total or 0), "items": clean_rows(rows)}
