# Society Maintenance Portal — Backend

FastAPI + PostgreSQL backend for the Arihant CardMaster Enclave society
maintenance portal.

## Prerequisites

- Python 3.11 or newer
- A running PostgreSQL 14+ instance (local, Docker, RDS — any will do)
- Database created in advance, e.g.

  ```sql
  CREATE DATABASE society_portal;
  ```

## First-time setup

```powershell
# from the repo root
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, and the SEED_* officer credentials

# create all tables
alembic upgrade head

# create the three officer seed accounts
python -m app.seed
```

On Linux / macOS the venv activation is `source .venv/bin/activate` and the
copy command is `cp .env.example .env`.

## Running the API

```powershell
uvicorn app.main:app --reload --port 8000
```

OpenAPI docs are served at <http://localhost:8000/docs>.

## Seed accounts

Running `python -m app.seed` creates / verifies exactly three officer
accounts using the `SEED_*` env vars:

| Role      | Default email                          |
|-----------|----------------------------------------|
| Treasurer | `treasurer@cardmasterenclave.in`       |
| President | `president@cardmasterenclave.in`       |
| Secretary | `secretary@cardmasterenclave.in`       |

The seeder is **idempotent** and will **never overwrite** an existing
officer's password hash — rotate passwords through the API (`POST
/api/members/me/change-password`) after the first run.

## Role permissions enforced server-side

| Role       | Read ledger | Record payment | Add/delete expense | Approve signups |
|------------|:----------:|:--------------:|:------------------:|:---------------:|
| Treasurer  | yes        | **yes**        | **yes**            | no              |
| President  | yes        | no             | no                 | no              |
| Secretary  | yes        | no             | no                 | **yes**         |
| Community  | own bill   | no             | n/a                | no              |

Authorization is enforced by FastAPI dependencies (`require_treasurer`,
`require_secretary`, `require_officer`) — frontend gating is a UX nicety,
not a security boundary.

## Audit log

Every credential change, approval decision, payment, expense add/delete,
and signup is written to the `audit_log` table. Officers can read it via
`GET /api/audit-log`.

## Where things live

```
backend/
├── alembic/               migrations
├── app/
│   ├── core/              config, JWT/bcrypt, RBAC deps, audit helper
│   ├── crud/              query helpers (users, maintenance)
│   ├── db/                SQLAlchemy engine + session + Base
│   ├── models/            ORM models
│   ├── routers/           auth, members, maintenance, expenses, audit
│   ├── schemas/           Pydantic v2 request/response models
│   ├── main.py            FastAPI app + CORS
│   └── seed.py            officer seeder
├── .env.example
├── alembic.ini
└── requirements.txt
```
