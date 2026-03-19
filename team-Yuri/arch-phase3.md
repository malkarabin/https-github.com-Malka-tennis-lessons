# Architecture — Phase 3: Payment integration (Morning)

## Phase Goal
Integrate payments via **Morning** (מורנינג) so that the coach can receive payment per lesson. One coach model; payment per lesson (no subscription). The system creates a payment request/link for a lesson; when the player pays via Morning, the system receives confirmation (callback/webhook) and marks the lesson as paid automatically. No manual "marked as paid" by the payer.

---

## Architectural Decisions

1. **Payment provider: Morning**
   - Chosen after product/architect decision. Morning provides payment page / payment link and callback or webhook for successful payment notification.
   - All payment flows go through Morning; no alternative provider in this phase.

2. **Who receives money**
   - **Single coach**: The coach is the merchant. The app acts on behalf of that coach (one coach per deployment or per tenant). No marketplace; no splitting between platform and coach in Phase 3.

3. **Payment per lesson**
   - Each lesson (one-off or one instance of a recurring series) can have an associated payment. When the coach or system initiates "request payment" for a lesson, the player gets a link to pay via Morning. After successful payment, the system marks that lesson as paid (stored state).

4. **Automatic confirmation**
   - Reliance on **Morning callback or webhook** to confirm payment. No manual checkbox "I paid"; the lesson is marked paid only when the app receives a successful notification from Morning (with proper verification, e.g. signature or idempotency).

5. **Data model**
   - Extend lesson (or add a payment record) with: payment status (unpaid / pending / paid), optional Morning transaction id and timestamp. Persist in existing storage (e.g. lesson payload or separate `payments.json`) so that schedule and lists can show "שולם" / "לא שולם".

6. **UI**
   - Coach and/or player can trigger "שלם עבור שיעור זה" (or similar), which creates a payment link and opens it (or sends it). After return from Morning or after webhook, the schedule reflects "שולם". Optional: list of unpaid lessons, resend link.

---

## Constraints (Non-Negotiable)

- Payment provider is **Morning**; no other provider in Phase 3.
- **One coach** receives payments; payment per lesson, no subscription.
- Lesson is marked paid **only** after automatic confirmation from Morning (callback/webhook); no manual mark-by-payer.
- Existing flows (one-off lessons, recurring, schedule views) remain; payment is an additive feature.

---

## Technical Boundaries (Out of Scope for Phase 3)

- Multiple coaches / marketplace / split payments.
- Subscriptions or recurring charges via Morning.
- Refunds, invoicing, or payroll automation.
- Alternative payment providers (Stripe, Bit, etc.).
