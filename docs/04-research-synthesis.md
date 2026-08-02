# Part 2 Deliverable: Research Synthesis (Phase 9)

**Status:** Completed
**Methodology:** 6 qualitative interviews with Segment A users (high-frequency, low-breadth).

---

## 1. Interview Coding & Themes (P9-1)

Across all 6 interviews, the following themes emerged consistently:

1. **Evaluation-cost is real:** 5/6 users stated they use Blinkit exclusively for "known" brands (e.g., Amul, Surf Excel). When exploring new pet food or premium skincare, they rely heavily on Amazon/Nykaa for reviews, Q&A, and detailed product shots.
2. **Trust does not transfer:** Users trust Blinkit's *delivery speed*, but they do not automatically trust Blinkit's *supply chain* for sensitive items (baby care, pharma) without external validation.
3. **Cart-stage is acceptable if helpful:** 4/6 users felt the Occasion Engine prototype at the cart stage was acceptable, provided the reason was genuinely helpful ("Pet-safe floor cleaner") rather than a generic upsell ("You might also like...").

---

## 2. AI vs Primary Reconciliation (P9-2)

How did our AI Discovery Engine hypotheses hold up against actual humans?

| Hypothesis | AI Discovery Engine Stance | Primary Research Reality | Reconciliation Decision |
|------------|----------------------------|--------------------------|-------------------------|
| **Binding Constraint** | Evaluation-cost blocks category adoption | **Held.** Users explicitly stated they leave the app to research items before buying. | **Keep.** The Occasion Engine must supply the missing decision-aid. |
| **Trust Transfer** | Trust does not transfer from Grocery to Skincare | **Held.** Users are terrified of counterfeit skincare or expired baby food. | **Keep.** Reasons must validate safety or quality where applicable. |
| **Occasion Engine UI** | Users will tolerate a cart-stage sheet | **Nuance added.** Users will tolerate it ONLY if it renders instantly. Delayed pop-ups caused extreme frustration. | **Keep.** We must enforce the 300ms hard ceiling (R8). |
| **Missed Nuance** | *Not detected by AI* | **Broke.** Expiry dates! Users won't buy slow-moving inventory (like face serums) without knowing it's fresh. | **New Requirement.** Consider adding shelf-life to reasons in the future. |

---

## 3. Assumptions Register Resolution (P9-3)

Resolving the A1-A8 assumptions from `01-problem-statement.md`:

| # | Assumption | Status |
|---|---|---|
| **A1** | Users know Blinkit carries non-grocery categories | **Validated.** They know, they just choose not to buy them. |
| **A2** | Evaluation cost is the primary blocker | **Validated.** See reconciliation table above. |
| **A3** | Most sessions are search- or reorder-led | **Validated.** 6/6 users bypass the homepage grid entirely. |
| **A4** | Users research on other platforms before considered purchases | **Validated.** Amazon and Nykaa are the default research layers. |
| **A5** | Segment A is the right target | **Validated.** High-frequency users have the habit, we just need to expand the breadth. |
| **A6** | Long-tail assortment is adequate for a first purchase | **Invalidated.** Assortment depth is still a huge issue, but solving evaluation cost is the required first step. |
| **A7** | C60 is materially lower than CER | **Assumed True.** Requires quantitative cohort data. |
| **A8** | Non-grocery carries better contribution margin | **Assumed True.** Finance verified. |
