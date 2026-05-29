# Prototype — Webinar Demo Guide

A single-file, zero-setup prototype of the Society Maintenance Portal, built to **demo
to your lead and brainstorm**. It is a clickable mock — data lives in memory and resets
on refresh. No backend, no database, no install.

## How to run
Double-click **`prototype/index.html`** (opens in any browser). Works offline.

## Menu bar
A top menu bar runs across the app:
- **Before login:** Home · **Sign In** · **Sign Up**
- **After login:** Dues · **Expenditure** · **My Payments** · **Collected Balance** · Complaints · (account pill + Sign out)

## Dashboards (after login)
- **Expenditure** — society spend, with a total tile, an itemized table, and a by-category breakdown. The Treasurer can **+ Add expense**; other roles see it read-only.
- **My Payments** — the logged-in user's own unit payment history (date, cycle, amount) with total-paid and current-status tiles. (Treasurer has no unit, so it shows a "not linked" note.)
- **Collected Balance** — society funds: **maintenance collected − expenditure = net available balance**, plus outstanding dues yet to collect and a projected balance.

> **Raising a complaint requires signing in.** Once authenticated, any role can post a
> complaint (FR-18). There is no public/guest complaint form.

## 5-minute demo script

0. **Landing menu bar** — Start on **Home**. Walk the menu: **Sign In** and **Sign Up**
   (resident self-registration request, approved by Treasurer per FR-4a).

1. **Login / roles (FR-1, FR-2, FR-3)** — Click **Sign In** → enter credentials. Maintenance
   details are **not** accessible until you authenticate. Demo accounts (password `demo123`),
   click any to auto-fill:
   - `treasurer@society.in` — Treasurer (admin)
   - `sharma@society.in` — Householder (A-101)
   - `reddy@society.in` — Secretary · `mehta@society.in` — President

   Sign in as **Householder** first.

2. **Due-alert pop-up (FR-15, FR-16)** — Signing in as the Householder for unit A-101
   triggers the dues reminder pop-up automatically (it's suppressed when Cleared, FR-17).

3. **Dues table (FR-4, FR-12)** — Show the table: green `Cleared` / red `Pending` badges,
   balances and advances. Note all roles can *see* everyone's dues but not edit.

4. **Switch to Treasurer** (top-right "Switch role"). Now the **Record payment** buttons
   and **House No. lookup** appear.

5. **House No. lookup pop-up (FR-17a)** — Type `A-101` → see last-payment summary
   "relative to the plan" (last month / quarter / year).

6. **Record a payment (FR-8–FR-11b)** — On a Pending unit (e.g. C-310, due ₹3,000):
   - Pay **₹1,500** → status stays `Pending`, balance ₹1,500 (**partial payment**).
   - Then pay **₹2,000** → `Cleared`, and **₹500 stored as advance** (overpayment rolls
     forward, BR-5). The result pop-up shows balance/advance/status snapshots.

7. **Complaints (FR-18–FR-22)** — Post a complaint (post date auto-set). **Attach photos**
   via "Click to add images" — thumbnails preview, the × removes one, and click any thumbnail
   to enlarge it. Posted images show inline in the complaints list. Note the **"Mark resolved"**
   button only shows on complaints **you** authored (BR-3); resolved date is auto-stamped.

## What's faithful to the spec vs. mocked
- **Faithful:** role-based UI, cycle derivation (Monthly/Quarterly/Annual), the
  payment→balance→advance→status computation (TRD §3.2/§3.3/§3.4), the two distinct
  pop-ups, and the complaint lifecycle.
- **Mocked for the demo:** auth (role picker, no real passwords), persistence (in-memory),
  and "today" is fixed to 2026-05-27 so the demo is stable.

## Good brainstorming prompts for the lead
- The **open questions** in PRD Appendix B — esp. **arrears** (what if several cycles go
  unpaid?) and **email/SMS** reminders vs. in-app only.
- Should the Treasurer dashboard surface a **"who's pending" summary** at the top?
- Is a single Treasurer enough, or do we need a backup admin?
- Do complaints need **categories / comments** (currently just post + resolve)?
