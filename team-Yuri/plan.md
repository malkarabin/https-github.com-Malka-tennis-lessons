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

## PHASE 3 — Payments (Morning) + optional LLM Q&A
**Goal:** Integrate payment for lessons via **Morning** (מורנינג / Green Invoice ecosystem), and optionally let **students ask the coach** questions via an **LLM assistant** (OpenAI-compatible API).

- Payment flow: pay per lesson (per Phase 3 architecture); webhook/callback for paid state.
- **LLM add-on:** Players use `/player/ask`; server validates player↔coach; answers in Hebrew with disclaimers. Configure `OPENAI_API_KEY` — see `docs/env-llm.md`.

**Outcome:** Lessons can be paid via Morning; schedule reflects payment status; players can get AI-assisted answers about tennis/scheduling (not a substitute for the coach on sensitive topics).

---

## Phase pointer
Current phase: see **team-Yuri/PHASE.md** — **Phase 2.5** (LLM student Q&A) before **Phase 3** (Morning payments).
Progression: Phase 1 → 2 → **2.5 (LLM)** → 3 (payments).
