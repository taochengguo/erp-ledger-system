# ERP Ledger System

React + Vite frontend with a FastAPI + MySQL backend for the 2026 supply-chain ledger.

## Documentation

- [Local deployment guide](docs/LOCAL_DEPLOYMENT.md)

## Local Runtime

Prerequisites:

- Node.js
- MySQL 8.0 on `127.0.0.1:3306`
- MySQL user with permission to create and use the local `erp_ledger` database

Install dependencies:

```powershell
npm install
C:\Users\Eternal\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set local credentials. Do not commit `backend/.env`.

Initialize database and import Excel:

```powershell
cd backend
@'
from app.db import initialize_schema, db
from app.importer import import_excel
initialize_schema()
with db() as conn:
    print(import_excel(conn, reset=True))
'@ | .\.venv\Scripts\python.exe -
cd ..
```

Run backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Run frontend:

```powershell
npm run dev
```

Open:

- Frontend: http://127.0.0.1:3000
- Backend health: http://127.0.0.1:8000/api/health

## Data Rules

- `project.project_code` is unique.
- One project can have multiple `sales_order.order_no` records.
- Payment, receipt, invoice, and warehouse records support multiple phases through `phase_no`.
- Raw Excel rows are stored in `ledger_raw_row` for reconciliation.
