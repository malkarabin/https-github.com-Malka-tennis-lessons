# Validation — Phase 2: Recurring lessons

## Verification performed

- **Gate:** manager-phase2.md contains **STATUS: READY FOR VALIDATION** — validation executed.

- **Milestones (per devlog-phase2 & manager-phase2):**
  - **M1 — Recurring series model and storage:** RecurringSeries in `src/lib/types.ts`; `storage/data/recurring.json`; store: listRecurringByCoach, addRecurring, removeRecurringSeries; removePlayer cascades to recurring (filter by playerId). Verified in store.ts and types.
  - **M2 — Expansion logic:** `src/lib/recurring.ts` — expandSeries(series, range) for current/next month; afterN and throughMonth (current/next/"both"). Unit tests in `src/lib/__tests__/recurring.test.ts`.
  - **M3 — API and schedule data:** GET /api/lessons uses getMergedLessons (one-off + expanded, deduped). POST/GET/DELETE /api/recurring. Conflict check in POST /api/lessons and POST /api/recurring (from today forward for recurring); message: "שעת השיעור המבוקש כבר תפוסה ביום X בתאריך Y בשעה Z." (he-IL).
  - **M4 — UI create recurring:** Coach schedule: "שיעור חוזר" form (player, weekday, hour, end condition: after N / through month — נוכחי, הבא, נוכחי והבא). POST /api/recurring; schedule refresh.
  - **M5 — UI list/delete recurring:** List of series with "הסר"; DELETE /api/recurring/[id]; list and schedule refresh.
  - **Month view:** MonthSchedule component; week/month tabs; "היום" in week and month. Verified in coach/player schedule pages and components.

- **Acceptance criteria (manager-phase2):** Recurring create/list/delete; expansion for current+next month and "נוכחי והבא"; weekly schedule shows one-off + recurring; month view and navigation; player delete removes recurring; conflict validation with Hebrew message; unit tests and lint clean; designer-phase2 polish applied.

- **Unit tests:** 19 tests passed (calendar, store, recurring). `npm test` — PASS.

- **Lint:** ESLint (next lint) — no errors or warnings. `npm run lint` — PASS.

- **Integration:** GET /api/lessons returns merged lessons; POST /api/lessons and POST /api/recurring enforce conflict check; recurring expansion and merge in `src/lib/merged-lessons.ts` and used by both APIs.

## STATUS: VALIDATED
