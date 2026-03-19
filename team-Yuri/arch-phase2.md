# Architecture — Phase 2: Recurring lessons

## Phase Goal
Support recurring lessons (same slot every calendar week) and expand them into concrete lesson instances within the current and next calendar month. The existing weekly view shows both one-off lessons and instances derived from recurring series. No payment in this phase.

---

## Architectural Decisions

1. **Recurring series vs instances**
   - A **recurring series** is a template: coach, player, weekday (0–6), hour, and an **end condition** (e.g. “after N occurrences” or “through end of calendar month”).
   - The system **expands** each series into **concrete lesson instances** (same shape as Phase 1 lessons) only for the **current and next calendar month**. No persistence of instances beyond that; expansion is computed when needed (e.g. when loading the schedule or via a precomputed cache per series).

2. **Pattern**
   - Only **weekly** recurrence: same weekday and hour every calendar week (Sunday–Saturday). No “every 2 weeks” or custom patterns in Phase 2.

3. **End condition**
   - One of: (a) **after N occurrences** (e.g. 4), or (b) **through end of month** (current or next calendar month). No open-ended “forever” in Phase 2.

4. **Storage**
   - Persist **recurring series** (e.g. in `recurring.json` or a dedicated structure). Store: coachId, playerId, weekday, hour, endConditionType, endConditionValue (e.g. N or month identifier). Optionally persist expanded instances for the active window for performance; if so, they must be regenerated when a series is added/updated/deleted or when the window (current/next month) rolls.

5. **Deletion**
   - When a **player** is deleted: remove all recurring series for that player and any expanded instances (or ensure expansion excludes them). When a **recurring series** is deleted: remove only that series and its instances within the window.

6. **UI**
   - Coaches (and optionally players) can **create a recurring lesson**: choose player, weekday, hour, end condition. Existing weekly schedule view (calendar week Sun–Sat) shows both one-off lessons and expanded recurring instances in the same grid (same player color, same 1h slot). No separate “month view”; week view only.

---

## Constraints (Non-Negotiable)

- Recurrence pattern is **weekly only** (same weekday + hour every week).
- Expansion window is **current calendar month + next calendar month**; no instances outside that.
- Weekly view remains the only schedule view; no new “month view” in Phase 2.
- One-off lessons (Phase 1) continue to work; recurring and one-off coexist in the same grid.
- Each instance is 1 hour; player color and naming rules unchanged.

---

## Technical Boundaries (Out of Scope for Phase 2)

- Payment (Stripe or any other).
- Recurrence patterns other than weekly (e.g. biweekly, custom).
- Month view or calendar-month grid UI.
- Recurring series beyond the defined end conditions (e.g. “no end” or “end on specific date” other than month end).
