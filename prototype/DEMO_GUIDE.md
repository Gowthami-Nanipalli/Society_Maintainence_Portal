# Prototype — Treasurer Dashboard Walk-through

A single-file, zero-setup mock of the **Treasurer Dashboard** for the Society
Maintenance Portal. It is the visual reference the production React app is
built against. No backend, no database — state lives in memory and resets on
refresh.

## How to run
Double-click **`prototype/index.html`** (opens in any modern browser). Works
offline. To preview the production build instead, run the FastAPI backend +
Vite frontend per the root README.

## What this prototype shows

A signed-in Treasurer's view of the maintenance ledger for **FY 2025-26**.
The page contains:

- **Topbar** — society heading + an avatar (`TR`) that opens a four-item
  menu: Profile · Assign Maintenance · Record Payment · Logout.
- **Members panel** — one row per plot with the six locked columns:
  S.No · Plot No · Name of the Member · Amount To Be Paid · Status ·
  Transaction History.
- **TOTAL footer row** — sum of every member's outstanding due.

Numeric cells are colour-coded: red background when amount > 0, green text
when the row is cleared.

## Modals

### Transaction History (per-member)
Click **View (N)** on any row to open a modal showing:

- A table with **From Date · To Date · Amount Paid · Outstanding Amount**,
  one row per recorded payment. Outstanding decreases chronologically.
- A footer pill **"Amount need to be paid"** mirroring the main dashboard's
  due figure for that plot.

### Record Payment (avatar menu → Record Payment)
Multi-select dialog used to credit a payment to many members in one go.
Fields: payment date, amount, mode (Cash / Bank / UPI / Cheque), and a
checkbox list of members with each one's current due. The summary line at
the bottom shows **Selected: N · Total received: ₹X**.

### Assign Maintenance (avatar menu → Assign Maintenance)
Multi-select dialog used to **add** an amount to selected members' payable
balance — for example, to raise an extraordinary levy. Fields: from-date,
to-date, amount payable, and the same checkbox list. Bottom summary shows
**Selected: N · Total charged: ₹X**. There is no Mode field — assigning
maintenance is not a payment, it raises what's owed.

## How the prototype maps to the production app

| Prototype piece                | Production location                                                                 |
|--------------------------------|--------------------------------------------------------------------------------------|
| 6-column members table         | `frontend/src/pages/MaintenanceDashboard.tsx` — `<TableHead>` and the row map        |
| Avatar 4-item menu             | `frontend/src/components/DashboardShell.tsx` — `<Menu>` block, Treasurer-gated items |
| Transaction History modal      | `MaintenanceDashboard.tsx` — `historyOpen` dialog, `fetchBillDetail(...)` API call   |
| Record Payment modal           | `MaintenanceDashboard.tsx` — `payOpen` dialog, multi-call `recordPayment(...)`       |
| Assign Maintenance modal       | `MaintenanceDashboard.tsx` — `assignOpen` dialog, `assignMaintenance(...)` API call  |

Production differences worth knowing:

- The production backend is the source of truth (PostgreSQL via FastAPI). The
  prototype keeps its own in-memory `state` array.
- The production app uses MUI components and the gold/cream brand palette; the
  prototype is hand-styled CSS so it can ship as a single HTML file.
- The production "Amount Paid" timeline shows `paid_on` only — the backend
  Payment model doesn't yet store per-payment from/to ranges, so the From/To
  columns mirror the same date.
