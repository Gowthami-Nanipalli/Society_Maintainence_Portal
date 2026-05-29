# Society Maintenance Portal — Project Requirements Document (PRD)

| Field              | Value                              |
|--------------------|------------------------------------|
| **Document Title** | Society Maintenance Portal — Requirements Specification |
| **Version**        | 1.0 (Draft)                        |
| **Date**           | 2026-05-27                         |
| **Status**         | Draft for Review                   |
| **Author**         | Deccansoft Team                    |
| **Companion Doc**  | TECHNICAL_REQUIREMENTS.md (TRD v1.0) |

---

## 1. Overview

### 1.1 Purpose
The Society Maintenance Portal is a web-based application that lets a residential community manage maintenance-fee collection and resident complaints in one place. It gives the **Treasurer** the tools to record payments, assign billing plans, and track dues, while giving **Householders, Secretary, and President** a transparent, read-only view of every householder's payment status and balances. The portal also provides a shared complaint-tracking workflow open to all residents.

### 1.2 Scope
**In scope (v1.0):**
- Role-based access (Treasurer vs. read-only users).
- Maintenance billing with Monthly / Quarterly / Annual plans per householder.
- Recording of payments (house no., date paid, amount paid), balance tracking, and automatic payment status.
- Dashboard alerts/pop-ups reminding householders of pending dues based on plan and last-paid date.
- Complaint posting by any user, with auto-generated post date and resolved date.
- "Mark as Resolved" restricted to the complaint's original author.

**Out of scope (v1.0):**
- Online payment gateway / actual money transfer (payments are recorded manually by the Treasurer).
- SMS/email notifications (in-app alerts only — candidate for v2.0).
- Accounting/expense management beyond maintenance collection.
- Multi-society / multi-tenant support.

### 1.3 Definitions
| Term              | Meaning                                                                     |
|-------------------|-----------------------------------------------------------------------------|
| **Householder**   | Resident who owns a flat/house and pays maintenance.                        |
| **Plan**          | Billing frequency chosen by the householder: Monthly, Quarterly, or Annual. |
| **Billing Cycle** | The period covered by one payment, derived from the plan.                   |
| **Balance**       | Outstanding amount the householder still owes for the current cycle.        |
| **Status**        | Computed state of a householder's dues: `Cleared` or `Pending`.             |

---

## 2. Users & Roles

| Role            | Access Level                | Capabilities                                                                                                                                                                                                                          |
|-----------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Treasurer**   | Read + Write (Sole Admin)   | Manage user accounts and role assignment; add/edit householder records; assign plans; record payments (including partial); update amounts paid, balances, and advances; view all householders' data; post and resolve own complaints. |
| **Householder** | Read-only (community-wide)  | View any householder's payment status, balance, and payment history; view own due alerts; post complaints; resolve own complaints.                                                                                                    |
| **Secretary**   | Read-only (community-wide)  | View any householder's payment status, balances, and history; post complaints; resolve own complaints.                                                                                                                               |
| **President**   | Read-only (community-wide)  | View any householder's payment status, balances, and history; post complaints; resolve own complaints.                                                                                                                               |

> **Note:** The **Treasurer is the sole Admin** — the only role that can create/modify financial records *and* manage user accounts and role assignments. **All roles (including Householders) can view every householder's maintenance-bill data** (read-only). All four roles share equal rights in the complaint module.

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization
- **FR-1** The system shall require every user to log in with a unique username/email and password.
- **FR-2** The system shall assign each user exactly one role (Treasurer, Householder, Secretary, President).
- **FR-3** The system shall enforce role-based permissions on every page and action (e.g., financial edit forms are hidden/blocked for non-Treasurer roles).
- **FR-4** The system shall let **all roles view every householder's** maintenance-bill data (read-only); only the Treasurer can edit it.
- **FR-4a** The Treasurer, as sole Admin, shall create, edit, and deactivate user accounts and assign each user a role.

### 3.2 Householder & Plan Management (Treasurer)
- **FR-5** The Treasurer shall add a householder record containing: **House No.**, householder name, contact, and assigned **Plan** (Monthly / Quarterly / Annual).
- **FR-6** The Treasurer shall edit a householder's plan; changing a plan recalculates the next due date and status.
- **FR-7** The system shall store the **maintenance amount per cycle** for each plan (configurable by Treasurer).

### 3.3 Payment Recording (Treasurer)
- **FR-8** The Treasurer shall record a payment with: **House No.**, **Date of Payment**, **Amount Paid**.
- **FR-9** The system shall compute and store the **Balance Amount** = (amount due for cycle − amount paid) for the active cycle.
- **FR-10** The system shall maintain a **payment history** per householder (date, amount, cycle covered, recorded-by).
- **FR-11 (Partial payments)** The Treasurer shall be able to record **partial payments**; the balance shall reflect the remaining due for the cycle, and the status shall stay `Pending` until the cycle is fully paid.
- **FR-11a (Advance / carry-forward)** When a householder pays **more than** the current cycle's due, the system shall store the surplus as an **advance balance** and automatically apply it toward upcoming cycle(s), reducing or clearing their next due.
- **FR-11b** The system shall display each householder's current **advance/credit balance** alongside their dues.

### 3.4 Payment Status & Due Calculation
- **FR-12** The system shall compute each householder's status as:
  - **`Cleared`** — the current cycle's amount is fully paid (balance = 0 for the active cycle).
  - **`Pending`** — the current cycle is unpaid or partially paid, determined from the **last paid date** and the **plan mode**.
- **FR-13** The "current cycle" shall be derived from the plan:
  - *Monthly* — the current calendar month.
  - *Quarterly* — the current 3-month quarter.
  - *Annual* — the current year.
- **FR-14** When today's date passes the cycle boundary without full payment, the status shall automatically become `Pending`.

### 3.5 Due Alerts / Pop-up Reminders
- **FR-15** When a Householder with `Pending` status logs in (or opens their dashboard), the system shall display a **pop-up/alert message** prompting them to clear their dues.
- **FR-16** The alert shall state the pending cycle, amount due, balance, and any advance/credit available.
- **FR-17** The alert shall not appear when status is `Cleared`.
- **FR-17a (House No. lookup pop-up)** When the Treasurer enters a **House No.** in the portal, the system shall display a **pop-up summarizing that householder's most recent payment relative to their plan** — i.e., **last month's** payment details for a Monthly plan, **last quarter's** for Quarterly, and **last year's** for Annual — including last paid date, amount, balance, and current `Cleared`/`Pending` status.

### 3.6 Complaints Module (All Users)
- **FR-18** Any user (any role) shall be able to post a complaint/concern with a title and description.
- **FR-19** The system shall auto-generate and display a **Post Date** when a complaint is created.
- **FR-20** The system shall provide a **"Mark as Resolved"** button visible only to the **user who posted** that complaint.
- **FR-21** When marked resolved, the system shall auto-generate and store the **Resolved Date**.
- **FR-22** All users shall be able to **view all complaints**, including both the Post Date and Resolved Date and current state (Open / Resolved).

---

## 4. Rules & Quality Attributes

### 4.1 Business Rules
| ID | Rule |
|----|------|
| **BR-1** | Status is always derived (computed), never set manually, except indirectly through recorded payments. |
| **BR-2** | Only the Treasurer can create or modify any financial data, and the Treasurer is the sole Admin who manages user accounts and roles. |
| **BR-3** | Only the original author of a complaint can mark it resolved. |
| **BR-4** | Post Date and Resolved Date are system-generated timestamps and cannot be edited by users. |
| **BR-5** | A cycle balance is never negative; any overpayment becomes an **advance/credit** that automatically applies to future cycles. |
| **BR-6** | A householder has exactly one active plan at a time. |
| **BR-7** | All roles can read every householder's maintenance-bill data; write access is Treasurer-only. |

### 4.2 Non-Functional Requirements
- **NFR-1 Security:** Passwords stored hashed; all financial actions authorized server-side (never trust client-side role checks).
- **NFR-2 Usability:** Responsive UI usable on mobile and desktop; status shown with clear color cues (green = Cleared, red = Pending).
- **NFR-3 Auditability:** Every payment record stores who recorded it and when.
- **NFR-4 Performance:** Dashboard and status pages load within ~2 seconds for a community of up to ~500 units.
- **NFR-5 Data Integrity:** Payments and complaints are persisted in a relational database with referential integrity.
- **NFR-6 Availability:** Reasonable uptime for a community-scale app; daily database backups.

---

## 5. Key User Flows

### 5.1 Treasurer records a payment
1. Treasurer logs in → enters a **House No.**
2. System shows a **pop-up of that householder's last payment** for their plan (last month / quarter / year), with last paid date, amount, balance, and status.
3. Treasurer enters Date of Payment and Amount Paid (full or partial).
4. System updates the cycle balance; any surplus is stored as **advance** and auto-applied to upcoming cycles.
5. System recomputes status (`Cleared` / `Pending`); payment appears in the householder's history.

### 5.2 Householder checks status
1. Householder logs in.
2. If `Pending`, a pop-up alert prompts them to clear dues (cycle + amount).
3. Householder views balance and full payment history (read-only).

### 5.3 Complaint lifecycle
1. Any user posts a complaint → Post Date auto-set, state = Open.
2. All users can view it (with Post Date).
3. The author clicks "Mark as Resolved" → Resolved Date auto-set, state = Resolved.
4. All users see both dates and the Resolved state.

---

## Appendix A — Conceptual Data Model

**User** — `id, name, email, password_hash, role`

**Householder / Unit** — `id, house_no, householder_name, contact, plan (Monthly|Quarterly|Annual), amount_per_cycle, advance_balance, user_id (nullable FK → User; links the householder's login)`

**Payment** — `id, householder_id, payment_date, amount_paid, cycle_label, applied_to_cycle, balance_after, advance_after, is_partial, recorded_by (treasurer_id), created_at`

**ComputedStatus (derived/view)** — `householder_id, current_cycle, amount_due, amount_paid, balance, advance_balance, status (Cleared|Pending), last_paid_date`

**Complaint** — `id, author_user_id, title, description, post_date, resolved_date (nullable), state (Open|Resolved)`

*Key relationships:* a User (Householder) → one Householder/Unit → many Payments; any User → many Complaints.

---

## Appendix B — Assumptions, Confirmed Decisions & Open Questions

**Assumptions**
- Payments are received offline (cash/bank) and entered manually by the Treasurer; the portal does not process money.
- Each household maps to one Householder login.

**Confirmed decisions (from stakeholder review)**
1. ✅ **All roles** (including Householders) can view **every** householder's maintenance-bill data (read-only).
2. ✅ **Partial payments** and **advance/carry-forward** are required in v1.0.
3. ✅ Entering a **House No.** triggers a pop-up of that householder's **last payment relative to their plan** (last month / quarter / year).
4. ✅ The **Treasurer is the sole Admin** and manages all user accounts and role assignments.

**Remaining open questions**
1. Should reminders also go out via **email/SMS**, or are in-app pop-ups enough for v1.0?
2. Should complaints support **comments/threads** or **categories**, or is a simple post + resolve enough for v1.0?
3. For advances, should the surplus apply automatically to the **immediate next cycle only**, or roll across **multiple** future cycles until exhausted? *(Current spec assumes it rolls across multiple cycles.)*
4. **Arrears across multiple unpaid cycles** — the model tracks a single "current cycle." When several cycles go unpaid, should outstanding balances **accumulate** across cycles, or is only the current cycle's due ever owed? *(Not yet specified; forward-rolling advances are modeled, backward-rolling arrears are not.)*
5. **Timezone for cycle/"today" computation** — should "current month/quarter/year" and the `Pending` boundary use **UTC** (timestamps default to `SYSUTCDATETIME()`) or **society-local time**? This affects status at month/quarter boundaries.
6. **Password recovery** — FR-1/FR-4a cover login and Treasurer-managed accounts but not a **forgotten-password / reset** flow, nor who sets the initial password.

---

## Appendix C — Indicative Tech Stack

| Layer | Option |
|-------|--------|
| Frontend | React |
| Backend | Python |
| Database | SQL Server |
| Auth    | JWT or session-based with hashed passwords |
| Hosting | Azure App Service / any cloud or on-prem |

*(Final stack to be confirmed based on team preference and existing infrastructure. The detailed, committed stack lives in the companion TRD.)*
