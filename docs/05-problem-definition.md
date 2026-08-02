# Part 3 Deliverable: Final Problem Definition (Phase 9)

**Status:** Locked for MVP Build
**Upstream:** `04-research-synthesis.md`, `01-problem-statement.md`

---

## 1. Final Problem Definition (P9-4)

> **Segment:** Segment A — High-frequency Blinkit users who have made the platform a weekly habit but transact exclusively within two or three familiar categories (mostly grocery and snacks).
>
> **Problem:** These users do not explore new categories because Blinkit gives them no way to *decide*. The app is engineered for known-intent restocking. The Product Detail Page (PDP) lacks reviews, Q&A, and comparison tools.
>
> **Root Cause:** *Evaluation cost.* A first-time purchase in a new category demands uncertainty-resolution that quick commerce has stripped out for speed.
>
> **User Workaround:** Users leave Blinkit, research the product on Amazon/Nykaa, and often just complete the purchase there.
>
> **Business Value:** Expanding category breadth is the cheapest revenue available (zero CAC) and improves basket economics (higher contribution margin on non-grocery items).

---

## 2. Implications for the Occasion Engine MVP (P9-6)

Based on the research reconciliation, the Occasion Engine MVP (Phase 10) must adhere strictly to these constraints:

1. **Reason-Led:** We cannot just suggest a product. The "Reason" is the core feature because it collapses evaluation cost.
2. **Speed is Sacred:** The 300ms hard ceiling (R8) is non-negotiable. Users in mission-mode will aggressively dismiss anything that delays their cart checkout.
3. **Trust Validation:** For sensitive categories (Personal Care, Baby Care), the reasons should ideally leverage safety or brand-trust angles (e.g., "Paraben-free", "Vet recommended").
4. **Denylist Enforcement:** We must strictly adhere to the `SENSITIVE_CATEGORIES_DENYLIST` to ensure we do not trigger anxiety or violate privacy boundaries in the cart.

We are now cleared to build the Data Layer (Phase 10) and the UI/LLM Inference Engine (Phases 11 and 12).
