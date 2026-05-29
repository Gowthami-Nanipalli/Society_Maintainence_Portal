# Society Maintenance Portal — Technical Requirements Document (TRD)

| Field              | Value                          |
|--------------------|--------------------------------|
| **Document Title** | Society Maintenance Portal — Technical Requirements |
| **Version**        | 1.0 (Draft)                    |
| **Date**           | 2026-05-27                     |
| **Status**         | Draft for Review               |
| **Author**         | Deccansoft Team                |
| **Companion Doc**  | PROJECT_REQUIREMENTS.md (PRD v1.0) |

---

## 1. Overview

### 1.1 Purpose & Scope
This TRD translates the functional requirements in the PRD (v1.0) into a concrete
technical design and implementation plan. It defines the technology stack, system
architecture, API contract, database schema, security model, and the core
computation logic (billing cycles, balances, advances) needed to build the portal.

Scope is bound to PRD v1.0: role-based access, maintenance billing (Monthly /
Quarterly / Annual), manual payment recording with partial payments and advances,
computed due status, in-app due alerts, and the complaints module. Out of scope:
online payment gateway, email/SMS, multi-tenancy.

### 1.2 Stack at a Glance
A typed, three-tier web app: **React 18 + TypeScript** SPA → **Python 3.12 + FastAPI**
REST API → **Microsoft SQL Server 2022 / Azure SQL**, with **JWT** stateless auth and
hosting on **Azure**. The full stack table with rationale is in **Appendix A**.

### 1.3 Key Design Principles
- **Three-tier**: React SPA → FastAPI REST API → SQL Server.
- **Stateless auth**: JWT access tokens; the backend re-validates role on every
  write endpoint (NFR-1 — never trust client-side role checks).
- **Derived status**: `Cleared`/`Pending`, balances, and advances are computed
  server-side from payment records and the active plan, never stored as
  user-editable truth (BR-1).

---

## 2. Architecture & Security Model

### 2.1 System Architecture
```
+-------------------+        HTTPS / JSON         +----------------------+
|   React SPA       |  <----------------------->  |  FastAPI Backend     |
|  (Vite, MUI, TSX) |     Bearer JWT in header    |  (Uvicorn ASGI)      |
+-------------------+                             +----------+-----------+
        |                                                    |
        | Route guards by role                               | SQLAlchemy / pyodbc
        | (Treasurer write, others read-only)                |
        v                                                    v
  Browser localStorage                              +----------------------+
  (access token only)                               |  SQL Server 2022     |
                                                     |  (relational store)  |
                                                     +----------------------+
```

### 2.2 Role Enforcement Matrix (server-side, implements FR-3)
| Action                              | Treasurer | Householder | Secretary | President |
|-------------------------------------|:---------:|:-----------:|:---------:|:---------:|
| Manage users / assign roles         |     ✅    |     ❌      |     ❌    |     ❌    |
| Add/edit householders & plans       |     ✅    |     ❌      |     ❌    |     ❌    |
| Record payments                     |     ✅    |     ❌      |     ❌    |     ❌    |
| View any householder's bill data    |     ✅    |     ✅      |     ✅    |     ✅    |
| Post complaint                      |     ✅    |     ✅      |     ✅    |     ✅    |
| Resolve **own** complaint           |     ✅    |     ✅      |     ✅    |     ✅    |

> Role is re-validated on the server for every write route (NFR-1). Passwords are
> stored bcrypt-hashed; client-side role checks are never trusted.

---

## 3. Data Model & Core Computation Logic

### 3.1 Schema Overview
Four base tables plus one derived status view. Full column-level definitions are in
**Appendix B**.

- **`users`** — accounts, roles, hashed passwords, active flag.
- **`householders`** (Unit) — house no., name, contact, plan, per-cycle amount, advance balance.
- **`payments`** — each recorded payment with applied cycle, balance/advance snapshots, audit fields.
- **`complaints`** — title, description, post/resolved timestamps, state.
- **`vw_householder_status`** — derived `Cleared`/`Pending` status, balance, and advance per householder (see §3.4).

Conventions: identity PKs use `INT IDENTITY`; money uses `DECIMAL(10,2)`; timestamps
use `DATETIME2`; enums modeled as `VARCHAR` with `CHECK` constraints.

### 3.2 Current Cycle Derivation (FR-13)
```
plan == Monthly   -> cycle_label = "YYYY-MM"        (current calendar month)
plan == Quarterly -> cycle_label = "YYYY-Q{1..4}"   (current 3-month quarter)
plan == Annual    -> cycle_label = "YYYY"           (current year)
```

### 3.3 Payment Application & Advance (FR-9, FR-11, FR-11a, BR-5)
```
due_for_cycle = amount_per_cycle - (already_paid_this_cycle)
total_available = amount_paid + existing_advance_balance

if total_available >= due_for_cycle:
    balance_after = 0
    advance_after = total_available - due_for_cycle   # surplus rolls forward
    status = Cleared
    # advance_after auto-applies to subsequent cycles until exhausted
else:
    balance_after = due_for_cycle - total_available
    advance_after = 0
    is_partial = (amount_paid > 0)
    status = Pending
```
- A cycle balance is never negative (BR-5); surplus becomes advance and rolls
  across multiple future cycles until exhausted (per PRD open-question default).

### 3.4 Status Rule (FR-12, FR-14)
- `Cleared` when active-cycle balance = 0.
- `Pending` when the active cycle is unpaid/partial, or today's date crosses the
  cycle boundary without full payment.

`vw_householder_status` derives `(householder_id, current_cycle, amount_due,
amount_paid, balance, advance_balance, status, last_paid_date)` from `householders`
+ `payments` relative to the current date and plan. Implemented as a view for read
endpoints; the same logic lives in the service layer for write-time recompute.

---

## 4. API & Frontend Design

### 4.1 REST API Contract (FastAPI)
> Base path `/api`. All non-auth routes require `Authorization: Bearer <jwt>`.
> Write routes require `role == Treasurer` unless noted.

| Method  | Path                                            | Role        | Maps To       | Description                                              |
|:-------:|:------------------------------------------------|:------------|:-------------:|:---------------------------------------------------------|
| `POST`  | `/auth/login`                                   | Public      | FR-1          | Authenticate user and return JWT token                   |
| `GET`   | `/users/me`                                     | Any         | FR-2          | Fetch current logged-in user details and role            |
| `POST`  | `/users`                                        | Treasurer   | FR-4a         | Create new user and assign role                          |
| `PATCH` | `/users/{id}`                                   | Treasurer   | FR-4a         | Edit or deactivate existing user                         |
| `GET`   | `/householders`                                 | Any         | FR-4          | Retrieve list of householders (read-only for all roles)  |
| `POST`  | `/householders`                                 | Treasurer   | FR-5          | Add new householder along with payment plan              |
| `PATCH` | `/householders/{id}`                            | Treasurer   | FR-6 / FR-7   | Update plan or amount and recompute due                  |
| `GET`   | `/householders/{id}/status`                     | Any         | FR-12         | Get computed householder status, balance, and advance    |
| `GET`   | `/householders/by-house/{house_no}/last-payment`| Treasurer   | FR-17a        | Display last payment summary popup                       |
| `POST`  | `/payments`                                     | Treasurer   | FR-8, FR-9, FR-11/11a/11b | Record payment and apply advance amount      |
| `GET`   | `/householders/{id}/payments`                   | Any         | FR-10         | Retrieve payment history of householder                  |
| `GET`   | `/dashboard/alerts`                             | Any         | FR-15 / FR-16 | Show pending due alerts for current user                 |
| `GET`   | `/complaints`                                   | Any         | FR-22         | Retrieve all complaints                                  |
| `POST`  | `/complaints`                                   | Any         | FR-18 / FR-19 | Submit complaint with automatic post date                |
| `PATCH` | `/complaints/{id}/resolve`                      | Author Only | FR-20 / FR-21 | Mark complaint as resolved after author validation (BR-3)|

Sample — record payment:
```http
POST /api/payments
{ "house_no": "A-101", "payment_date": "2026-05-20", "amount_paid": 3000.00 }
-> 201
{ "payment_id": 88, "applied_to_cycle": "2026-05", "balance_after": 0,
  "advance_after": 500.00, "status": "Cleared" }
```

### 4.2 Frontend Structure
```
src/
  api/             # Axios client, typed endpoint wrappers, JWT interceptor
  auth/            # login, token storage, role context, route guards
  components/      # shared UI (StatusBadge, DueAlertDialog, PaymentForm)
  features/
    householders/  # householder list, detail, plan edit (Treasurer)
    payments/      # record payment + last-payment pop-up (Treasurer)
    dashboard/     # status + due-alert pop-up
    complaints/    # list, post, resolve-own
  routes/          # React Router config with <RoleGuard>
  hooks/           # TanStack Query hooks
```
- `StatusBadge`: green = Cleared, red = Pending (NFR-2).
- `DueAlertDialog`: shown on login when the current householder's status is `Pending`, and suppressed when `Cleared` (FR-15/16/17).
- House-No lookup pop-up uses `/householders/by-house/{house_no}/last-payment` (FR-17a).

---

## 5. Delivery Plan & Operations

### 5.1 Non-Functional Mapping
| NFR    | Implementation                                                              |
|--------|-----------------------------------------------------------------------------|
| NFR-1  | bcrypt hashing; server-side role checks on every write route                |
| NFR-2  | MUI responsive layout; color-coded `StatusBadge`                            |
| NFR-3  | `recorded_by` + `created_at` on every payment                               |
| NFR-4  | Status view + indexed FKs; TanStack Query caching → <2s for ~500 units      |
| NFR-5  | FK constraints + CHECK constraints in SQL Server                            |
| NFR-6  | Daily Azure SQL automated backups                                           |

### 5.2 Phased Delivery Plan
| Phase | Deliverable                                                                |
|-------|----------------------------------------------------------------------------|
| **0** | Repo, CI, Docker, DB schema + Alembic baseline                             |
| **1** | Auth + user management (Treasurer admin) — FR-1..4a                        |
| **2** | Householder & plan management — FR-5..7                                    |
| **3** | Payment recording + balance/advance engine — FR-8..11b, FR-12..14         |
| **4** | Dashboard alerts + House-No pop-up — FR-15..17a                           |
| **5** | Complaints module — FR-18..22                                             |
| **6** | Hardening: tests, NFR pass, deploy to Azure                               |

### 5.3 Open Technical Decisions (from PRD Appendix B)
1. **Email/SMS reminders** — out of v1.0; in-app pop-ups only. (Revisit v2.0.)
2. **Complaint threads/categories** — v1.0 = simple post + resolve.
3. **Advance roll-over** — confirmed: surplus rolls across *multiple* future
   cycles until exhausted (implemented in §3.3).
4. **Arrears across multiple unpaid cycles** — `vw_householder_status` currently
   evaluates only the active cycle. Whether unpaid prior cycles accumulate into the
   outstanding balance is undecided (PRD Appendix B, open question 4).
5. **Timezone for cycle/`Pending` computation** — timestamps default to
   `SYSUTCDATETIME()` (UTC); confirm whether cycle/"today" boundaries should use UTC
   or society-local time (PRD Appendix B, open question 5).
6. **`already_paid_this_cycle` source** — computed as `SUM(payments.amount_paid)`
   where `applied_to_cycle = current cycle`; surfaced via `vw_householder_status`.

---

## Appendix A — Technology Stack

| Layer            | Technology                                   | Rationale                                              |
|------------------|----------------------------------------------|--------------------------------------------------------|
| **Frontend**     | React 18 + TypeScript, built with Vite       | Type safety for money logic; fast dev loop             |
| UI components    | Material UI (MUI)                            | Responsive, accessible, easy color cues (NFR-2)        |
| Routing          | React Router                                 | SPA navigation with route guards                       |
| Data fetching    | TanStack Query + Axios                       | Caching, retries, JWT interceptors                     |
| Forms            | React Hook Form + Zod                        | Validated payment/complaint forms                      |
| **Backend**      | Python 3.12 + FastAPI                        | Async, typed, auto OpenAPI docs                        |
| ORM / migrations | SQLAlchemy 2.x + Alembic                     | Relational mapping + versioned schema                  |
| Schemas          | Pydantic v2                                  | Request/response validation                            |
| Auth             | python-jose (JWT) + passlib[bcrypt]          | Hashed passwords, stateless auth (NFR-1)               |
| Server           | Uvicorn (ASGI)                               | Production ASGI runtime                                |
| **Database**     | Microsoft SQL Server 2022 / Azure SQL        | Relational integrity (NFR-5)                           |
| DB driver        | pyodbc + ODBC Driver 18 for SQL Server       | Supported MS connector                                 |
| **Testing**      | Pytest (API), Vitest + RTL (UI)              | Unit/integration coverage                              |
| **Quality**      | Ruff, Black, mypy / ESLint, Prettier         | Lint, format, type-check                               |
| **DevOps**       | Git + GitHub, Docker, GitHub Actions (CI/CD) | Reproducible builds & pipelines                        |
| **Hosting**      | Azure App Service (API), Static Web Apps (UI), Azure SQL DB | Matches PRD hosting note          |

---

## Appendix B — Database Schema (SQL Server)

> Identity PKs use `INT IDENTITY`. Money uses `DECIMAL(10,2)`. Timestamps use
> `DATETIME2`. Enums modeled as `VARCHAR` with `CHECK` constraints.

### `users`
| Column         | Type            | Notes                                                  |
|----------------|-----------------|--------------------------------------------------------|
| id             | INT IDENTITY PK |                                                        |
| name           | NVARCHAR(120)   | NOT NULL                                               |
| email          | NVARCHAR(255)   | UNIQUE, NOT NULL                                       |
| password_hash  | NVARCHAR(255)   | NOT NULL                                               |
| role           | VARCHAR(20)     | CHECK IN ('Treasurer','Householder','Secretary','President') |
| is_active      | BIT             | DEFAULT 1                                              |
| created_at     | DATETIME2       | DEFAULT SYSUTCDATETIME()                               |

### `householders`  (Unit)
| Column            | Type            | Notes                                              |
|-------------------|-----------------|----------------------------------------------------|
| id                | INT IDENTITY PK |                                                    |
| house_no          | NVARCHAR(20)    | UNIQUE, NOT NULL                                   |
| householder_name  | NVARCHAR(120)   | NOT NULL                                           |
| contact           | NVARCHAR(40)    |                                                    |
| plan              | VARCHAR(10)     | CHECK IN ('Monthly','Quarterly','Annual')          |
| amount_per_cycle  | DECIMAL(10,2)   | NOT NULL (FR-7)                                    |
| advance_balance   | DECIMAL(10,2)   | DEFAULT 0 (FR-11a/b)                               |
| user_id           | INT FK→users.id | nullable                                           |

### `payments`
| Column          | Type                     | Notes                                     |
|-----------------|--------------------------|-------------------------------------------|
| id              | INT IDENTITY PK          |                                           |
| householder_id  | INT FK→householders.id   | NOT NULL                                  |
| payment_date    | DATE                     | NOT NULL (FR-8)                           |
| amount_paid     | DECIMAL(10,2)            | NOT NULL                                  |
| cycle_label     | NVARCHAR(20)             | e.g. '2026-05', '2026-Q2', '2026'         |
| applied_to_cycle| NVARCHAR(20)             | cycle the payment was applied to          |
| balance_after   | DECIMAL(10,2)            | snapshot after applying (FR-9)            |
| advance_after   | DECIMAL(10,2)            | advance snapshot after applying           |
| is_partial      | BIT                      | DEFAULT 0 (FR-11)                         |
| recorded_by     | INT FK→users.id          | NOT NULL (NFR-3)                          |
| created_at      | DATETIME2                | DEFAULT SYSUTCDATETIME()                  |

### `complaints`
| Column          | Type             | Notes                                             |
|-----------------|------------------|---------------------------------------------------|
| id              | INT IDENTITY PK  |                                                   |
| author_user_id  | INT FK→users.id  | NOT NULL                                          |
| title           | NVARCHAR(200)    | NOT NULL                                          |
| description     | NVARCHAR(MAX)    |                                                   |
| post_date       | DATETIME2        | DEFAULT SYSUTCDATETIME(), immutable (BR-4)        |
| resolved_date   | DATETIME2        | nullable                                          |
| state           | VARCHAR(10)      | CHECK IN ('Open','Resolved') DEFAULT 'Open'       |

### Computed Status (SQL VIEW or service-layer computation)
`vw_householder_status(householder_id, current_cycle, amount_due, amount_paid,
balance, advance_balance, status, last_paid_date)` — derived from `householders` +
`payments` relative to the current date and plan (FR-12 → FR-14). Implemented as a
view for read endpoints; the same logic lives in the service layer for write-time
recompute.

---

## Appendix C — Environment & Setup (Windows / Local Dev)

**Backend**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn[standard] sqlalchemy alembic pyodbc `
            pydantic "python-jose[cryptography]" "passlib[bcrypt]" pytest
# Install "ODBC Driver 18 for SQL Server" separately
uvicorn app.main:app --reload
```

**Frontend**
```powershell
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @mui/material @emotion/react @emotion/styled `
            react-router-dom @tanstack/react-query axios `
            react-hook-form zod
npm run dev
```

**Connection string (env var `DB_URL`)**
```
mssql+pyodbc://USER:PASS@HOST:1433/SocietyDb?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes
```
