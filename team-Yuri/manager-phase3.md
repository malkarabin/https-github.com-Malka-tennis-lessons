# Manager Plan — Phase 3: Payment integration (Morning)

## Phase Goal
Integrate **Morning** (מורנינג) so the coach can collect payment per lesson. One coach; pay per lesson; payment confirmation is **automatic** via Morning callback/webhook (no manual "I paid" checkbox). The system stores payment status and shows it in the schedule and in lists.

---

## Ordered Milestones

1. **M1 — Morning integration and payment link**
   - Obtain Morning API credentials (or payment-link capability) for the coach as merchant.
   - Implement server-side: create payment request/link for a given lesson (amount, description, reference: lesson id or similar). Redirect or return link to client so the player can pay on Morning’s page.

2. **M2 — Callback / webhook**
   - Implement endpoint (e.g. POST from Morning) that receives payment success notification. Verify request (signature/token if provided by Morning). Map notification to lesson (by reference/id), persist payment status (e.g. `paid`), store optional transaction id and timestamp. Idempotent handling for duplicate webhook calls.

3. **M3 — Payment status in data and API**
   - Extend data model: lesson (or linked payment record) has payment status: unpaid / pending / paid. Persist in storage. GET /api/lessons (and any lesson list) returns payment status. Optional: GET /api/lessons?paymentStatus=unpaid for "unpaid lessons" list.

4. **M4 — UI: request payment and show status**
   - From schedule or lesson list: action "שלם עבור שיעור זה" (or "בקש תשלום") that calls backend to create Morning payment link and opens it (or copies link) for the player. After payment, when user returns or page refreshes, show "שולם" for that lesson. Display payment status (e.g. badge or text) on lesson cells in week/month view and in recurring instance list where relevant.

5. **M5 — Documentation and configuration**
   - Document how to configure Morning (credentials, webhook URL). Environment variables or config for Morning API key / webhook secret. Devlog and optional docs for running with Morning (sandbox/production).

---

## Detailed planning for the development team

- **Morning docs:** Use Morning’s official docs for: creating payment link / payment page, webhook/callback format, and verification. Implement only what Morning supports (link + callback or webhook).
- **Security:** Validate webhook payload (signature/token). Do not trust client-only data to mark a lesson as paid; only server after Morning confirmation.
- **Idempotency:** If Morning sends the same success event twice, updating payment status should be idempotent (same result, no duplicate side effects).
- **Amount:** Define per-lesson amount (fixed or configurable per coach/lesson). If configurable, add field for "price" or "amount" on lesson or coach; otherwise use a single configured default for Phase 3.
- **Testing:** Unit tests for payment-status logic and idempotency; integration test with Morning sandbox if available. Lint clean.

---

## Acceptance / Gating Criteria

- [ ] Coach (or system) can create a Morning payment link for a lesson; player can pay on Morning and complete payment.
- [ ] On successful payment, Morning notifies the app (callback/webhook); app marks the lesson as paid and persists status.
- [ ] No manual "mark as paid" by the payer; payment status is set only after Morning confirmation.
- [ ] Schedule and lesson lists show payment status (e.g. שולם / לא שולם).
- [ ] One coach; payment per lesson. No subscription.
- [ ] Configuration (credentials, webhook URL) documented; optional env-based config.
- [ ] Unit tests and lint clean.

---

## Status

STATUS: READY FOR DEVELOPMENT  
Phase 2 is **complete** (approved). Phase 3 plan approved; payment provider: **Morning**.
