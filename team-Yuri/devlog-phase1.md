# Devlog — Phase 1: Core domain and scheduling

## Implemented Milestones

- **M1 — Data model and persistence:** Implemented in `src/lib/types.ts` (Coach, Player, Lesson), `src/lib/store.ts` (file-based JSON in storage/data). Coach-scoped queries; date-range by calendar month. API routes: GET/POST /api/coaches, GET/POST /api/players, GET/PUT/DELETE /api/players/[id], GET/POST /api/lessons, GET /api/lessons/player.
- **M2 — Coach and player management:** Home page sign-in as coach (select coach) or player (select player → coach resolved automatically, no coach picker). Coach dashboard at /coach: add, edit, list, remove players (own list only). On player remove: cascade delete — all lessons for that player are removed so slots are freed (no orphaned gray slots). Player sees “My coach’s schedule” link after sign-in.
- **M3 — Lesson booking and storage:** Create lesson via POST /api/lessons; list by coach and date range. Server enforces current/next calendar month via `isWithinBookingWindow`. One-off lessons only.
- **M4 — Calendar-month horizon:** `src/lib/calendar.ts`: getCalendarWeekStart/End (Sunday–Saturday), getCurrentMonthBounds, getNextMonthBounds, isWithinBookingWindow, isWeekInAllowedRange. Weekly schedule nav (prev/next week) disabled when week is outside current or next calendar month.
- **M5 — Weekly schedule view:** `src/components/WeeklySchedule.tsx`: calendar week (Sun–Sat) with time axis (7:00–20:00). Coach schedule at /coach/schedule (can add lessons); player schedule at /player/schedule (read-only, shows their coach’s week). Navigation constrained to current and next month.

## Quality Checks

- Unit tests passing: **Yes** (src/lib/__tests__/calendar.test.ts, src/lib/__tests__/store.test.ts; run `npm test`).
- Lint clean: **Yes** (run `npm run lint`).

## Developer Declaration

- Implementation complete: **Yes**
