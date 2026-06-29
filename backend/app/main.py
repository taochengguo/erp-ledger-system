from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .auth import ensure_default_admin
from .db import db, initialize_schema, table_count
from .importer import import_excel
from .routers import auth, dashboard, ledgers, orders, purchases, sales, system

startup_state = {"database": "not_checked", "imported_rows": 0, "error": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        initialize_schema()
        ensure_default_admin()
        if table_count("order_line") == 0:
            with db() as conn:
                result = import_excel(conn, reset=True)
                startup_state["imported_rows"] = result["success_rows"]
        else:
            startup_state["imported_rows"] = table_count("order_line")
        startup_state["database"] = "configured"
        startup_state["error"] = None
    except Exception as exc:  # noqa: BLE001 - keep API visible for health diagnostics
        startup_state["database"] = "error"
        startup_state["error"] = str(exc)
    yield


app = FastAPI(title="ERP Ledger API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(ledgers.router)
app.include_router(orders.router)
app.include_router(purchases.router)
app.include_router(sales.router)
app.include_router(system.router)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok" if startup_state["database"] == "configured" else "degraded",
        "database": startup_state["database"],
        "importedRows": startup_state["imported_rows"],
        "error": startup_state["error"],
    }
