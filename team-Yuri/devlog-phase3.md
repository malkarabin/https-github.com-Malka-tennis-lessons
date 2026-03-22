# Devlog — Phase 3: Payment integration (Morning)

## Phase 2 — Complete
See `devlog-phase2.md`, `manager-phase2.md`, `validation-phase2.md`.

## Phase 2.5 — LLM (before Phase 3 payments)
**Complete** — see `devlog-phase2-5.md`, `manager-phase2-5-llm.md`, `arch-phase2-5-llm.md`. Current app pointer: `PHASE.md` (`PHASE=2.5`).

---

## Phase 3 — Planned

- **Payment provider:** **Morning** (מורנינג), chosen after product/architect decision.
- **Scope:** One coach; payment **per lesson** (no subscription). Automatic confirmation via Morning callback/webhook; no manual "marked as paid" by the payer.
- **Deliverables:** Payment link creation, webhook/callback handling, payment status on lessons, UI to request payment and show "שולם" / "לא שולם".

See `arch-phase3.md` and `manager-phase3.md` for full plan and milestones.

### LLM (Phase 2.5)

- Documented in `devlog-phase2-5.md` (not an “add-on” to Phase 3 — it ships **before** Morning payment work).

## Status

- **Payment (Morning):** Not started — Ready for development.
- **LLM Q&A (Phase 2.5):** Implemented — configure `OPENAI_API_KEY` in `.env.local`.
