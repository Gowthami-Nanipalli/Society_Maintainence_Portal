# Society Maintenance Portal — Project Requirements Document (PRD)

| Field              | Value                              |
|--------------------|------------------------------------|
| **Document Title** | Society Maintenance Portal — Requirements Specification |
| **Version**        | 2.0 (As-Built)                     |
| **Date**           | 2026-06-02                         |
| **Status**         | Reflects current production build  |
| **Companion Doc**  | TECHNICAL_REQUIREMENTS.md (TRD v2.0) |

> Version 2.0 is an as-built rewrite. The original v1.0 spec (monthly/quarterly/
> annual plans, complaint module, SQL Server) was superseded by the FY-based
> ledger model now shipping. Items dropped from v1.0 are listed in §6.

---

## 1. Overview

### 1.1 Purpose
The Society Maintenance Portal is a web application for **Arihant CardMaster
Enclave** that manages the society's annual maintenance ledger. It gives the
**Treasurer** the tools to assign maintenance dues and record received
payments, lets the **Secretary** approve new resident accounts, gives the
**President** read-access to the same ledger, and lets each **Community
Member** see their own bill and pay history.

### 1.2 Scope (v2.0 — shipped)
- Role-based access for four roles: Treasurer, Secretary, President,
  Community Member.
- Annual maintenance billing keyed by Indian **Fiscal Year** (Apr 1 – Mar 31)
  with a configurable default annual payable amount (₹88,000).
- One **Maintenance Bill** per (member, fiscal year). Bills are auto-created
  for every active member with a plot when the ledger is opened.
- **Record Payment** (Treasurer-only, multi-select) — credit one amount to
  many members in one action.
- **Assign Maintenance** (Treasurer-only, multi-select) — raise the payable
  amount on selected bills (e.g. extraordinary levy).
- **Transaction History** dialog per member with chronological running
  outstanding.
- **Signup → Approval workflow** — anyone may register; Secretary approves or
  rejects pending accounts. Only `active` accounts appear in the ledger.
- **Expenditure ledger** — Treasurer adds/deletes expense entries; everyone
  with an account can read.
- **Audit log** of credential changes, approvals, payments, expense changes,
  signups, and Assign actions; visible to officers.
- **JWT-based auth** with bcrypt-hashed passwords; self-service email and
  password changes for any signed-in user.

### 1.3 Out of scope (current build)
- Online payment gateway / actual money transfer.
- Email / SMS / WhatsApp notifications.
- Complaint module.
- Multi-society / multi-tenant support.
- House-No lookup pop-up and dues-reminder pop-up (deferred from v1.0).
- Advance / carry-forward balances (current model: payable − received,
  floored at zero).

### 1.4 Definitions
| Term                   | Meaning                                                                |
|------------------------|------------------------------------------------------------------------|
| **Fiscal Year (FY)**   | Apr 1 to Mar 31; labelled `FY 25/26` for 2025-04-01..2026-03-31.       |
| **Maintenance Bill**   | One row per `(member, fiscal_year)` holding `payable_amount`.          |
| **Payable Amount**     | What the member must pay for the FY (default ₹88,000, editable).       |
| **Received Amount**    | Sum of all payments recorded against the bill.                         |
| **Closing Balance**    | `max(payable − received, 0)`. The "Amount To Be Paid" shown on screen. |
| **Status**             | `Cleared` if `received ≥ payable`, else `Pending`.                     |
| **Officer**            | Treasurer, Secretary, or President.                                    |

---

## 2. Users & Roles

| Role                 | Database value      | Read access                          | Write access                                                                    |
|----------------------|---------------------|--------------------------------------|---------------------------------------------------------------------------------|
| **Treasurer**        | `treasurer`         | Full ledger, expenses, audit log     | Record payments, Assign Maintenance, add/delete expenses, self profile          |
| **Secretary**        | `secretary`         | Full ledger, expenses, audit log, member list | Approve/reject pending signups, self profile                          |
| **President**        | `president`         | Full ledger, expenses, audit log     | Self profile only                                                               |
| **Community Member** | `community_member`  | Full ledger (read-only), own profile | Self profile only                                                               |

There are exactly three seed officer accounts (Treasurer / Secretary /
President), created idempotently from `SEED_*` environment variables. The
seeder never overwrites an existing officer password hash — rotation happens
through the API.

---

## 3. Functional Requirements

### 3.1 Authentication & Account Lifecycle
- **FR-1** Users log in with `email` **or** `mobile` plus a password. The
  backend returns a signed JWT access token (default 12-hour lifetime).
- **FR-2** Anyone may **sign up** (`POST /api/auth/signup`). Signups land in
  status `pending` with role `community_member` and can log in immediately
  with read-only access to non-bill pages.
- **FR-3** A signed-in user can change their own **profile** (name, mobile,
  house, plot), **email** (re-prompt for current password), and **password**.
- **FR-4** `POST /api/auth/forgot-password` always returns the same response
  regardless of whether the identifier exists; the attempt is audited but no
  email/SMS is dispatched in v2.0.

### 3.2 Approval Workflow (Secretary)
- **FR-5** The Secretary lists `pending` accounts (`GET /api/members/pending`)
  and approves or rejects each one (`POST /api/members/{id}/approval`).
- **FR-6** Approval flips status to `active`, stamps `approved_at` /
  `approved_by_id`, and adds the member's plot to the next ledger view.
- **FR-7** Rejection flips status to `rejected`; logins are then blocked with
  a "request was declined" message.

### 3.3 Maintenance Ledger (all roles, read)
- **FR-8** `GET /api/maintenance/ledger` returns the ledger for an FY. If no
  `fy_start_year` query is given, the backend resolves the current FY by date
  (Apr–Mar rule). The current UI pins requests to FY 2025-26.
- **FR-9** Opening the ledger auto-creates a `MaintenanceBill` for every
  active community member with a plot number that doesn't yet have a bill for
  that FY. The seed amount is `DEFAULT_ANNUAL_MAINTENANCE` (env var, ₹88,000).
- **FR-10** Every row in the response includes: `bill_id, member_id,
  member_name, plot_no, fiscal_year_label, payable_amount, received_amount,
  closing_balance, status, last_payment_on, last_payment_amount`. Status is
  `"Cleared" | "Pending"`, derived server-side.
- **FR-11** Totals returned alongside the rows: `total_payable,
  total_received, total_closing, cleared_count, pending_count, member_count`.

### 3.4 Record Payment (Treasurer)
- **FR-12** `POST /api/maintenance/payments` creates a `Payment` row with
  `bill_id, amount, paid_on, method, reference?, note?`. Method is one of
  `cash | bank | upi | cheque | other`.
- **FR-13** The endpoint rejects amounts ≤ 0, amounts that exceed the
  remaining outstanding, and any attempt to pay an already-cleared bill (409).
- **FR-14** The frontend's multi-select dialog applies the same `amount` to
  each selected bill, **capped at that bill's remaining outstanding**.
  Already-cleared bills are skipped. Per-bill calls are independent
  (`Promise.allSettled`); the UI reports "recorded N · skipped M".
- **FR-15** Every successful payment writes an `audit_log` entry summarising
  who paid what for which member's bill.

### 3.5 Assign Maintenance (Treasurer)
- **FR-16** `POST /api/maintenance/assign` accepts
  `{ bill_ids, amount, from_date, to_date }` and **adds** `amount` to
  `payable_amount` of every bill whose id is in `bill_ids`. All selected
  bills must belong to the same FY (validated server-side).
- **FR-17** The action is treasurer-only. It writes an `audit_log` entry of
  type `maintenance_assigned` with the bill ids, amount, and period.
- **FR-18** `from_date` / `to_date` are advisory (recorded in the audit
  payload) — they do not change the bill's FY or constrain future payments.

### 3.6 Transaction History (any role)
- **FR-19** `GET /api/maintenance/bills/{id}` returns the bill row plus a
  list of every payment against it (`paid_on, amount, method, reference,
  note, recorded_by_name`). The UI walks the payments oldest-first to display
  a running outstanding that ticks down chronologically.

### 3.7 Expenses (Treasurer write, all read)
- **FR-20** Treasurer adds / deletes expense entries (date, category,
  description, amount). All signed-in users can read the expense list and
  totals (per category, overall).
- **FR-21** Every expense add and delete writes an `audit_log` entry.

### 3.8 Audit Log (Officers)
- **FR-22** Officers can read the audit log (`GET /api/audit-log`). Each
  entry stores actor, action key, entity type/id, human-readable summary, an
  optional JSON payload, and timestamp. Community members cannot read it.

---

## 4. Business Rules
| ID    | Rule                                                                                       |
|-------|--------------------------------------------------------------------------------------------|
| BR-1  | `closing_balance = max(payable_amount − received_amount, 0)`; never negative.              |
| BR-2  | `status` is computed every read; it is never persisted as user-editable truth.             |
| BR-3  | Each `(member, fiscal_year)` pair has at most one `MaintenanceBill` (unique constraint).   |
| BR-4  | Only the Treasurer can record payments or assign maintenance.                              |
| BR-5  | Only the Secretary can approve or reject pending signups.                                  |
| BR-6  | A community member account must be `active` and have a `plot_no` to appear in the ledger.  |
| BR-7  | Officer accounts are seeded once; the seeder never overwrites their password hashes.       |
| BR-8  | A payment's `amount` must be strictly positive and ≤ the bill's remaining outstanding.     |
| BR-9  | The Assign endpoint rejects bills spanning multiple fiscal years in one call.              |
| BR-10 | Authentication tokens are JWTs; identity is re-checked from the DB on every authed call.   |

---

## 5. Non-Functional Requirements
- **NFR-1 Security** — passwords stored bcrypt-hashed; role enforcement on
  every write route (`require_treasurer`, `require_secretary`,
  `require_officer`); CORS restricted to configured origins.
- **NFR-2 Auditability** — every credential change, approval, payment,
  expense, signup, and assign is written to `audit_log` with actor + summary.
- **NFR-3 Data Integrity** — referential FKs and CHECK constraints in
  PostgreSQL: unique `(member, fiscal_year)`, `payable_amount >= 0`,
  `amount > 0`, 10-digit mobile, unique email/mobile.
- **NFR-4 Usability** — responsive MUI layout; clear colour cues (red
  background = pending due, green text = cleared, MUI Chip for status).
- **NFR-5 Performance** — single ledger query per page load (`/ledger`), one
  subsequent call per row (`/bills/{id}`) only when the History modal opens.

---

## 6. What changed since v1.0
| v1.0 plan                                            | v2.0 (shipped)                                                       |
|------------------------------------------------------|----------------------------------------------------------------------|
| Monthly / Quarterly / Annual plans per householder   | Single annual FY bill (Apr–Mar), one row per (member, FY)            |
| Complaint module (post, resolve, post/resolved date) | Not implemented                                                      |
| Dues-reminder pop-up on login                        | Not implemented                                                      |
| House-No lookup pop-up                               | Not implemented (replaced by Transaction History dialog)             |
| Advance / carry-forward balances                     | Not implemented (closing balance floored at 0)                       |
| Treasurer manages user accounts                      | Secretary approves signups; Treasurer focuses on the ledger          |
| SQL Server                                           | PostgreSQL                                                           |
| Term "Householder"                                   | Term "Community Member" (role `community_member`)                    |
| Generic "House No."                                  | First-class `plot_no` field (e.g. "1 & 2")                           |

---

## 7. Key User Flows

### 7.1 New resident gets into the ledger
1. Resident clicks **Sign Up**, enters name, email, mobile, house, plot,
   password → account created `pending`.
2. They can log in immediately but see no bill rows for themselves.
3. The Secretary opens **Approvals**, sees them in the pending list, clicks
   **Approve**.
4. On their next ledger reload, a `MaintenanceBill` is auto-created for them
   at the default amount, and they appear in everyone's table.

### 7.2 Treasurer records a payment (multi-select)
1. Treasurer opens **Avatar → Record Payment**.
2. Sets payment date, amount, mode.
3. Ticks every member who paid that amount today and clicks **Record
   Payment**.
4. Backend creates one `Payment` row per selected bill (each amount capped at
   that bill's remaining). UI shows the success/skipped count and refreshes.

### 7.3 Treasurer raises an extra levy
1. Treasurer opens **Avatar → Assign Maintenance**.
2. Sets from-date / to-date (advisory), amount.
3. Ticks every affected member and clicks **Assign Maintenance**.
4. Backend adds the amount to each bill's `payable_amount` in one
   transaction, writes a `maintenance_assigned` audit entry, and returns the
   refreshed ledger.

### 7.4 Member checks their dues
1. Community member logs in.
2. Maintenance tab shows the full ledger; their row is highlighted by being
   their own plot.
3. They click **View (N)** on their row → Transaction History modal lists
   every payment plus the running outstanding and the current Amount To Be
   Paid.

---

## Appendix A — Conceptual Data Model
```
User              (id, name, email, mobile, house, plot_no, role, status,
                   password_hash, is_seed, approved_at, approved_by_id, …)
FiscalYear        (id, label "FY 25/26", start_year, start_date, end_date)
MaintenanceBill   (id, member_id → User, fiscal_year_id → FiscalYear,
                   plot_no, payable_amount, notes)
Payment           (id, bill_id → MaintenanceBill, amount, paid_on, method,
                   reference, note, recorded_by_id → User)
Expense           (id, spent_on, category, description, amount,
                   created_by_id → User)
AuditLog          (id, actor_id, actor_label, action, entity_type,
                   entity_id, summary, payload JSONB, created_at)
```

Relationships: one User → many MaintenanceBills (one per FY) → many Payments;
one User → many Expenses created; one User → many AuditLog entries.

---

## Appendix B — Open Questions / v3 Candidates
1. Per-payment from/to period — backend currently stores `paid_on` only, so
   the Transaction History dialog shows the same date in both From and To
   columns. Worth schema-extending if quarterly receipts become important.
2. House-No lookup pop-up (FR-17a in v1.0) — not implemented; the current
   "View (N)" button covers the same need from inside the ledger.
3. Advance / credit balance — not modelled. Decide whether to support
   overpayment carry-forward.
4. Email / SMS / WhatsApp reminders for `Pending` rows.
5. Whether to add a Complaints module (v1.0 had one; dropped from v2.0).

---

## Appendix C — Shipped Tech Stack (summary)
| Layer    | Tech                                                |
|----------|-----------------------------------------------------|
| Frontend | React 18 + TypeScript, Vite, MUI 5, React Router 6  |
| Backend  | Python 3.11+, FastAPI, SQLAlchemy 2.x, Alembic      |
| Auth     | JWT (PyJWT) + bcrypt (passlib)                      |
| Database | PostgreSQL 14+ (psycopg v3 driver)                  |
| Hosting  | Vercel (SPA), self-hosted or container for the API  |

Detailed stack and database schema live in **TECHNICAL_REQUIREMENTS.md**.
