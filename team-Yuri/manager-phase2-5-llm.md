# Manager Plan — Phase 2.5: LLM (שאלה למאמן)

## Phase Goal
Between **Phase 2** (complete) and **Phase 3** (Morning payments), deliver a **student → “coach assistant”** chat powered by an LLM, so players can ask questions in Hebrew with clear disclaimers.

## Milestones

1. **M1 — API**  
   - `POST /api/player/ask` with server validation (player ∈ coach).  
   - OpenAI-compatible `chat/completions`; Hebrew system prompt with coach name + disclaimers.

2. **M2 — UI**  
   - `/player/ask` for players only; chat bubbles; nav links from home + player schedule.

3. **M3 — Config & docs**  
   - `docs/env-llm.md`, `.env.example`, no secrets in Git.

## Acceptance

- [x] Player cannot call API with mismatched coach/player (403).  
- [x] Missing `OPENAI_API_KEY` returns clear 503 message.  
- [x] Successful flow returns Hebrew assistant reply.  
- [x] Phase pointer and devlog updated (`PHASE.md`, `devlog-phase2-5.md`).

## Status

**APPROVED — Phase 2.5 implemented.**  
Next: **Phase 3** — Morning payments (`manager-phase3.md`).
