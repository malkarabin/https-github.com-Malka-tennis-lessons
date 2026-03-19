# Manager Plan — Phase 2: Recurring lessons

## Phase Goal
Implement recurring lessons (same weekday + hour every calendar week) with an end condition (after N occurrences or through end of calendar month). Expand series into concrete lesson instances for the current and next calendar month only. Weekly schedule view shows both one-off and recurring-derived instances in the same grid. On player delete, remove that player’s recurring series (and any expanded instances). No payment; no month view.

---

## Ordered Milestones

1. **M1 — Recurring series model and storage**
   - Define type: RecurringSeries (id, coachId, playerId, weekday 0–6, hour, endConditionType: "afterN" | "throughMonth", endConditionValue: number or month key).
   - Persist in storage (e.g. `storage/data/recurring.json`). API: list by coachId; add; delete. On player delete (existing flow), also delete all recurring series for that playerId.

2. **M2 — Expansion logic**
   - Function: given a recurring series and the current/next calendar month bounds, generate concrete lesson instances (same shape as Lesson: coachId, playerId, start ISO, durationMinutes 60). End condition: "afterN" → stop after N instances; "throughMonth" → all instances whose date falls in that month (current or next). Instances only inside current + next calendar month.
   - Unit tests for expansion (e.g. 4 occurrences, through end of month, boundary checks).

3. **M3 — API and schedule data**
   - When returning lessons for the weekly view (GET /api/lessons by coachId + date range): merge one-off lessons from storage with expanded instances from all recurring series for that coach (within the requested range). Deduplicate by (coachId, playerId, start). Optionally: separate endpoint for “recurring series” CRUD; schedule endpoint uses expansion on read.

4. **M4 — UI: create recurring lesson**
   - From coach schedule (or dedicated section): “Add recurring” flow. Inputs: player (from coach’s list), weekday (Sun–Sat), hour, end condition (after N occurrences / through end of current or next month). POST to create series. Show success; schedule view refreshes and shows the new instances.

5. **M5 — UI: list/delete recurring series**
   - Coaches can see a list of their recurring series (e.g. “Player X, Wed 10:00, 4 times”) and delete one. Deleting a series removes it from storage; expansion no longer produces those instances. Weekly view updates accordingly.

---

## Detailed planning for the development team

- **Data:** Recurring series in `recurring.json` (or equivalent). Expansion is deterministic from series + month bounds; can be computed on each schedule load or cached and invalidated when series or window changes.
- **Cascade:** In `removePlayer(id)` (store + API): after removing one-off lessons for that player, also remove all recurring series where `playerId === id`.
- **Conflict:** No need to prevent “double booking” in Phase 2 (one-off and recurring can overlap; if required later, validate when creating one-off or series). Clarify with product if overlapping same slot is allowed.
- **UI:** Reuse existing weekly schedule component; ensure it receives merged lessons (one-off + expanded). Add “Add recurring” entry point and a simple list of recurring series with delete. No new routes required for schedule view; optional `/coach/recurring` or inline modal/section.
- **Testing:** Unit tests for expansion (weekday/hour, end conditions, month boundaries). Lint clean.

---

## Acceptance / Gating Criteria

- [x] Recurring series can be created (coach, player, weekday, hour, end condition: after N or through month, including "נוכחי והבא").
- [x] Series are persisted; expansion produces instances for current and next calendar month (and request-range extension for week view).
- [x] Weekly schedule view shows both one-off lessons and recurring-derived instances (same grid, player color, 1h).
- [x] Month view added (view + navigate current/next month); "היום" button in week and month views.
- [x] Deleting a player removes their recurring series and frees slots (no orphan instances).
- [x] Coaches can list and delete recurring series; schedule updates after delete.
- [x] Conflict validation: booking blocked when slot taken by another player; message "שעת השיעור המבוקש כבר תפוסה ביום X בתאריך Y בשעה Z." Recurring conflict check from today forward only.
- [x] No payment. One-off lessons work as in Phase 1.
- [x] Unit tests for expansion; lint clean.
- [x] docs/doc-phase2.md updated. designer-phase2.md and UI polish (Roni) implemented.

---

## Post-validation refinements (approved)

- **Design (Roni):** Rounded corners for schedule slots (10px) and month lesson items (8px); more transparent slot colors (rgba for lesson cells and add-button); border-spacing so rounded corners are visible.
- **Developer (Sarah):** Recurring expansion now starts from **today** — no instances before current date (afterN and throughMonth both exclude past dates). Aligns with product expectation.

---

## Status
STATUS: READY FOR VALIDATION  
→ Validated (Gili). Post-validation refinements implemented and **approved by Manager**.  
**STATUS: APPROVED — Phase 2 complete.**
