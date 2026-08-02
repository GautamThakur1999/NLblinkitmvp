# Blinkit — Category Expansion: Problem Statement

**Author:** PM, Growth
**Date:** 27 July 2026
**Status:** Draft v1 — pre-research. To be revised after AI discovery engine output (Part 1) and 5–6 primary interviews (Part 2).

> **Epistemic note.** This document separates three things and labels them throughout:
> **[OBSERVED]** — structural facts about the current Blinkit app, verifiable by opening it.
> **[INFERRED]** — reasoning from those facts and from general q-commerce behaviour.
> **[ASSUMPTION]** — needs internal data or primary research before anyone acts on it.
> No quantitative claim here is sourced from Blinkit internal data. Every number is a placeholder to be filled from the data warehouse. App observations reflect the product as of mid-2026; re-verify against the current build before circulating.

---

## 1. The strategic goal, stated precisely

> Increase the percentage of Monthly Active Customers (MAC) who purchase from **at least one new category** in a given month.

Call this **Category Expansion Rate (CER)**.

```
CER (month M) =  # MAC who purchased ≥1 category in M that they had never purchased before
                 ────────────────────────────────────────────────────────────────────────
                                        Total MAC in M
```

This is a **share-of-wallet** objective, not an acquisition or engagement objective. It assumes the hard parts — installing, trusting, habituating — are already done. The user is active. They are transacting. They simply transact **narrowly**.

That distinction matters because it rules out most of the Growth team's usual toolkit. We are not fighting apathy, churn, or ignorance of the brand. We are fighting a *successful habit* that has hardened into a ceiling.

### 1.1 Definitional traps that will corrupt this metric

Before designing anything, the metric needs to be pinned down or it will be gamed — by the product, or by us, unintentionally.

| Trap | The problem | Recommended resolution |
|---|---|---|
| **What is a "category"?** | Measuring at L2/L3 ("Shampoo" vs "Conditioner") makes CER trivially easy to move and strategically meaningless. Measuring at L1 ("Personal Care") is honest but harder. | Define CER at **L1 only**. Report L2 as a diagnostic, never as the goal. |
| **"New" relative to what?** | Lifetime-new is the honest reading, but it mechanically decays as a user's tenure grows — a 3-year user has few L1s left. This makes CER look like it's falling when nothing changed. | Primary metric = **lifetime-new**. Segment by tenure cohort so decay is visible and not mistaken for regression. Add "not purchased in trailing 6 months" as a secondary *reactivation* metric. |
| **Free / heavily-discounted items** | A ₹1 trial sachet dropped into a cart technically satisfies "purchased a new category." We would hit target and learn nothing. | Exclude items below a price floor and items acquired at >X% discount from the numerator, or report them as a clearly separated line. |
| **One-off vs. sticky** | The single biggest risk. Coupon-driven trial moves CER without changing behaviour. The user takes the discount and reverts to the same basket forever. | **CER is not sufficient as a lone metric.** It must be paired with **C60: % of new-category triers who repurchase that category within 60 days.** CER measures the door opening. C60 measures whether anyone walked through. |
| **Cannibalisation** | A user shifting an existing Blinkit purchase between L1s (e.g. from "Munchies" to "Bakery") registers as expansion without incremental revenue. | Track incremental basket value alongside CER, not just category count. |

**[ASSUMPTION]** Current CER sits somewhere in the low double digits, and C60 is materially lower than CER. Both need pulling from internal data before any target is set. *If C60 turns out to be high, the problem is purely one of trial and this document over-weights the evaluation-cost thesis.*

---

## 2. Why this is structural, not a bug

The instinct is to treat low category breadth as a discovery/merchandising failure — users haven't *seen* the other categories. That framing is almost certainly wrong, and getting it wrong sends the whole project into banner-and-carousel work that will not move the metric.

**[INFERRED]** The mechanism is not ignorance. It is that **Blinkit's core value proposition is structurally hostile to exploration.**

Consider what the product optimised for and won on:

| Blinkit optimised for | Which produces | Which kills discovery because |
|---|---|---|
| 10-minute delivery | Urgency framing on every screen | Urgency collapses browsing. Nobody leisurely explores a fire exit. |
| Frictionless reorder | 2–3 minute sessions | There is no dwell time in which discovery could occur. |
| Search-led navigation | Users type what they already know | The search bar can only return what you can already name. |
| Known-intent fulfilment | A "fetch" mental model | The app is a tool, not a store. Tools are not browsed. |

Every one of those is a *feature*, correctly built, driving retention and frequency. **The behaviours that make Blinkit's core loop work are the same behaviours that cap category breadth.** That is why this problem has survived: no individual team has shipped anything wrong.

This reframes the design constraint sharply:

> **We cannot solve category expansion by adding browsing time. Any solution that asks the user to slow down is fighting the product's central promise and will lose.**

The solution must work *inside* a 90-second mission-mode session, or it must create a genuinely new session type with its own trigger.

---

## 3. Current-state teardown: where the app fails, surface by surface

### 3.1 The session model — discovery has no room to happen

**[OBSERVED]** The app opens to a location bar, an ETA promise ("delivery in 8 minutes"), a search bar, promo banners, and a category grid.
**[INFERRED]** The ETA promise is the first thing that frames the session. It is a speed commitment, and speed commitments prime task-completion behaviour, not exploratory behaviour. The user arrives with a list — mental or literal — and the entire UI affirms that mode.

**[ASSUMPTION]** A large majority of sessions are search-led or reorder-led, meaning **the merchandising surfaces the team invests in are bypassed entirely by most users on most visits.** This needs verification from clickstream data; if true, it invalidates any solution that lives on the home screen.

### 3.2 The "Order Again" rail — the single most effective anti-discovery mechanism in the app

**[OBSERVED]** Reorder / "Buy it again" surfaces sit at or near the top of the home experience.
**[INFERRED]** This rail is excellent for conversion and retention, and it is the most powerful force *against* the strategic goal. It offers a one-tap path to reconstitute last week's exact basket. Every tap on it is a session that ends without a single new-category impression being meaningfully considered.

We should not remove it. We should recognise that the product's highest-performing surface is actively optimising against the goal we've been given, and that **CER will not move by tweaking surfaces that sit below it.**

### 3.3 The category grid — supply-centric, static, and unpersonalised

**[OBSERVED]** The category grid presents ~20+ tiles (Vegetables & Fruits, Dairy Bread & Eggs, Munchies, Cold Drinks, Atta Rice & Dal, Personal Care, Baby Care, Pet Care, Cleaning Essentials, Home & Office, Pharma, Paan Corner, and so on).

Failures:

- **Supply-centric taxonomy.** The grid mirrors how the dark store is organised, not how a need is felt. A user does not think "I need Personal Care." They think "my scalp is itchy" or "my kid keeps getting rashes." The taxonomy demands the user has already translated a need into Blinkit's warehouse vocabulary — a translation that only a repeat buyer of that category can perform.
- **Static and identical for everyone.** **[INFERRED]** Ordering appears broadly fixed rather than adapting to the individual's unexplored categories. The grocery tiles a daily user has visited 200 times occupy the prime positions; the categories we want them to discover sit below the fold.
- **Position is inherited from aggregate popularity**, which is the exact signal that guarantees the status quo reproduces itself.

### 3.4 Search — only serves users who already know the answer

**[OBSERVED]** Search is predominantly lexical/keyword-matched against product names and brands, with recent and trending search suggestions.

**[INFERRED]** This is the sharpest single failure in the app for this goal. Search handles `"amul butter"` perfectly and `"something for a dry itchy scalp"` or `"gift for a 4 year old"` or `"my dog is a 10kg indie, what food"` poorly or not at all.

The consequence is precise and severe:

> **You can only find what you can already name. Naming requires prior category knowledge. Therefore search — the dominant navigation surface — is structurally incapable of producing a first purchase in an unfamiliar category.**

Trending searches compound this: they surface the aggregate's existing habits, reinforcing the popular.

### 3.5 The Product Detail Page — the evaluation vacuum *(the core failure)*

**[OBSERVED]** A typical Blinkit PDP contains: image carousel, product name, pack size/variant selector, price and MRP, "ADD" button, delivery ETA, a "Product Details" accordion (manufacturer, marketer, country of origin, FSSAI licence, shelf life, customer care, disclaimer), and a "similar products" rail.

**[OBSERVED]** What it does **not** meaningfully contain, across most of the catalogue: **star ratings, written customer reviews, review counts, Q&A, expert or editorial guidance, attribute-based fit filters, structured comparison, or usage instruction.**

This is entirely defensible for the core basket. Nobody needs a review to buy Amul Butter 500g. The product is known, the risk is nil, the decision was made years ago. **The PDP is optimised as a restocking confirmation screen, and for restocking it is correct.**

Now put a first-time buyer on it. A user considering their first ₹899 face serum, ₹1,400 bag of dog food, or ₹650 baby thermometer arrives with real questions:

- Is this brand any good? Has anyone else bought it?
- Which of these four near-identical SKUs fits *my* skin / *my* dog's age and weight / *my* baby's stage?
- What size do I start with? Is there a smaller one to try?
- What happens if it's wrong — can I return it?
- Is this priced fairly, or am I paying a convenience premium on a considered purchase?

**The PDP answers none of them.** The entire evaluation burden lands on a screen built to confirm a decision the user has already made.

> **Blinkit's PDP is a receipt, not a decision tool. For the core basket that is exactly right. For a first-time category purchase it is a dead end.**

**[INFERRED]** This is the mechanism by which a *motivated, willing* user fails to convert. It is not an awareness problem. The user found the category, opened the product, and then could not resolve enough uncertainty to press ADD. The 10-minute promise is irrelevant to a decision the user cannot make in 10 minutes.

### 3.6 Cart and checkout — upsell aimed at the wrong target

**[OBSERVED]** Cart-stage prompts ("you might have missed", "add ₹X more for free delivery") drive incremental units.
**[INFERRED]** These optimise for basket value via **low-ticket, familiar, same-category filler** — the cheapest way to close a free-delivery gap is another snack, not a first pet-care purchase. The mechanic is well-tuned for AOV and structurally biased against category breadth.

Additionally, fee structures (handling, small-cart, surge/rain fees) **[OBSERVED]** are levied at cart stage, which is precisely when a hesitant first-time trier is most likely to abandon an exploratory add-on.

### 3.7 Post-purchase — the loop is never closed

**[OBSERVED]** After delivery, the experience effectively terminates. There is no substantial post-delivery follow-up.
**[INFERRED]** This discards the highest-signal moment in the entire journey. A user who just bought their first pet product is, at that instant, maximally identifiable as a pet owner and maximally receptive to adjacency. Nothing happens. There is no satisfaction check, no adjacency nudge, no replenishment reminder calibrated to the new category — and therefore no mechanism converting a one-off trial into the repeat purchase that C60 measures.

### 3.8 CRM and notifications — discount-led and category-blind

**[OBSERVED]** Push and in-app messaging skew heavily toward offers, discounts, and time-bound deals.
**[INFERRED]** Discount-led messaging selects for deal-seekers, not category adopters. It also tends to promote already-popular categories (because those have the volume to justify promotional spend), so the highest-reach channel we own is reinforcing the existing basket. Notifications are triggered by merchandising calendars, not by inferred life-stage or unexplored-category signals.

### 3.9 Ranking and personalisation — engineered popularity bias

**[INFERRED]** Recommendation and ranking systems trained on engagement will systematically favour high-frequency, high-conversion categories. Collaborative filtering recommends what similar users bought — and similar users also bought groceries. New and long-tail categories have insufficient interaction data to earn placement, so they never accumulate the signal that placement would generate.

This is a textbook cold-start / popularity-bias trap: **the ranking system cannot recommend its way out of the problem, because the problem is encoded in its training signal.**

### 3.10 Assortment depth — the supply-side half of the problem

**[OBSERVED]** Dark stores carry finite shelf space. Long-tail categories (pet, beauty, baby, home, electronics accessories) necessarily carry far fewer SKUs per need-state than a specialist retailer.
**[INFERRED]** When a user does overcome every barrier above and explores, they may find 3–4 options where Nykaa or Amazon offers 300. The user's conclusion is not "Blinkit has thin assortment in this sub-category." It is **"Blinkit isn't for that."** One disconfirming experience sets a durable belief.

**[ASSUMPTION]** Out-of-stock rates are higher in exploratory categories than in core grocery. If true, the first exploratory experience is also the least reliable one. Verify from ops data.

### 3.11 Risk and trust — nothing de-risks a first purchase

**[OBSERVED]** Return and refund policies for quick commerce are necessarily tighter than marketplace norms; there is no "try it and send it back" affordance.
**[INFERRED]** Combine that with the absence of reviews (§3.5) and the user faces a considered purchase with **no social proof and no meaningful safety net.** Rational response: buy it somewhere that offers at least one of the two.

**[INFERRED]** Trust does not transfer across categories automatically. A user who trusts Blinkit implicitly for milk has no basis to trust it for a ₹1,200 dog food or a skincare active. Category trust is earned per-category; the app currently provides no mechanism for transferring it.

### 3.12 Onboarding and mental model — we taught them we're a grocery app

**[OBSERVED]** Onboarding establishes location, delivery speed, and the grocery basket. Breadth of catalogue is not established at any point.
**[INFERRED]** The user forms a durable frame — *"Blinkit = grocery + snacks, fast"* — in the first few sessions and never revisits it. This is the deepest barrier, because **a user operating under that frame will not even search for the categories we want them to find.** Zero search demand for pet supplies is then read by the business as zero pet demand.

---

## 4. The compounding loops

None of the failures above is independent. They form reinforcing loops, which is why point fixes have not worked and will not.

**Loop A — Ranking death spiral.**
Engagement-optimised ranking favours high-frequency categories → they receive impressions → they convert → they earn more impressions → new categories never accumulate the interaction data required to earn placement.

**Loop B — Merchandising bypass.**
Sessions are search- and reorder-led → merchandising surfaces are bypassed → merchandising underperforms in reporting → investment moves elsewhere → discovery surfaces degrade → more sessions become search-led.

**Loop C — Speed compression.**
Speed promise → mission-mode framing → shorter sessions → fewer discovery impressions → habit deepens → the reorder path is optimised further → sessions shorten again.

**Loop D — The supply–demand deadlock *(most damaging)*.**
Thin long-tail assortment → the rare explorer finds little → concludes "Blinkit isn't for that" → category demand signal stays flat → merchandising reads flat demand and deprioritises SKU depth → assortment stays thin.
*This loop cannot be broken from the demand side alone. Driving traffic into a category that will disappoint is actively counterproductive — it manufactures durable disconfirming beliefs at scale.*

**Loop E — Mental model lock-in.**
"Grocery app" frame → users don't search non-grocery → zero search demand → business reads no demand → no investment in making those categories discoverable → frame persists.

---

## 5. What users do instead — workarounds *(hypotheses for interviews)*

**[ASSUMPTION — all of §5. This is exactly what Part 2 interviews must confirm or destroy.]**

1. **Research elsewhere, buy elsewhere.** The user researches a serum on Nykaa/YouTube/Instagram, and buys it there too — because the research context and the buying context are the same tab. Blinkit is never considered. *If this is the dominant pattern, the intervention must be at the research stage, not the purchase stage.*
2. **Research elsewhere, buy on Blinkit.** Decision made externally, Blinkit used purely as fast fulfilment for an already-chosen SKU. *If this dominates, Blinkit is a fulfilment layer for other people's discovery, and the fix is capturing the decision earlier.*
3. **Ask a human.** WhatsApp a friend, family member, or group before trying an unfamiliar category. Social proof is sourced from a trusted person because the app supplies none.
4. **Defer to a "big" shop.** Anything considered, expensive, or unfamiliar is batched to a monthly Amazon/BigBasket/DMart trip. Blinkit is mentally reserved for small, urgent, known items — a self-imposed scope limit.
5. **Single-SKU loyalty.** Once a product works, it is never re-evaluated. The user buys the same shampoo for years. Switching cost is cognitive, not financial.
6. **Accidental discovery via unavailability.** A category is tried only when the usual channel fails (shop shut, Amazon too slow, urgent need at 11pm). Exploration is currently driven by *emergency*, not intent — which is a real insight if confirmed: **it suggests urgency is the only force strong enough to overcome evaluation cost today.**

---

## 6. Segment hypotheses — who to target

CER is an average across a heterogeneous base. Targeting the average will produce a solution for nobody.

| Segment | Why it might work | Why it might not |
|---|---|---|
| **A. High-frequency, low-breadth restockers** (≥6 orders/mo, ≤2 L1 categories) | Trust and habit already proven. The only missing ingredients are trigger and confidence. Largest volume, cheapest to move. | Habit is *most* entrenched here. Mission-mode is strongest. |
| **B. New parents** | Genuine, urgent, recurring new need. Baby care has high LTV and natural adjacency into pharma, personal care, home. | Highest anxiety and evaluation cost of any segment. Least tolerant of getting it wrong. |
| **C. New pet parents** | Very high LTV, strong repeat once converted, clear adjacency ladder. | Small population; long acquisition cycle. |
| **D. Life-transition movers** (new city, new home, new flatmate) | Everything is being decided from scratch; existing habits are temporarily suspended — the rare window where defaults are re-set. | Hard to detect, narrow window, transient. |
| **E. Deal-driven explorers** | Easiest to move on CER. | Almost certainly fails C60. Moves the vanity metric, not the business. |

**[ASSUMPTION]** **Segment A is the recommended primary target** — it carries the volume needed to move a base-wide percentage metric, and the trust barrier is already cleared. Segments B/C/D are better *wedges* (higher intent per user) but too small to move CER alone.

**This choice must be confirmed by the discovery engine's segment analysis (Part 1) and the interviews (Part 2), not assumed.**

---

## 7. Pre-mortem: why the obvious solutions fail

Recording this now, so that Part 4 is disciplined rather than reactive.

| Proposed fix | Why it fails |
|---|---|
| **"Add a Discover tab"** | Mission-mode users never tap it. It adds navigation weight for everyone to serve a minority behaviour. Discovery tabs in transactional apps are reliably among the lowest-engagement surfaces. |
| **"More home-screen banners"** | Banner blindness. Promo-led banners attract deal-seekers (fails C60) and cost margin. Does not address evaluation cost — it creates *more* awareness of a decision the user still cannot make. |
| **"Discount coupons for new categories"** | Buys a transaction, not a habit. Directly contaminates CER while leaving C60 flat. Also trains users to explore only when paid to. |
| **"Ship a recommendation carousel"** | Popularity bias (Loop A) means it will recommend adjacent groceries. The model cannot recommend its way out of a problem encoded in its training signal. |
| **"Add ratings and reviews"** | Directionally right, addresses §3.5 — but has a severe cold-start problem, needs review volume before it's useful, carries moderation cost, and *still* doesn't answer "which of these four fits **my** need." Necessary, not sufficient. |
| **"Gamification / streaks / badges"** | Extrinsic motivation layered over an unresolved evaluation problem. Moves the metric briefly, decays fast, and risks cheapening the brand. |
| **"Just drive traffic to weak categories"** | Actively harmful. Loop D means sending users into thin assortment manufactures durable "Blinkit isn't for that" beliefs at scale. |

**The through-line:** every naive fix targets *awareness*. If the diagnosis in §3.5 is right, awareness is not the binding constraint — **decidability** is.

---

## 8. Consolidated problem statement

> **Segment.** High-frequency Blinkit users who have already made the platform a weekly habit but transact within two or three familiar categories.
>
> **Problem.** These users do not explore new categories — not because they are unaware Blinkit carries them, but because Blinkit gives them no way to *decide*. The app is engineered end-to-end for known-intent restocking: search only returns what you can already name, the PDP is a confirmation receipt with no ratings, reviews, fit guidance or comparison, and the entire session is framed by a 10-minute promise that makes deliberation feel out of place. So when a genuine new need arises — a first pet food, a first serum, a first baby product — the user leaves to research it somewhere that can answer "is this any good, and is it right for me," and then buys it there too.
>
> **Root cause.** *Evaluation cost.* Every first purchase in an unfamiliar category demands uncertainty-resolution that quick commerce has deliberately stripped out in pursuit of speed. Compounding this, engagement-optimised ranking structurally reproduces the existing basket, and thin long-tail assortment punishes the users who do explore — turning one disappointing attempt into a durable "Blinkit isn't for that" belief.
>
> **The design constraint.** Any solution that asks the user to slow down and browse is fighting the product's central promise and will lose. **The job is not to surface new categories. It is to make a first-time category purchase decidable in under a minute, inside the session the user was already having.**

### Why solving it creates user value
Users currently pay a real tax: fragmenting a single need across three apps, waiting days for something available in ten minutes, and relying on friends for judgement the platform should be able to supply. Resolving evaluation cost saves time and reduces the risk of buying the wrong thing.

### Why solving it makes business sense
**[ASSUMPTION — quantify from internal data before presenting.]** The acquisition cost for these users is already sunk; incremental categories are the cheapest revenue available. Non-grocery categories generally carry materially better contribution margins than high-frequency staples, so breadth improves basket economics rather than just basket size. Multi-category users are typically more retained and harder for competitors to dislodge — as Zepto, Instamart, Amazon Now and Flipkart Minutes converge on delivery speed, **assortment breadth and decision support become the differentiators that speed no longer provides.**

---

## 9. What the research must resolve

Open questions carried into Part 1 (discovery engine) and Part 2 (interviews):

1. Is the binding constraint **awareness**, **evaluation cost**, **trust**, **assortment**, or **price**? *(The entire solution direction hinges on this. This document argues evaluation cost — the research must be genuinely capable of proving it wrong.)*
2. When a user needs something in an unfamiliar category, what is the **actual sequence** of apps, people and channels they pass through — and where exactly is Blinkit dropped?
3. What specific information would have been **sufficient** to decide inside Blinkit? Reviews? Someone-like-me signal? Expert guidance? A smaller trial size? A return guarantee?
4. Which **triggers** have historically produced a successful first purchase in a new category? Urgency? A recommendation from a person? A visible offer? A life event?
5. Does thin assortment actually cause abandonment, or do users not get far enough to notice?
6. Do **segments differ** in kind or only in degree? Is the new-parent barrier the same barrier as the habitual restocker's, or a different one entirely?
7. Is there a real **price-perception penalty** on considered purchases, distinct from convenience-fee tolerance on small baskets?

---

## 10. Assumptions register

Everything in this table is currently unvalidated and must be resolved before Part 4 is designed.

| # | Assumption | How to validate | If false, then |
|---|---|---|---|
| A1 | Users know Blinkit carries non-grocery categories | Interviews; unaided/aided recall | The problem *is* awareness, and merchandising fixes become viable |
| A2 | Evaluation cost is the primary blocker | Interviews; funnel drop-off at PDP for first-time-category viewers | Solution direction changes entirely |
| A3 | Most sessions are search- or reorder-led | Clickstream | Home-screen solutions become viable |
| A4 | Users research on other platforms before considered purchases | Interviews | The "capture the decision earlier" thesis collapses |
| A5 | Segment A (high-frequency, low-breadth) is the right target | Discovery-engine segment analysis + cohort data | Retarget to a wedge segment |
| A6 | Long-tail assortment is adequate for a *first* purchase, even if not for a connoisseur | Catalogue depth audit per L1 | Demand-side work must be sequenced behind supply-side work |
| A7 | C60 is materially lower than CER (trial ≠ habit) | Internal cohort analysis | Trial mechanics alone would suffice |
| A8 | Non-grocery carries better contribution margin | Finance | The business case needs rebuilding on retention rather than margin |

---

## 11. Success criteria and guard metrics

**Primary:** CER (L1, lifetime-new, discount-adjusted).
**Companion:** C60 — repeat into the new category within 60 days. *CER without C60 is a vanity metric.*

**Guard metrics — a solution that wins CER while breaking any of these is a net loss:**

- Time-to-order for core-basket sessions **must not regress.** Speed is the franchise; we do not trade it.
- Core-basket conversion rate must hold.
- Return, cancellation and complaint rates in newly-tried categories must stay within tolerance — a bad first experience is worse than no first experience (Loop D).
- Contribution margin per order must not be bought down by promotional spend.
- Notification opt-out rate must not rise.

---

## 12. Next steps

1. **Part 1 — Discovery engine.** Build the pipeline across App Store, Play Store, Reddit, forums and social. Explicitly test §3's diagnosis against unprompted user language, and let the theming be bottom-up rather than confirming this document.
2. **Part 2 — Interviews.** 5–6 respondents from Segment A. The guide must be written to *falsify* A2, not to confirm it.
3. **Part 3 — Reconcile.** Publish an honest AI-vs-primary table: what held, what broke, what neither method saw.
4. **Part 4 — MVP.** Build against whatever survives, under the §8 design constraint and the §11 guard metrics.

> **A note on discipline.** This document is a hypothesis written before the evidence. Its most valuable outcome would be being proven wrong early and cheaply. The pre-mortem in §7 and the assumptions register in §10 exist so that we notice if that happens, rather than quietly steering the research toward the conclusion we already wrote down.
