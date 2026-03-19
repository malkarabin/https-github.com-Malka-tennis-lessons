# Tennis Lesson Scheduling App — Master Plan

## Product Summary
Multi-coach tennis lesson scheduling: each coach has a dedicated list of players; a player **belongs to** one coach and, on sign-in, sees their coach already (no coach selection). Weekly schedule view (calendar week Sunday–Saturday), recurring lessons, bookable up to one month ahead (calendar month), with payment via Stripe (or similar).

## Definitions
- **Week:** Calendar week, **Sunday to Saturday**.
- **Month:** **Calendar month** (e.g. 1st through last day of that month). “One month ahead” means the **current calendar month** and the **next calendar month** (visible and bookable within that range).

## Out of Scope for v1
- Refunds automation
- Coach payroll
- Multi-venue / court management (unless required for scheduling)
- Mobile native apps (web-first assumed unless stated)

---

## PHASE 1 — Core domain and scheduling
**Goal:** Establish multi-coach model, per-coach player lists, and a weekly schedule view with one-off lessons bookable up to one month ahead.

- Domain: Coach, Player (belongs to one coach), Lesson/Slot, Schedule.
- Each coach has their own list of players; a player belongs to exactly one coach. On **player sign-in**, the player sees **their coach already** (no coach picker).
- **Each lesson is exactly 1 hour** (fixed duration; no duration selection).
- Weekly schedule = **calendar week (Sunday–Saturday)**. Month = **calendar month**. Bookable range = **current + next calendar month**. When a player schedules a lesson, the slot appears **in that player’s color** in the calendar (occupied = player color).
- **On player deletion:** All lessons (slots) booked by that player are removed so the slots become free again; no orphaned gray slots.
- No recurrence yet; no payment in this phase.

**Outcome:** Coaches manage their players and view/fill a weekly (Sun–Sat) grid; players sign in and see their coach’s schedule; lessons stored and visible for current and next calendar month; booked slots shown in the scheduled player’s color.

---

## PHASE 2 — Recurring lessons
**Goal:** Support recurring lessons (e.g. same slot every week) and expand them into the 1-month window.

- Recurrence model: pattern (weekly), anchor slot, end condition (e.g. after 4 occurrences or end of calendar month).
- System expands recurring series into concrete lesson instances within the current and next calendar month.
- Weekly view (Sun–Sat) and calendar-month horizon show both one-off and recurring-derived lessons.

**Outcome:** Coaches/players can create recurring lessons; schedule shows all instances within the 1-month window.

---

## PHASE 3 — Payments (Stripe)
**Goal:** Integrate payment for lessons (Stripe or similar).

- Payment flow: pay per lesson or per batch (e.g. monthly pack), as defined in Phase 3 architecture.
- Connect to Stripe (Checkout, Payment Intents, or link); no refunds automation in v1.
- Payment state linked to lesson/slot (e.g. pending, paid).

**Outcome:** Lessons can be paid for via Stripe; schedule or list view reflects payment status where needed.

---

## Phase pointer
Current phase: **PHASE=1** (see team-Yuri/PHASE.md).
Progression: complete Phase 1 → validation → PHASE=2 → Phase 2 → … → PHASE=3.
