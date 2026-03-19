# Architecture — Phase 1: Core domain and scheduling

## Phase Goal
Deliver the foundational multi-coach model where each coach has a dedicated list of players and a weekly schedule view. A **player belongs to exactly one coach**; on **player sign-in**, the player sees **their coach already** (no coach selection). One-off lessons can be created and are visible/bookable for the **current and next calendar month**. Week = **calendar week (Sunday–Saturday)**; month = **calendar month**. No recurring lessons and no payment in this phase.

---

## Architectural Decisions

1. **Player belongs to one coach**
   - A player is owned by exactly one coach (player → coach association). There is no global, shared player list. On **player sign-in**, the app shows **that player’s coach** immediately—no coach picker or coach selection for the player.
   - Coaches select/manage their own players. Same person can exist as different “players” under different coaches if needed (no cross-coach deduplication required in Phase 1).

2. **Schedule and lessons**
   - **Schedule** is the coach’s availability/slots over time. **Lesson** is a booked slot: coach + player + datetime (and optionally duration).
   - **Week** = **calendar week (Sunday–Saturday)**. **Month** = **calendar month**. Time horizon: lessons and schedule are stored and displayed for the **current calendar month** and the **next calendar month** only. No booking or display outside that range.

3. **Weekly view**
   - Primary UI for schedule is a **weekly view** by **calendar week (Sun–Sat)** with a time axis. For a coach: shows one calendar week at a glance. For a player: shows their coach’s week. Navigation (previous/next week) stays within the current and next calendar month.

4. **Data persistence**
   - Persistent store for: Coaches, Players (each linked to one coach), Lessons (coach, player, datetime, duration), and optionally Coach availability/slots. Technology choice (DB, file, etc.) is left to implementation; structure must support coach-scoped queries and date-range queries by calendar month (current + next).

5. **No authentication detail in architecture**
   - Phase 1 assumes “current user” can act as a coach or as a player; how users log in and how roles are enforced is implementation detail. Architecture only requires: operations are performed in the context of a coach (for coach actions) or a coach+player (for player booking).

---

## Constraints (Non-Negotiable)

- **Multi-coach:** The system must support multiple coaches. Each coach has a distinct list of players and a distinct schedule.
- **Player belongs to one coach:** On player sign-in, the player sees their coach already; no coach selection for players.
- **No shared player list:** Players are not shared across coaches. All player–lesson queries are scoped by coach.
- **Week = calendar week (Sunday–Saturday); month = calendar month.**
- **Weekly schedule view:** At least one view must show a full **calendar week (Sun–Sat)** for the relevant coach (for players: their coach).
- **Calendar-month horizon:** Schedule and lessons are defined and visible only for the **current calendar month** and the **next calendar month**; no booking or display beyond that.
- **One-off lessons only in Phase 1:** Recurring lessons are out of scope for Phase 1; only single, explicit lesson instances.
- **No payment in Phase 1:** No payment integration or payment state in Phase 1.

---

## Technical Boundaries (Out of Scope for Phase 1)

- Recurring lessons (recurrence rules, series expansion).
- Payment (Stripe or any other payment provider).
- Refunds, invoicing, coach payroll.
- Multi-venue or court resource management (unless a minimal slot model is needed for “lesson at time X”).
- Native mobile apps; web-only is in scope.
- Detailed auth/authorization design (only “current user” and coach/player context are assumed).
- Internationalization, accessibility deep-dive, or theming (can be deferred).
