# Design Integration — Stitch → Occasion Engine

**Status:** v1 — decisions locked
**Upstream:** `stitch_blinkit_ai_category_discovery/` · [`docs/06-mvp-concept.md`](06-mvp-concept.md) · [`docs/07-demo-journey.md`](07-demo-journey.md) · [`edge.md`](../edge.md)
**Purpose:** Record exactly what is adopted from the Stitch designs, what is rejected, and why — so the decision is traceable rather than re-litigated.

---

## 1. The decision in one line

> **Adopt Stitch's visual system wholesale. Replace its information architecture with the Occasion Engine's.**

Stitch got the *expression* right — `Why this?`, `GOES WELL WITH KIBBLE`, `AI Recommended`, the card treatment — and the *targeting* wrong. The visual layer ships as-is. The logic layer comes from the spec.

**Layout: desktop, 1280px**, per the Stitch design system. This is a deliberate departure from the mobile wireframes originally drafted in `docs/07-demo-journey.md`, which are superseded by §4 below.

---

## 2. Adopted — ships as designed

| Element | Source | Notes |
| --- | --- | --- |
| **Colour tokens** | `DESIGN.md` | Primary `#755b00` / container `#f8cb46` (Blinkit yellow); action green `#006e16` / `#0C831F`; surface `#fcf9f8` |
| **Typography** | `DESIGN.md` | Inter throughout. `headline-sm` for occasion, `body-sm` for reason, `label-md` for chips |
| **Spacing + radius** | `DESIGN.md` | 4px base; `lg` 24px card padding; `rounded-lg` 16px cards, 8px buttons, pill chips |
| **Elevation** | `DESIGN.md` | L1 `0 4px 12px rgba(0,0,0,.05)`, L2 hover `0 8px 24px rgba(0,0,0,.08)` |
| **Product card** | Both screens | White, 16px radius, 1:1 image, price `body-lg` bold, green ADD bottom-right |
| **`Why this?` link** | Discovery Hub | **The single best thing in the designs.** It is the evaluation-cost fix, already drawn |
| **Occasion chips** | Feed | `GOES WELL WITH KIBBLE`, `PERFECT PAIR`, `COMPLETE THE CARE` — occasion framing, exactly right |
| **`AI Recommended` badge** | Hub | Honest labelling of machine-generated content. Keep |
| **Discovery Nudge component** | `DESIGN.md` | Soft yellow gradient border + sparkle. **This becomes the rail container** |
| **320px discovery rail** | `DESIGN.md` layout spec | Already specified: *"AI discovery sidebars or nudges should occupy a fixed 320px width on large screens"* |

---

## 3. Rejected — with reasons

| Rejected | Where it appears | Why |
| --- | --- | --- |
| **Same-L1 suggestions** | *"Because you bought Pedigree Adult Kibble"* → dental chews, waterer, maze bowl, grooming brush | **All four are Pet Care.** Violates **INV-2 / R1**. Contributes **zero** to CER. This is the one genuine defect — everything else is taste; this makes the feature unable to move its own metric |
| **"Discoveries" nav tab** | Feed sidebar | The Discover tab ruled out in `docs/01-problem-statement.md` §7. Ambient surface; mission-mode users never open it |
| **Progress gamification** | *"3 of 8 explored"*, *"22% Explored"*, order-success badge | §7 — extrinsic motivation layered over an unresolved evaluation problem. Moves briefly, decays fast |
| **Discount framing** | *"Discovery Savings"*, *"₹999 ~~₹1,450~~ Claim Bundle"* | **R7.** Coupon-led trial moves CER and fails C60. We want the category, not the transaction |
| **"Try Beauty / Try Baby Care"** | Quick Discovery | §3.3 — supply-centric taxonomy. Nobody thinks *"I need Personal Care"* |
| **Star ratings (4.8, 4.6, 4.9)** | Feed cards | Blinkit PDPs have no ratings — that absence **is** the problem statement's §3.5 argument. Showing them undercuts our own diagnosis and invents a review corpus that doesn't exist |
| **"Ask Blinkit" chat panel** | Feed right rail | A different feature. Also a text-entry surface, which §3.4 says excludes the first-time buyer who cannot name what they need |

> **On the rejections.** Five of these are defensible product choices Stitch made without the spec. Only the first is a defect. It is worth being precise about that distinction rather than dismissing the work.

---

## 4. Desktop layout **[LOCKED]**

The bottom sheet becomes a **persistent 320px right rail**. On desktop this is *strictly better* for the non-blocking requirement — a side rail sits beside the content and cannot overlay the cart button or interrupt the tap path.

```
┌────────────────────────────────────────────────┬──────────────────────┐
│  Blinkit Discover        [ search ]     🛒 👤  │                      │
├────────────────────────────────────────────────┤   DISCOVERY RAIL     │
│  ⚠ DEMO DATA — synthetic catalogue             │   320px, sticky      │
│                                                │                      │
│  ORDER AGAIN                                   │  ✓ Atta 5kg added    │
│  [Atta] [Milk] [Bread] [Eggs]                  │  ──────────────────  │
│                                                │                      │
│  STAPLES & ATTA                                │  Goes with a         │
│  ┌────────┐ ┌────────┐ ┌────────┐              │  monsoon staples run │
│  │ Atta   │ │ Rice   │ │ Dal    │              │                      │
│  │ ₹285   │ │ ₹420   │ │ ₹180   │              │  ┌────────────────┐  │
│  │ [ADD]  │ │ [ADD]  │ │ [ADD]  │              │  │ 🫙 Airtight    │  │
│  └────────┘ └────────┘ └────────┘              │  │    Jar 5L      │  │
│                                                │  │ Damp monsoon   │  │
│  ┌────────┐ ┌────────┐ ┌────────┐              │  │ air gets into  │  │
│  │        │ │        │ │        │              │  │ open atta      │  │
│  └────────┘ └────────┘ └────────┘              │  │ ₹249    [ADD]  │  │
│                                                │  └────────────────┘  │
│                                                │  ┌────────────────┐  │
│                                                │  │ 🐛 Pest Strips │  │
│                                                │  │ Weevils breed  │  │
│                                                │  │ in stored flour│  │
│                                                │  │ ₹120    [ADD]  │  │
│                                                │  └────────────────┘  │
│                                                │                      │
│                                                │  ⌄ more for this     │
└────────────────────────────────────────────────┴──────────────────────┘
```

### Rail behaviour

| Rule | Detail |
| --- | --- |
| **Idle state** | Rail shows the persona panel (`docs/07-demo-journey.md` §2) — always occupied, so nothing jumps when a suggestion arrives |
| **On add** | Content swaps in place. **No layout shift** in the main column |
| **Non-blocking** | Rail never overlays main content, never captures focus, never obscures the cart |
| **Dismissal** | Reverts to persona panel after timeout, or on the next unrelated action |
| **Empty / blocked** | Reverts to persona panel silently. Per `edge.md` §5, the user never learns anything failed |
| **Narrow viewport** | Collapses to a top-scrollable tray, per `DESIGN.md` |

> **Why the rail is always occupied.** If it were empty by default, a suggestion appearing would shift layout and pull the eye — an interruption. A rail that always holds *something* means the feature arrives quietly. This is what preserves INV-6 on desktop.

---

## 5. Component mapping

| Spec element | Stitch component | Change required |
| --- | --- | --- |
| Occasion headline | `headline-sm` + occasion chip | Copy must describe the **basket, not the person** (EC-S10) |
| Suggestion card | Product card | **Reason line promoted** — `body-sm`, full contrast, never de-emphasised (EC-A9) |
| Reason | `Why this?` + chip | **Always visible, not behind a click.** The reason *is* the mechanic |
| One-tap add | Green ADD | Unchanged (INV-5) |
| Rail container | Discovery Nudge | Sparkle + yellow gradient border. Unchanged |
| Expansion | Discovery Hub | **Repurposed** — becomes the opt-in destination for `⌄ more for this`, not a nav tab |
| Demo-data label | *(none)* | **New** — required by EC-P5 |
| Persona panel | *(none)* | **New** — rail idle state |
| Trigger log | *(none)* | **New** — makes DF-C's silence legible (P13-14) |

---

## 6. The Discovery Hub, repurposed

Stitch's Pet Care Discovery Hub is a good screen in the wrong place. As a **nav tab** it is the ambient surface §7 rules out. As the **destination of `⌄ more for this`** it is exactly right: reached only after a committed action, only when the user asks, costing nothing to everyone who doesn't.

Changes when repurposed:

- Remove the `3 of 8 explored` progress meter — gamification
- Remove `Discovery Savings` and the discounted bundle — R7
- Keep `Why this?`, the trust panel (*Genuine Brands / Vet-Approved / Freshness*), and the card grid
- **All items must be cross-L1** relative to the anchor
- Entered from the rail, never from navigation

---

## 7. Consequences for other documents

| Document | Change |
| --- | --- |
| `docs/06-mvp-concept.md` §3.2–3.3 | Bottom sheet → 320px right rail; desktop anatomy |
| `docs/07-demo-journey.md` §3, §7, §9 | Mobile wireframes superseded by §4 here |
| `implementation-plan.md` Phase 12 | Rail tasks replace sheet tasks; design-token task added |
| `architecture.md` §2 | Tailwind config now derives from `DESIGN.md` tokens |

---

> **The one non-negotiable carried out of this review:** every suggestion must be from a **different L1** than the anchor. Stitch's flagship row suggested four Pet Care items off a Pet Care purchase. It looks excellent and would move CER by exactly zero. INV-2 exists to make that failure impossible.
