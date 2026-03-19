# Phase 2 — Recurring lessons

## What was built (Phase 2)

- **Recurring series:** A series is a template: coach, player, weekday (0–6 = Sun–Sat), hour, and end condition. Stored in `storage/data/recurring.json`.
- **End conditions:** (1) **After N occurrences** — up to N weekly instances within the current and next calendar month. (2) **Through month** — all instances in the **current** or **next** calendar month.
- **Expansion:** The app expands each series into concrete 1-hour lessons (same shape as one-off lessons) only for the **current and next calendar month**. Expansion runs when loading the schedule (GET /api/lessons); no separate month view.
- **Weekly schedule:** Shows both one-off lessons and recurring-derived instances in the same grid (player color, 1h). No month view.
- **Cascade:** Deleting a player removes their one-off lessons and all their recurring series; slots free up.
- **UI:** On the coach schedule page: "שיעור חוזר" — add (player, weekday, hour, end condition) and list of recurring series with delete. Schedule refreshes after add/delete.

## How to run (unchanged from Phase 1)

`npm install` → `npm run dev` → open http://localhost:3000. Sign in as coach, go to "מערכת שבועית", use "שיעור חוזר" to add recurring and see instances in the grid.

## Data (Phase 2 addition)

- `storage/data/recurring.json` — recurring series (coachId, playerId, weekday, hour, endConditionType, endConditionValue).

## Tests and lint

`npm test` | `npm run lint`

## Post-phase fixes (for Ben/Yuri sign-off)

- **שחקן שגוי בשיעור חוזר:** טופס "שיעור חוזר" קורא את השחקן הנבחר ישירות מה-select (ref) בזמן שליחת הטופס, כדי למנוע שמירה לשחקן אחר ממצב ישן.
- **חודש נוכחי והבא:** נוספה אפשרות "עד סוף חודש → נוכחי והבא" (endConditionValue: "both") — ההרחבה מייצרת מופעים גם בחודש הנוכחי וגם בבא, ומופיעים במבט השבועי ובמבט החודשי. ברירת המחדל ל"עד סוף חודש" היא כעת "נוכחי והבא".
- **קונפליקטים:** בעת הוספת שיעור בודד או שיעור חוזר — אם התא תפוס על ידי שחקן אחר, נעצר ומציג הודעה: "שעת השיעור המבוקש כבר תפוסה ביום X בתאריך Y בשעה Z."
- **שיעור חוזר — רק קדימה:** בדיקת קונפליקט לשיעור חוזר מתבצעת רק על מופעים **מההיום ואילך** (לא על מופעים בעבר). כך ניתן לשריין שיעור חוזר גם אם באותו יום+שעה היה תפוס בשבוע שעבר.
