# Manager Plan — Phase 1: Core domain and scheduling

## Phase Goal
Implement the foundational multi-coach model: each coach has a dedicated list of players; a **player belongs to one coach** and on **sign-in sees their coach already** (no coach picker). Weekly schedule = **calendar week (Sunday–Saturday)**; bookable range = **current + next calendar month**. One-off lessons only; no payment.

---

## Ordered Milestones

1. **M1 — Data model and persistence**
   - Define and persist: Coach, Player (linked to exactly one coach), Lesson (coach, player, datetime, duration).
   - Optional: Coach availability/slots if needed for “bookable” slots.
   - All queries coach-scoped; support date-range queries by **calendar month** (current + next month only).

2. **M2 — Coach and player management**
   - **Coach flow:** Current user as coach can manage their own list of players (add, edit, list, remove). No visibility of other coaches’ players.
   - **Player flow:** On **player sign-in**, resolve the player’s coach and show that coach immediately—**no coach selection**. Player sees only their coach’s schedule and their own lessons.

3. **M3 — Lesson booking and storage**
   - Create a lesson: coach + player (from that coach’s list) + datetime + duration. Enforce datetime is within **current or next calendar month**.
   - List lessons for a coach (or for a player, scoped to their coach) within a date range. No recurrence; each lesson is a single instance.

4. **M4 — Calendar-month horizon**
   - **Week** = **calendar week (Sunday–Saturday)**. **Month** = **calendar month**. All schedule and lesson data is stored and displayed only for the **current calendar month** and the **next calendar month**. Reject or hide any booking or display outside that range.

5. **M5 — Weekly schedule view**
   - UI: **calendar week (Sun–Sat)** with time axis. For coach: show their week; for player: show **their coach’s** week. Show lessons (and optionally free slots). Navigation: previous/next **calendar week**, constrained to current and next calendar month.

---

## Detailed planning for the development team

- **Tech stack:** Not specified by architecture; choose a simple web stack (e.g. React/Next or similar frontend, small backend or serverless, DB or file-based store). Keep coach-scoped access and 1-month range in mind.
- **Auth:** Phase 1 requires: (1) “current user” as coach → manage own players and schedule; (2) “current user” as player → **see their coach immediately on sign-in** (no coach picker). Implement minimal auth (e.g. role + player→coach link) so player sessions resolve to one coach.
- **Data:** Player has a required coach reference. Lessons reference coach and player; datetime and duration required. Index or query for “lessons by coach in [start, end]” with dates in **calendar months** (current + next). Week boundaries = Sunday–Saturday.
- **UI:** Weekly schedule = **calendar week (Sun–Sat)** for the relevant coach; for players, always “my coach’s week.” Navigation: previous/next calendar week within current and next month. Other screens: coach’s player list management; create lesson (pick player, date/time within current/next calendar month). **No coach selection screen for players.**
- **Testing:** Unit tests for coach-scoped player and lesson logic; validation that booking and display respect the 1-month window. Lint clean.

---

## Acceptance / Gating Criteria

- [x] Multiple coaches are supported; each has a distinct list of players and a distinct schedule.
- [x] A player belongs to exactly one coach; on player sign-in, the player sees their coach already (no coach selection).
- [x] Weekly schedule view shows a full **calendar week (Sunday–Saturday)** for the relevant coach (for players: their coach).
- [x] Schedule and lessons are visible and bookable only for the **current** and **next calendar month**; no data or UI beyond that.
- [x] One-off lessons only; no recurrence or series.
- [x] No payment or payment state in the app.
- [x] Unit tests passing; lint clean.
- [x] docs/doc-phase1.md updated with what was built and how to run it.

---

## Status
STATUS: READY FOR VALIDATION
