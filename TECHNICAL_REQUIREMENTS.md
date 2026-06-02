# Society Maintenance Portal — Technical Requirements Document (TRD)

| Field              | Value                          |
|--------------------|--------------------------------|
| **Document Title** | Society Maintenance Portal — Technical Requirements |
| **Version**        | 2.0 (As-Built)                 |
| **Date**           | 2026-06-02                     |
| **Status**         | Reflects current production build |
| **Companion Doc**  | PROJECT_REQUIREMENTS.md (PRD v2.0) |

> v2.0 documents what is actually shipping. The v1.0 plan (SQL Server,
> Monthly/Quarterly/Annual plans, complaints) was abandoned during build.

---

## 1. Architecture

### 1.1 System diagram
```
+----------------------------+        HTTPS / JSON         +-----------------------------+
|   React 18 + TypeScript    |  <----------------------->  |  FastAPI (Python 3.11+)     |
|   (Vite, MUI 5, RR6)       |   Authorization: Bearer JWT |  Uvicorn ASGI               |
|   localhost:5173 (dev)     |                             |  localhost:8000 (dev)       |
+-------------+--------------+                             +--------------+--------------+
              |                                                           |
              | localStorage: access token + last AuthUser snapshot       | SQLAlchemy 2.x
              |                                                           | Alembic migrations
              v                                                           v
       Browser route guards                                  +-----------------------------+
       (read role from token / /auth/me)                     |  PostgreSQL 14+             |
                                                             |  (psycopg v3 driver)        |
                                                             +-----------------------------+
```

### 1.2 Repository layout
```
Society_Maintainence_Portal/
├── backend/
│   ├── alembic/                  versioned migrations
│   │   └── versions/20260601_0001_initial_schema.py
│   ├── app/
│   │   ├── core/                 config, security (JWT/bcrypt), RBAC deps, audit
│   │   ├── crud/                 query helpers (users, maintenance)
│   │   ├── db/                   SQLAlchemy engine + session + Base
│   │   ├── models/               ORM models
│   │   ├── routers/              auth, members, maintenance, expenses, audit
│   │   ├── schemas/              Pydantic v2 request/response models
│   │   ├── main.py               FastAPI app + CORS + router wiring
│   │   ├── seed.py               officer (Treasurer/Secretary/President) seeder
│   │   └── seed_members.py       (optional) demo community-member seeder
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           DashboardShell, ProfileDialog, Logo, …
│   │   ├── lib/                  api, auth, format, types, maintenance,
│   │   │                         expenseApi, members
│   │   ├── pages/                Login, Signup, ForgotPassword,
│   │   │                         MaintenanceDashboard, ExpenditureDashboard,
│   │   │                         Approvals
│   │   ├── App.tsx               router + route guards
│   │   └── theme.ts              palette + MUI theme overrides
│   ├── .env.example              VITE_API_BASE_URL=http://localhost:8000
│   ├── package.json
│   └── vite.config.ts
├── prototype/
│   ├── index.html                single-file Treasurer dashboard mock
│   └── DEMO_GUIDE.md
├── PROJECT_REQUIREMENTS.md
└── TECHNICAL_REQUIREMENTS.md
```

---

## 2. Tech Stack

### 2.1 Backend
| Concern               | Choice                                  | Notes                                                |
|-----------------------|-----------------------------------------|------------------------------------------------------|
| Language / runtime    | Python 3.11+                            |                                                       |
| Web framework         | FastAPI                                 | Auto-OpenAPI, dependency injection used for RBAC.    |
| ASGI server           | Uvicorn (`uvicorn[standard]`)           | `--reload` in dev.                                   |
| ORM                   | SQLAlchemy 2.x                          | Typed `Mapped[...]` models.                          |
| Migrations            | Alembic                                 | One baseline migration shipped.                      |
| DB driver             | `psycopg` (v3)                          | URL prefix `postgresql+psycopg://...`.               |
| Schemas / validation  | Pydantic v2                             | `model_config = ConfigDict(from_attributes=True)`.   |
| Password hashing      | `passlib[bcrypt]`                       | bcrypt cost left at library default.                 |
| JWT                   | `PyJWT`                                 | HS256, `sub` = user id, `role` claim included.       |
| CORS                  | Starlette `CORSMiddleware`              | Origin allowlist from `CORS_ALLOW_ORIGINS` env.      |

### 2.2 Frontend
| Concern              | Choice                                   |
|----------------------|------------------------------------------|
| Language             | TypeScript                               |
| Build / dev server   | Vite 5                                   |
| UI library           | React 18 + Material UI 5                 |
| Icons / fonts        | `@mui/icons-material`, Cinzel + Inter (fontsource) |
| Routing              | React Router 6                           |
| Data fetching        | Native `fetch` wrapped by `lib/api.ts`   |
| Auth state           | `localStorage` (token + user snapshot)   |
| Forms                | Plain controlled components + inline validation (no Hook Form / Zod) |

### 2.3 Database
- PostgreSQL 14+. Numeric money uses `NUMERIC(12, 2)`; timestamps use
  `TIMESTAMPTZ`. Enum-like fields use `VARCHAR` with check constraints (not
  native `pg_enum`) so values can be evolved without `ALTER TYPE` gymnastics.

---

## 3. Security Model

### 3.1 Auth flow
```
POST /api/auth/signup   →  create user (status=pending, role=community_member)
POST /api/auth/login    →  verify password, return { access_token, user }
GET  /api/auth/me       →  echo current user (token-protected)
```
- Token: JWT, HS256, lifetime configurable via `JWT_EXPIRY_MINUTES` (default
  720 = 12 hours). Claims: `sub` (user id, stringified), `role`, `exp`.
- Login accepts **email or 10-digit mobile** as identifier (`find_by_identifier`).
- Login rejects `rejected` / `disabled` accounts with 403 and a stable error.
- `forgot-password` is a noop that always returns 202 and audits the attempt
  (no email/SMS dispatch in v2.0).

### 3.2 Role enforcement (server-side, every request)
| Dependency           | Allowed roles                                      |
|----------------------|----------------------------------------------------|
| `get_current_user`   | Any authenticated, non-disabled user               |
| `require_treasurer`  | `treasurer` only                                   |
| `require_secretary`  | `secretary` only                                   |
| `require_officer`    | `treasurer` ∨ `secretary` ∨ `president`            |

Frontend `<RoleGuard>` is a UX nicety; authorization is the server's job.

### 3.3 Other safeguards
- bcrypt password hashing on signup / change-password.
- `email` and `mobile` unique constraints; CHECK enforces 10-digit mobile.
- All inputs validated by Pydantic v2 schemas; `from_attributes=True` for
  ORM-mode responses.
- CORS allowlist driven by env var.

---

## 4. Data Model (PostgreSQL)

### 4.1 `users`
| Column           | Type            | Notes                                                                       |
|------------------|-----------------|-----------------------------------------------------------------------------|
| id               | serial PK       |                                                                             |
| name             | varchar(120)    |                                                                             |
| email            | varchar(160)    | unique, lowercased                                                          |
| mobile           | varchar(10)     | unique, CHECK `char_length(mobile)=10`                                       |
| house            | varchar(40)     | nullable                                                                    |
| plot_no          | varchar(40)     | nullable; required to appear in the ledger                                  |
| role             | varchar(32)     | enum: treasurer / president / secretary / community_member                  |
| status           | varchar(32)     | enum: pending / active / rejected / disabled                                |
| password_hash    | varchar(255)    | bcrypt                                                                      |
| is_seed          | bool            | true for the three officer seed accounts                                    |
| created_at       | timestamptz     | default `now()`                                                             |
| updated_at       | timestamptz     | `onupdate` to `now()`                                                       |
| approved_at      | timestamptz     | filled by `POST /api/members/{id}/approval`                                 |
| approved_by_id   | int FK→users.id | nullable, ON DELETE SET NULL                                                |

Indexes on `role` and `status`.

### 4.2 `fiscal_years`
| Column      | Type        | Notes                              |
|-------------|-------------|------------------------------------|
| id          | serial PK   |                                    |
| start_year  | int         | unique, e.g. 2025                  |
| label       | varchar     | `FY 25/26`                          |
| start_date  | date        | `2025-04-01`                       |
| end_date    | date        | `2026-03-31`                       |

### 4.3 `maintenance_bills`
| Column          | Type             | Notes                                                              |
|-----------------|------------------|--------------------------------------------------------------------|
| id              | serial PK        |                                                                    |
| member_id       | int FK→users.id  | ON DELETE CASCADE; indexed                                         |
| fiscal_year_id  | int FK→fiscal_years.id | ON DELETE RESTRICT; indexed                                  |
| plot_no         | varchar(40)      | denormalised at bill-creation time (so renaming a member's plot doesn't rewrite history) |
| payable_amount  | numeric(12,2)    | CHECK ≥ 0                                                          |
| notes           | varchar(200)     | nullable                                                           |
| created_at      | timestamptz      | default `now()`                                                    |
| updated_at      | timestamptz      | `onupdate` to `now()`                                              |

Unique `(member_id, fiscal_year_id)`. There is no `received_amount` column —
the value is computed as `COALESCE(SUM(payments.amount), 0)` on read.

### 4.4 `payments`
| Column          | Type                  | Notes                                                                       |
|-----------------|-----------------------|-----------------------------------------------------------------------------|
| id              | serial PK             |                                                                             |
| bill_id         | int FK→maintenance_bills.id | ON DELETE CASCADE; indexed                                            |
| amount          | numeric(12,2)         | CHECK > 0                                                                   |
| paid_on         | date                  |                                                                             |
| method          | varchar(16)           | enum: cash / bank / upi / cheque / other                                    |
| reference       | varchar(80)           | nullable (UTR / cheque no.)                                                 |
| note            | varchar(200)          | nullable                                                                    |
| recorded_by_id  | int FK→users.id       | nullable, ON DELETE SET NULL                                                |
| created_at      | timestamptz           | default `now()`                                                             |

### 4.5 `expenses`
| Column          | Type             | Notes                                       |
|-----------------|------------------|---------------------------------------------|
| id              | serial PK        |                                             |
| spent_on        | date             | indexed                                     |
| category        | varchar(40)      | indexed                                     |
| description     | varchar(200)     |                                             |
| amount          | numeric(12,2)    | CHECK > 0                                   |
| created_by_id   | int FK→users.id  | nullable, ON DELETE SET NULL                |
| created_at      | timestamptz      | default `now()`                             |

### 4.6 `audit_log`
| Column        | Type             | Notes                                                  |
|---------------|------------------|--------------------------------------------------------|
| id            | serial PK        |                                                        |
| actor_id      | int FK→users.id  | nullable                                               |
| actor_label   | varchar          | snapshot like `"Name <email>"`                         |
| action        | varchar          | e.g. `signup`, `member_approved`, `payment_recorded`, `maintenance_assigned`, `expense_added`, `password_changed` |
| entity_type   | varchar          | `user`, `payment`, `maintenance_bill`, `expense`, …    |
| entity_id     | int              | nullable                                               |
| summary       | text             | human-readable                                         |
| payload       | jsonb            | nullable                                               |
| created_at    | timestamptz      | default `now()`                                        |

---

## 5. Core Business Logic

### 5.1 Fiscal-year resolution (`current_fy_start_year`)
```python
today = today or date.today()
return today.year if today.month >= 4 else today.year - 1
```
The frontend currently overrides this and always asks for `fy_start_year=2025`
to pin the prototype's view; remove that override once a year selector ships.

### 5.2 Ensuring a bill row per active plot (`ensure_bills_for_active_members`)
For every `User` with `status = active`, `role = community_member`, and a
non-null `plot_no`, create a `MaintenanceBill` for the given FY if one
doesn't exist, seeded with `DEFAULT_ANNUAL_MAINTENANCE` (env var). Idempotent.

### 5.3 Ledger projection (`ledger_rows`)
One SQL query joins `MaintenanceBill ↔ User` and LEFT JOINs a grouped
`payments` subquery:
```sql
SELECT bill.*, user.*,
       COALESCE(SUM(payment.amount), 0) AS received_amount,
       MAX(payment.paid_on)             AS last_paid_on
FROM   maintenance_bills bill
JOIN   users user            ON user.id = bill.member_id
LEFT JOIN ( SELECT bill_id, SUM(amount) AS received, MAX(paid_on) AS last_paid_on
            FROM payments GROUP BY bill_id ) p
       ON p.bill_id = bill.id
WHERE  bill.fiscal_year_id = :fy_id
ORDER BY bill.plot_no, user.name;
```
Per row:
```
closing_balance = max(payable_amount - received_amount, 0)
status          = "Cleared" if received_amount >= payable_amount else "Pending"
```
Totals (`total_payable`, `total_received`, `total_closing`, `cleared_count`,
`pending_count`, `member_count`) are aggregated in the same Python loop.

### 5.4 Record-payment validation
```
remaining = payable_amount - already_received
if remaining <= 0:                      → 409 "already fully cleared"
if payload.amount > remaining:          → 400 "amount exceeds outstanding"
otherwise insert Payment, audit, commit, return BillDetail.
```

### 5.5 Assign-maintenance application
```
load bills WHERE id IN bill_ids
reject if any fiscal_year_id differs
for bill in bills:
    bill.payable_amount += payload.amount
audit "maintenance_assigned" with bill_ids, amount, from/to
commit; return refreshed ledger
```

### 5.6 Frontend multi-select Record Payment
Loop over selected bills, send one POST per bill with
`min(enteredAmount, closing_balance)`, skip already-cleared. Uses
`Promise.allSettled` so a single failure doesn't take down the whole batch;
UI reports `"recorded N · skipped M"`.

---

## 6. REST API Contract (FastAPI)

Base prefix: `/api`. All routes except `/auth/signup`, `/auth/login`,
`/auth/forgot-password`, and `/health` require
`Authorization: Bearer <jwt>`.

### 6.1 Auth — `app/routers/auth.py`
| Method | Path                       | Role         | Purpose                                      |
|--------|----------------------------|--------------|----------------------------------------------|
| POST   | `/api/auth/signup`         | Public       | Create pending community member              |
| POST   | `/api/auth/login`          | Public       | Verify password, return JWT + UserOut        |
| POST   | `/api/auth/forgot-password`| Public       | Audited noop; always 202                     |
| GET    | `/api/auth/me`             | Authed       | Echo current user                            |

### 6.2 Members — `app/routers/members.py`
| Method | Path                                    | Role        | Purpose                                              |
|--------|-----------------------------------------|-------------|------------------------------------------------------|
| GET    | `/api/members`                          | Officer     | List members (filter by status/role)                 |
| GET    | `/api/members/pending`                  | Officer     | List pending signups                                 |
| POST   | `/api/members/{id}/approval`            | Secretary   | Approve / reject (`{approve: bool}`)                 |
| PATCH  | `/api/members/me`                       | Authed      | Update name/mobile/house/plot                        |
| POST   | `/api/members/me/change-email`          | Authed      | Change own email (verifies current password)         |
| POST   | `/api/members/me/change-password`       | Authed      | Change own password                                  |

### 6.3 Maintenance — `app/routers/maintenance.py`
| Method | Path                                       | Role       | Purpose                                                      |
|--------|--------------------------------------------|------------|--------------------------------------------------------------|
| GET    | `/api/maintenance/fiscal-years`            | Authed     | List FYs (desc)                                              |
| GET    | `/api/maintenance/ledger?fy_start_year=Y`  | Authed     | Ledger rows + totals for an FY (auto-seeds bills)            |
| GET    | `/api/maintenance/bills/{id}`              | Authed     | Bill detail + payments                                       |
| POST   | `/api/maintenance/payments`                | Treasurer  | Record one payment (returns updated `BillDetail`)            |
| POST   | `/api/maintenance/assign`                  | Treasurer  | Add amount to many bills' `payable_amount`                   |

### 6.4 Expenses — `app/routers/expenses.py`
| Method | Path                          | Role       | Purpose                       |
|--------|-------------------------------|------------|-------------------------------|
| GET    | `/api/expenses`               | Authed     | List + totals                 |
| POST   | `/api/expenses`               | Treasurer  | Add one expense               |
| DELETE | `/api/expenses/{id}`          | Treasurer  | Remove one expense            |

### 6.5 Audit — `app/routers/audit.py`
| Method | Path             | Role      | Purpose         |
|--------|------------------|-----------|-----------------|
| GET    | `/api/audit-log` | Officer   | Tail audit log  |

### 6.6 Example — record payment
```http
POST /api/maintenance/payments
Authorization: Bearer …
Content-Type: application/json

{
  "bill_id": 7,
  "amount": 22000,
  "paid_on": "2026-04-15",
  "method": "upi",
  "reference": "UTR123456",
  "note": "Q1 instalment"
}
```
Response `201`:
```json
{
  "bill":     { /* MaintenanceBillRow with updated received/closing */ },
  "payments": [ /* PaymentOut[] ordered newest-first */ ]
}
```

### 6.7 Example — assign maintenance
```http
POST /api/maintenance/assign
{ "bill_ids": [3,4,7], "amount": 5000,
  "from_date": "2025-10-01", "to_date": "2025-12-31" }
```
Response `200`:
```json
{ "updated_count": 3, "fiscal_year": {...}, "rows": [...], "totals": {...} }
```

---

## 7. Frontend Code Map

```
frontend/src/
├── App.tsx                        Router + <RoleGuard>; pre-fetches /auth/me on mount
├── theme.ts                       palette (gold/cream/ink) and MUI theme
├── components/
│   ├── DashboardShell.tsx         Topbar (avatar + 4-item menu), sub-nav
│   ├── ProfileDialog.tsx          Self profile / email / password forms
│   └── Logo.tsx
├── lib/
│   ├── api.ts                     fetch wrapper; attaches Authorization header
│   ├── auth.ts                    login / logout / getCurrentUser / localStorage
│   ├── format.ts                  formatINR, formatDate, todayISO, toNumber
│   ├── types.ts                   shared response types (mirror Pydantic shapes)
│   ├── maintenance.ts             fetchLedger, fetchBillDetail, recordPayment,
│   │                              assignMaintenance
│   ├── expenseApi.ts              fetchExpenses, addExpense, deleteExpense
│   └── members.ts                 listPending, approveMember, updateProfile, …
└── pages/
    ├── Login.tsx
    ├── Signup.tsx
    ├── ForgotPassword.tsx
    ├── MaintenanceDashboard.tsx   6-column ledger + Record Payment + Assign +
    │                              Transaction History
    ├── ExpenditureDashboard.tsx
    └── Approvals.tsx              Secretary-only pending list
```

Key UI mappings to the prototype:
- 6-column table → `MaintenanceDashboard.tsx`, `<TableHead>` block (`ProtoHeader`s)
- Avatar menu (4 items for Treasurer) → `DashboardShell.tsx` `<Menu>` block
- Multi-select Record Payment dialog → `MaintenanceDashboard.tsx`, `payOpen`
- Multi-select Assign Maintenance dialog → `MaintenanceDashboard.tsx`, `assignOpen`
- Transaction History dialog → `MaintenanceDashboard.tsx`, `historyOpen`

---

## 8. Local Setup

### 8.1 Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env                # then edit DATABASE_URL, JWT_SECRET, SEED_*
alembic upgrade head
python -m app.seed                    # idempotent Treasurer/Secretary/President seed
uvicorn app.main:app --reload --port 8000
```
OpenAPI docs at `http://localhost:8000/docs`.

### 8.2 Frontend
```powershell
cd frontend
copy .env.example .env                # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                           # http://localhost:5173
```

### 8.3 Environment variables
| Var                             | Where     | Example                                                                     |
|---------------------------------|-----------|-----------------------------------------------------------------------------|
| `DATABASE_URL`                  | backend   | `postgresql+psycopg://postgres:postgres@localhost:5432/society_portal`      |
| `JWT_SECRET`                    | backend   | 48-byte random                                                              |
| `JWT_EXPIRY_MINUTES`            | backend   | `720`                                                                        |
| `CORS_ALLOW_ORIGINS`            | backend   | `http://localhost:5173,http://127.0.0.1:5173`                                |
| `SEED_TREASURER_EMAIL`          | backend   | `treasurer@cardmasterenclave.in`                                            |
| `SEED_TREASURER_PASSWORD`       | backend   | (rotate via API after first run)                                            |
| `SEED_TREASURER_NAME`           | backend   | `Society Treasurer`                                                         |
| `SEED_PRESIDENT_*`              | backend   | analogous                                                                    |
| `SEED_SECRETARY_*`              | backend   | analogous                                                                    |
| `DEFAULT_ANNUAL_MAINTENANCE`    | backend   | `88000`                                                                      |
| `VITE_API_BASE_URL`             | frontend  | `http://localhost:8000`                                                      |

---

## 9. Non-Functional Mapping
| NFR    | Implementation                                                                                                                              |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | bcrypt; JWT verified per request; role checked by FastAPI deps on every write route; CORS allowlist; secrets in `.env` (git-ignored).        |
| NFR-2  | `app/core/audit.record_audit` writes one `audit_log` row per credential change, approval, payment, expense, signup, assign.                  |
| NFR-3  | Unique `(member_id, fiscal_year_id)`; CHECKs `payable_amount >= 0`, `amount > 0`, 10-digit mobile; FKs with explicit ON DELETE rules.        |
| NFR-4  | MUI 5 responsive layout; `Chip` for status; red/green colour cues.                                                                            |
| NFR-5  | Ledger served by one SQL query with a grouped subquery; per-bill detail loaded on demand only when the History modal opens.                  |

---

## 10. Known Gaps / v3 Hooks
1. Per-payment `period_from` / `period_to` columns to support quarter-by-quarter receipts (replaces the duplicated date in the History dialog).
2. FY selector in the UI so 2025-26 isn't hardcoded.
3. Advance / credit balances if overpayments need to roll forward.
4. Email / SMS dispatch for `pending` accounts and overdue bills.
5. Add a service-token or rate-limit on `/auth/forgot-password` once a real dispatcher exists.
6. Consider materialising a `vw_member_ledger` view if the per-request `ensure_bills_for_active_members` write becomes a hot spot.
