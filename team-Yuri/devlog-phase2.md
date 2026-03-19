# Devlog — Phase 2: Recurring lessons

## Implemented Milestones

- **M1 — Recurring series model and storage:** RecurringSeries type in `src/lib/types.ts` (id, coachId, playerId, weekday 0–6, hour, endConditionType "afterN"|"throughMonth", endConditionValue). Persist in `storage/data/recurring.json`. Store: listRecurringByCoach, addRecurring, removeRecurringSeries. In removePlayer: also remove all recurring series for that playerId.
- **M2 — Expansion logic:** `src/lib/recurring.ts` — expandSeries(series) returns Lesson[] for current + next calendar month. afterN: up to N instances; throughMonth: all instances in chosen month (current or next). Unit tests in `src/lib/__tests__/recurring.test.ts`.
- **M3 — API and schedule data:** GET /api/lessons merges one-off lessons (listLessonsByCoach) with expanded instances from listRecurringByCoach; filter expanded by request range; dedupe by (coachId, playerId, start). POST /api/recurring, GET /api/recurring?coachId=, DELETE /api/recurring/[id].
- **M4 — UI create recurring:** Coach schedule page: "שיעור חוזר" card with form (player, weekday, hour, end condition: after N or through month current/next). POST to /api/recurring; schedule refreshes via scheduleRefreshKey.
- **M5 — UI list/delete recurring:** Same card lists recurring series (player, day, hour, end desc) with "הסר" button; DELETE /api/recurring/[id]; list and schedule refresh.

## Quality Checks

- Unit tests passing: **Yes** (recurring.test.ts; run `npm test`).
- Lint clean: **Yes** (run `npm run lint`).

## Developer Declaration

- Implementation complete: **Yes**
