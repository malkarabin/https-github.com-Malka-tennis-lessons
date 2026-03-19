# Phase 1 — What was built and how to run it

## What was built (Phase 1)

- **Multi-coach model:** Multiple coaches; each has a distinct list of players and a distinct schedule. Data: Coach, Player (linked to exactly one coach, optional color), Lesson (coach, player, start datetime, **duration always 1 hour**). Persistence: JSON files in **storage/data/** (coaches.json, players.json, lessons.json).
- **Player belongs to one coach; no coach selection for players:** On sign-in, player selects their name; the app shows their coach and "My coach's schedule." No coach picker for players.
- **Each lesson is exactly 1 hour** — no duration selection.
- **Weekly schedule:** Calendar week **Sunday–Saturday**. When a player schedules a lesson, **the slot is shown in that player's color** in the calendar. Coach: /coach/schedule (add lessons). Player: /player/schedule (read-only). Navigation limited to current and next calendar month.
- **On player deletion:** All lessons booked by that player are removed so their slots become free again (no orphaned gray slots).
- **One-off lessons only;** no payment.

## How to run with storage (DB = JSON files)

The app uses **file-based storage** in **storage/data/** — no external database. Three JSON files are created automatically.

1. **Prerequisites:** Node.js 18+ and npm (https://nodejs.org).
2. **Open a terminal in the project folder** (e.g. in Cursor: Terminal → New Terminal).
3. **Install dependencies (once):**  
   `npm install`
4. **Start the server:**  
   `npm run dev`
5. **Open in browser:** When you see `Ready on http://localhost:3000`, open **http://localhost:3000**.
6. **First run:** The app seeds two coaches and three players if the store is empty. Sign in as coach or player; add lessons — they are saved in **storage/data/lessons.json**. Booked slots appear **in the player's color** in the calendar.

**Where is the data?**  
- `storage/data/coaches.json` — coaches  
- `storage/data/players.json` — players (each has a color)  
- `storage/data/lessons.json` — lessons (each 1 hour)

Deleting these files or the folder resets data; the app will seed again if empty.

**Tests and lint:** `npm test` | `npm run lint`

## Project layout (Phase 1)

- `src/app/` — Next.js App Router: page (home/sign-in), /coach (dashboard), /coach/schedule, /player/schedule.
- `src/components/` — WeeklySchedule (calendar week Sun–Sat, lessons in player color, add-lesson for coach, 1h only).
- `src/lib/` — types.ts, calendar.ts (week/month helpers), store.ts (persistence). `src/lib/__tests__/` — unit tests.
