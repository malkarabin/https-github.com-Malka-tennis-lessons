# Devlog — Phase 2.5: LLM — שאלה למאמן

## Implemented

- **API:** `POST /api/player/ask` — `src/app/api/player/ask/route.ts`  
  Validates `playerId` ↔ `coachId`; calls OpenAI-compatible Chat Completions (`OPENAI_MODEL` default `gpt-4o-mini`).
- **UI:** `src/app/player/ask/page.tsx` — chat UI (RTL).  
- **Nav:** Player links «שאלה למאמן» from `src/app/page.tsx` and `src/app/player/schedule/page.tsx`.
- **Styles:** `.player-chat-*` in `src/app/globals.css`.
- **Docs:** `docs/env-llm.md`, `team-Yuri/arch-phase2-5-llm.md`, `manager-phase2-5-llm.md`.

## Configuration (local)

1. Create `.env.local` in project root (not committed):
   ```env
   OPENAI_API_KEY=sk-...
   ```
2. Restart `npm run dev` after adding the key.

## Quality

- Run `npm run lint` before commit.

## Status

**Complete** — awaiting production env var on deploy. Next phase: **Phase 3** (Morning) — see `devlog-phase3.md`.
