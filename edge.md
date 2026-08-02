# Edge Cases — Occasion Engine & Discovery Engine

**Status:** v1
**Upstream:** [`context.md`](context.md) · [`architecture.md`](architecture.md) · [`docs/06-mvp-concept.md`](docs/06-mvp-concept.md)
**Purpose:** Enumerate failure modes *before* building, so behaviour is designed rather than discovered in production.

---

## How to read this

**Severity**

| | Meaning |
|---|---|
| **S1** | Causes user harm, offence, or a trust breach. **Must be handled before any demo.** |
| **S2** | Feature visibly broken or wrong. Must be handled before launch. |
| **S3** | Degraded experience. Handle if time permits. |
| **S4** | Polish. |

**The default safe behaviour for this feature is to render nothing.** The Occasion Engine is an enhancement on a working cart flow — a silent no-op is always acceptable and never an error state. When in doubt, show nothing.

**IDs are stable** and should be referenced directly in test names (`test_EC_S3_pregnancy_test_no_adjacency`).

---

## 1. Sensitive categories — **S1, read this first**

This is the section most likely to be skipped and the only one that can cause real harm. A cross-category suggestion engine infers things about people's lives from what they buy. Sometimes those inferences are correct and unwelcome. Sometimes they are wrong and devastating.

**Governing rule:** the engine reasons about *products*, never about the user's circumstances. "This cleaner is pet-safe" is a product fact. "Congratulations on the new baby!" is an inference about a person, and we do not make those.

| ID | Scenario | Risk | Required behaviour |
|---|---|---|---|
| **EC-S1** | User adds a **pregnancy test** | Suggesting baby products presumes a pregnancy, a wanted one, and a continuing one. Any of the three can be wrong. This is the single worst failure this feature can produce. | **Hard block.** Pregnancy/fertility products have **no adjacencies whatsoever.** Not "careful" ones. None. |
| **EC-S2** | User adds **contraceptives or intimate products** | Any suggestion signals surveillance of private behaviour. Shared devices and family accounts make this worse. | **Hard block.** No adjacencies, no history retention for suggestion purposes. |
| **EC-S3** | User adds **medicine / pharma** | Suggesting a medicine based on inferred illness is unlicensed medical advice. Drug interactions can be dangerous. | **Never suggest any pharma SKU as an adjacency.** Pharma may be an *anchor* (e.g. paracetamol → electrolyte, tissues) but never a *suggestion*. Non-medical adjacencies only, no diagnostic framing. |
| **EC-S4** | User previously bought **baby products, then stopped abruptly** | Pregnancy loss, infant loss, or a child who outgrew the stage. Continuing to surface baby adjacencies is cruel in the first case. | Baby-category adjacencies **decay after 60 days of no purchase in that category** and do not resume automatically. |
| **EC-S5** | User previously bought **pet products, then stopped** | Bereavement. | Same decay rule as EC-S4. |
| **EC-S6** | Suggestion violates a **dietary or religious constraint** — beef products in India, non-veg to a vegetarian buyer, non-halal, non-Jain | Deep cultural offence; potentially unrecoverable brand damage. | Catalogue carries dietary flags. **Never suggest non-veg as an adjacency to a purely vegetarian basket.** When the signal is ambiguous, default to the more restrictive assumption. |
| **EC-S7** | **Weight-loss / diet / body-composition** products suggested from a food purchase | Implies a judgement about the user's body from what they eat. | **Hard block.** These categories are never adjacencies to food. |
| **EC-S8** | Suggestion conflicts with a **known allergy** | Physical harm. | If allergy data exists, filter. If it does not, never make adjacency claims that assume tolerance (e.g. "great with peanuts"). |
| **EC-S9** | **Shared or family account** — one person's purchase drives suggestions another person sees | Discloses private purchases to household members. | Never surface adjacencies that reveal the *anchor* purchase in a later session. The sheet is in-session only and leaves no persistent trace. |
| **EC-S10** | Occasion headline makes an **assumption about the user's life** — "New baby?", "Feeling unwell?", "Party tonight?" | Presumptuous when wrong; invasive when right. | Headlines describe the **basket**, not the person. ✅ "Goes with dog food" / ❌ "New puppy?" Every headline is reviewed against this test. |
| **EC-S11** | Bereavement, illness, or crisis-adjacent baskets | Cheerful framing lands badly. | Neutral tone in all copy. No exclamation marks, no celebratory language anywhere in the feature. |

> **Implementation note.** EC-S1, S2, S3 and S7 are implemented as a **denylist checked before any model call**, not as a filter on model output and never as a prompt instruction. If a category is on the list, no request is made at all. A prompt can be circumvented; a code path cannot.

---

## 2. Trigger and session

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-T1** | S2 | User adds an item, then removes it while the sheet is open | Sheet dismisses immediately. Suggestions tied to a removed anchor are stale. |
| **EC-T2** | S3 | User increments quantity of an item already in cart | **Do not re-fire.** Quantity change is not a new intent. |
| **EC-T3** | S2 | User rapidly adds several items in succession | Debounce ~800ms. Fire once, on the settled cart state. Never stack sheets. |
| **EC-T4** | S2 | User adds an item **from the suggestion sheet itself** | **Never fire recursively.** A sheet cannot spawn a sheet. Hard guard, not a heuristic. |
| **EC-T5** | S2 | User taps "Order Again" and adds 15 items at once | Treat as one event. Infer occasion from the *combination*, or suppress entirely — a reorder is the definition of habitual intent and the weakest moment to interrupt. |
| **EC-T6** | S3 | User adds an item while already on the checkout screen | **Suppress.** Never interrupt a checkout in progress. |
| **EC-T7** | S3 | Sheet fires on the very first item of a brand-new user's first order | Suppress until at least one completed order exists. No purchase history means no basis for adjacency and no way to apply R3. |
| **EC-T8** | S4 | User adds item while the previous sheet is still animating in | Cancel the in-flight animation, replace cleanly. No visual stacking. |
| **EC-T9** | S3 | User has dismissed the sheet 3+ times in a session | Stop firing for the remainder of the session. Repeated dismissal is a signal, and ignoring it turns the feature into an ad. |
| **EC-T10** | S3 | Sheet resolves *after* the user has navigated away | Discard silently. Never render into a context the user has left. |

---

## 3. Empty and no-result states

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-E1** | S2 | No occasion matches the anchor SKU | Render nothing. Silent no-op. |
| **EC-E2** | S2 | All candidates eliminated by hard rules R1–R4 | Render nothing. **Never relax a rule to fill the slot.** |
| **EC-E3** | S3 | Only one candidate survives (spec allows up to 2) | Render one. Do not pad with a weaker suggestion. |
| **EC-E4** | S3 | **Power user** who has already purchased every adjacent L1 | Nothing to suggest — correct outcome, since R3 means they cannot contribute to CER here. Render nothing. |
| **EC-E5** | S2 | Every candidate suggestion is out of stock | Render nothing. Loop D: a disappointing exploration is worse than no exploration. |
| **EC-E6** | S3 | Anchor is an uncategorised or newly-added SKU absent from the occasion map | Render nothing. Log the miss for the next precompute run. |

---

## 4. Data and catalogue integrity

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-D1** | S2 | Occasion map references a SKU that has been delisted | Validate every suggested `sku_id` against the live catalogue at render time. Drop unresolvable IDs. |
| **EC-D2** | S2 | Occasion map and catalogue versions are mismatched | Both artifacts carry a version hash. On mismatch, **disable the feature entirely** rather than serve stale adjacencies. |
| **EC-D3** | S3 | Price changed between precompute and render | Always read price live. Never render a cached price. |
| **EC-D4** | S3 | Suggested item costs far more than the anchor (₹99 dog treat → ₹2,400 item) | Cap suggestion price at a multiple of anchor price. A jarring price gap reads as an upsell and destroys the "helpful" framing. |
| **EC-D5** | S2 | Purchase history unavailable (logged out, new device, cache miss) | R3 cannot be applied. **Suppress the feature** rather than risk suggesting a category the user already buys — which would be both useless and slightly insulting. |
| **EC-D6** | S3 | Purchase history is stale | Treat as EC-D5 beyond a staleness threshold. |
| **EC-D7** | S2 | Suggested SKU is not deliverable to the user's pincode / dark store | Filter against the serving store's assortment, not the global catalogue. |
| **EC-D8** | S3 | Seasonal occasion fires off-season (Holi suggestion in August) | Occasions carry validity windows. Time-gate at render. |
| **EC-D9** | S3 | Regionally inappropriate occasion (monsoon framing in a city not in monsoon) | Region-gate seasonal occasions, or drop regional framing entirely for v1. |

---

## 5. Latency and failure

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-L1** | S2 | Live inference exceeds the 300ms budget (R8) | Abandon the live path, fall back to precomputed map. If that misses, render nothing. **Never show a loading skeleton** — on a non-blocking sheet it reads as broken. |
| **EC-L2** | S2 | Primary inference provider times out or rate-limits | Fall back per `architecture.md` §6.4. Silent to the user. |
| **EC-L3** | S2 | All inference unavailable | Precomputed map only. Feature still works — this is why the hybrid architecture exists. |
| **EC-L4** | S2 | Precomputed map fails to load | Render nothing. Feature disabled, cart flow unaffected. |
| **EC-L5** | S3 | Serverless cold start blows the latency budget | Precomputed path must be served without a function invocation where possible. |
| **EC-L6** | S3 | Network drops mid-request | Fail silent. No error toast — the user did not ask for this surface and should not be told it failed. |
| **EC-L7** | S3 | Very slow connection (2G/3G) | Budget applies end-to-end. If exceeded, suppress. |

> **Principle across §5:** the user never learns that the Occasion Engine failed. They asked to add an item to a cart. That must always succeed, and everything else is optional.

---

## 6. Model failure modes

All of these assume the model behaves badly, because eventually it will.

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-M1** | S2 | Model returns a **same-L1** suggestion | Filter R1 in code. Expect this to fire often — it is the model's most common drift. |
| **EC-M2** | S2 | Model returns a **SKU ID that does not exist** (hallucinated) | Validate every ID against the catalogue. Drop unmatched. Never render a model-invented product. |
| **EC-M3** | S2 | Model returns malformed or unparseable JSON | Schema-validate. On failure, one retry, then fall back to precomputed. |
| **EC-M4** | **S1** | Model produces a **factually wrong** reason, especially a safety claim | Reasons are drawn from a **curated, human-reviewed fact set** (R6). The runtime model *selects* a reason; it does not *author* one. This is the single most important control in the feature. |
| **EC-M5** | **S1** | Model produces an offensive, judgemental, or inappropriate reason | Same control as EC-M4 — the model cannot emit free text into the UI. |
| **EC-M6** | S2 | Reason exceeds the length limit and truncates mid-sentence | Enforce length at generation *and* validate at render. Drop rather than truncate — a half-sentence reason is worse than none. |
| **EC-M7** | S3 | Reason returned in the wrong language or code-mixed unintentionally | Validate language at precompute. Not a runtime concern given EC-M4's design. |
| **EC-M8** | S2 | Model **refuses** on a benign product (safety filter false positive on pharma, intimate care) | Catch refusals explicitly. Fall back to no suggestion. Never render a refusal message to the user. |
| **EC-M9** | S2 | **Prompt injection** via product name or user-supplied text | Product names come from our own catalogue, so the surface is small — but any free-text path must be delimited, length-capped, and never concatenated into system instructions. Model output is rendered as text, never executed or interpreted as markup. |
| **EC-M10** | S3 | Model returns duplicate suggestions | Deduplicate by SKU and by L1 — two items from the same new L1 is one category, not two. |
| **EC-M11** | S2 | Model suggests the **anchor item itself** | Explicit exclusion filter. |
| **EC-M12** | S3 | Model suggests something already in the cart | Filter against current cart contents, not just purchase history. |

> **The architectural consequence of EC-M4/M5:** the runtime model must never author user-visible copy. It selects from pre-validated options. This constrains the design, and that constraint is deliberate — it makes an entire class of failure structurally impossible rather than merely unlikely.

---

## 7. Metric integrity

Edge cases that would silently corrupt CER or C60 (`context.md` §3).

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-X1** | S2 | Suggestion added, then **removed before checkout** | Does not count. CER counts purchases, not adds. |
| **EC-X2** | S2 | Order placed, then **cancelled** | Reverse the CER attribution. |
| **EC-X3** | S2 | Item **returned or refunded** | Reverse. A returned first purchase is a failed exploration, not a successful one. |
| **EC-X4** | S2 | Suggested item was **free or heavily discounted** | Excluded from CER per the discount-adjusted definition. R7 already forbids price-led framing; this is the measurement counterpart. |
| **EC-X5** | S2 | User adds a new L1 **organically** in the same session the sheet fired | Attribution ambiguity. Requires a **holdout group** for causal measurement — without one, the feature will take credit for organic behaviour. |
| **EC-X6** | S3 | Same L1 appears twice in one order | Count the category once. |
| **EC-X7** | S2 | Sheet impression logged but never actually rendered (fired after navigation, EC-T10) | Log impressions on **render**, not on request. Otherwise add-rate is understated and every downstream number is wrong. |
| **EC-X8** | S3 | User buys the suggested L1 days later, not in this order | Delayed attribution window needs defining up front — otherwise the feature looks worse than it is. |

---

## 8. Accessibility and presentation

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-A1** | S2 | Screen reader user — sheet appears unannounced | `aria-live="polite"`. Announce, do not steal focus. Stealing focus from a mission-mode user is exactly the interruption the design forbids. |
| **EC-A2** | S3 | `prefers-reduced-motion` set | No slide animation. Appear instantly. |
| **EC-A3** | S2 | Sheet overlaps the cart button or bottom navigation | Must never obscure the primary action. Speed is the franchise. |
| **EC-A4** | S3 | Very large system font / 200% zoom | Sheet must reflow, not clip. Reason text must remain readable. |
| **EC-A5** | S3 | Small viewport (SE-class device) | Max 2 suggestions must still fit without scrolling the sheet itself. |
| **EC-A6** | S3 | Dark mode | Full support — the app is used at night, heavily. |
| **EC-A7** | S3 | Keyboard open (user was searching) | Suppress. Do not fight the keyboard for space. |
| **EC-A8** | S4 | Landscape orientation | Reflow to horizontal, or suppress. |
| **EC-A9** | S2 | Colour contrast on the reason line | Reason is the load-bearing content — it must not be styled as de-emphasised secondary text. WCAG AA minimum. |

---

## 9. Abuse and cost

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-B1** | S2 | Bot or script spams add-to-cart to burn inference quota | Per-session and per-IP rate limits on the live inference route. |
| **EC-B2** | S2 | Cost runaway during evaluation | Hard token caps per request; daily spend ceiling; precomputed path is free and covers the common case. |
| **EC-B3** | S3 | Someone discovers the public demo and hammers it | Rate limit + graceful degradation to precomputed-only. Demo stays up. |

---

## 10. Discovery engine (Part 1)

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-G1** | S2 | Source blocks scraping or changes its API mid-run | Partial corpus. **Record actual counts per source in the manifest** — never present a partial corpus as complete. |
| **EC-G2** | S2 | Corpus too small for stable clustering | HDBSCAN min-cluster-size becomes meaningless. **Report the limitation; do not lower thresholds to manufacture themes.** |
| **EC-G3** | S2 | Everything collapses into one giant cluster | Tune UMAP/HDBSCAN parameters, but record every parameter change in the manifest. Parameter-hunting until themes look good is p-hacking. |
| **EC-G4** | S2 | Most documents classified as noise | Report coverage honestly (§4.2 of `architecture.md`). Low coverage is a finding about corpus heterogeneity. |
| **EC-G5** | S2 | Near-duplicate reviews inflate a theme's size | MinHash dedup before clustering. Frequency drives insight ranking, so this directly corrupts conclusions. |
| **EC-G6** | S3 | Reviews are emoji-only or trivially short ("good", "bad") | Minimum-content filter before embedding. Tag and count, do not silently drop. |
| **EC-G7** | S2 | Reddit thread exceeds model context | Chunk with overlap; treat comments as individual documents rather than concatenating threads. |
| **EC-G8** | **S1** | Review text contains **PII** — phone numbers, addresses, order IDs | Scrub at ingest with pattern matching. Never persist, never send to a model, never quote. |
| **EC-G9** | S2 | **Quote verification fails on whitespace or unicode normalisation** | Normalise both sides identically before matching. A false hallucination flag is as damaging as a missed one — it would discredit valid insights. |
| **EC-G10** | S2 | Translated text breaks verbatim quote matching | Already handled by design: quotes are matched against `text_original`, never the translation (`architecture.md` §5.1). |
| **EC-G11** | S2 | Model cites a `document_id` that does not exist | Hard fail. Quarantine the insight. This is fabrication. |
| **EC-G12** | S3 | Bootstrap runs produce different cluster counts | Match themes across runs by embedding centroid similarity, not by index. |
| **EC-G13** | S2 | A single outage or viral incident dominates the corpus | Check temporal distribution. A theme concentrated in one week is an event, not a pattern — flag it as such. |
| **EC-G14** | S3 | Reviews for a differently-named but similar app get scraped | Verify package/app IDs explicitly. |
| **EC-G15** | S2 | Bot or incentivised fake reviews | Heuristic detection (duplicate text, timing clusters, generic 5-star). Flag rather than delete; report the estimated share. |
| **EC-G16** | S2 | Competitor corpus contaminates Blinkit-specific findings | `brand` field on every document (`architecture.md` §5.1). Never aggregate across brands without an explicit flag. |

---

## 11. Deployment

| ID | Sev | Scenario | Required behaviour |
|---|---|---|---|
| **EC-P1** | S2 | Environment variable missing at deploy | App boots and serves. Feature degrades to precomputed-only. **Never crash the build or the page.** |
| **EC-P2** | S2 | Build picks up the Python engine directory | `.vercelignore` excludes it. Verify on first deploy. |
| **EC-P3** | S3 | Artifact JSON too large for the build | Split by run; ship only the current run's artifacts to the client. |
| **EC-P4** | **S1** | **Identity leaks** via commit metadata, Vercel project name, or page metadata | Repo-local git config set before first commit; neutral project name; no byline anywhere. Per `context.md` §6 — verified, not assumed. |
| **EC-P5** | S2 | Synthetic catalogue mistaken for real Blinkit data | Persistent, visible "demo data" label in the UI. |
| **EC-P6** | S3 | Demo breaks during evaluation | Degradation ladder means the worst case is a working cart with no suggestions — still a functioning product. |

---

## 12. Must-fix before first demo

Everything at S1, plus the minimum set that keeps the demo coherent:

| | |
|---|---|
| **All of §1** | Sensitive-category denylist. Non-negotiable. |
| **EC-M4, EC-M5** | Curated fact set — the model selects reasons, never authors them |
| **EC-M2, EC-M11** | Catalogue-ID validation; never suggest the anchor |
| **EC-M1** | R1 same-L1 filter |
| **EC-E1, EC-E2, EC-E5** | Silent no-op paths |
| **EC-T4** | No recursive firing |
| **EC-L1–L4** | Full degradation ladder |
| **EC-G8** | PII scrubbing at ingest |
| **EC-P4** | Anonymity verification |
| **EC-P5** | Demo-data labelling |
| **EC-A1, EC-A3** | Screen reader announcement; never obscure the cart button |

---

## 13. Two design consequences

Working through these produced two constraints that change the build, and both are worth stating separately because they are easy to lose:

**1. The runtime model must not author user-visible copy.**
EC-M4 and EC-M5 (wrong facts, inappropriate reasons) cannot be reliably prevented by prompting. So reasons are written and human-reviewed offline into a curated fact set, and the runtime model's job is reduced to *selecting* among validated options. This makes an entire class of S1 failure structurally impossible rather than statistically unlikely. It also means the live demo's "AI" is doing occasion inference and selection, not free generation — which should be stated honestly rather than obscured.

**2. Sensitive categories are excluded by denylist before any model call, never by filtering output.**
A prompt instruction is a request. A code path is a guarantee. Given EC-S1 — where the failure mode is telling someone something devastating about their own life — only a guarantee is acceptable.
