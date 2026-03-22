# Architecture — Phase 2.5: Student → coach Q&A (LLM)

**Runs after Phase 2 and before Phase 3 (payments).**

## Goal
Allow **players** (students) to ask questions and receive answers via an **LLM assistant** that speaks on behalf of their coach — tennis training, scheduling context, general guidance. **Not** a replacement for the coach on medical, legal, or invoicing matters (disclaimer in UI + system prompt).

## Decisions

1. **Who can use it**  
   Only a signed-in **player**; server validates `playerId` belongs to `coachId` via `getPlayer` / store.

2. **Provider**  
   OpenAI-compatible Chat Completions API (`OPENAI_API_KEY`, optional `OPENAI_MODEL`, `OPENAI_BASE_URL`). Secrets only in `.env.local`.

3. **Endpoints**  
   - `POST /api/player/ask` — body: `{ coachId, playerId, message, history? }`. Returns `{ reply }` or error.

4. **UI**  
   - Route: `/player/ask` — RTL chat bubbles; links in player nav (home + schedule).

5. **Out of scope**  
   - Persisting chat history server-side.  
   - Coach inbox for conversations (future).  

See `docs/env-llm.md` for environment variables.
