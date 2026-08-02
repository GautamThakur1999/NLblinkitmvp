# Project Context — Blinkit Category Expansion

**Master context file. Read this first.**
This is the single source of truth for what is being built, why, and under what constraints. Every other document in this repo is downstream of this one.

---

## 1. The selection

| | |
|---|---|
| **Product chosen** | **Blinkit** |
| **Not** | Swiggy Instamart, Zepto *(both were options; neither is in scope)* |
| **Role being played** | Product Manager, **Growth Team**, Blinkit |
| **Deliverable** | 4-part project, ending in a **live, production-deployed AI-native MVP** |

Blinkit is India's quick-commerce leader, delivering groceries and an expanding general-merchandise catalogue in roughly 10 minutes via a dark-store network. Its catalogue spans core grocery (fruit & veg, dairy, staples, snacks, beverages) and a widening long tail — personal care, baby care, pet care, pharma, cleaning, home & office, electronics accessories, toys, stationery, gifting.

---

## 2. The business context

Quick commerce has won its behavioural battle. Blinkit is now a **weekly, often daily, habit** for millions of users. Ordering is routine, trusted, and fast.

That success created a second-order problem:

> **Habit has hardened into a ceiling.** Users buy the same set of products, from the same two or three categories, over and over. They rarely explore the rest of the catalogue — even though they are active, trusting, high-frequency customers who transact repeatedly.

The company can therefore grow Monthly Active Customers and order frequency while **basket breadth stays flat**. Revenue per user plateaus not because users are disengaged, but because they are *narrowly* engaged.

---

## 3. The strategic goal

> **Increase the percentage of Monthly Active Customers who purchase products from at least one new category every month.**

Referred to throughout this project as **Category Expansion Rate (CER)**.

```
CER (month M) =  # MAC who purchased ≥1 category in M never purchased before
                 ─────────────────────────────────────────────────────────────
                                     Total MAC in M
```

### Illustrative expansions (from the brief)

- A user who buys **groceries** starts buying **pet supplies**
- A user who buys **snacks** starts buying **personal care**
- A user who buys **household essentials** starts buying **baby products**

### What kind of goal this is

This is a **share-of-wallet** objective — *not* acquisition, *not* retention, *not* engagement. The user is already acquired, already retained, already active. The gap is purely **breadth**.

That rules out most of the standard Growth toolkit. We are not fighting apathy, churn, or brand ignorance. **We are fighting a successful habit.**

### Metric integrity (non-negotiable)

CER measured alone is gameable — a ₹1 trial sachet or a new-category coupon moves it without changing behaviour. It is therefore paired with:

- **C60** — % of new-category triers who **repurchase that category within 60 days**.
- CER measures the door opening. **C60 measures whether anyone walked through.**
- CER is defined at **L1 category only**, lifetime-new, and discount-adjusted.

Full metric definition, gaming traps and guard metrics: [`docs/01-problem-statement.md`](docs/01-problem-statement.md) §1 and §11.

---

## 4. The problem, stated

> **Segment.** High-frequency Blinkit users who have already made the platform a weekly habit but transact within only two or three familiar categories.
>
> **Problem.** These users do not explore new categories — not because they are unaware Blinkit carries them, but because Blinkit gives them no way to **decide**. The app is engineered end-to-end for known-intent restocking: search only returns what you can already name; the product page is a confirmation receipt with no ratings, reviews, fit guidance or comparison; and the whole session is framed by a 10-minute promise that makes deliberation feel out of place. So when a genuine new need arises — a first pet food, a first serum, a first baby product — the user leaves to research it somewhere that can answer *"is this any good, and is it right for me?"* — and then buys it there too.
>
> **Root cause (hypothesis).** **Evaluation cost.** Every first purchase in an unfamiliar category demands uncertainty-resolution that quick commerce deliberately stripped out in pursuit of speed. Compounding it: engagement-optimised ranking structurally reproduces the existing basket, and thin long-tail assortment punishes the users who *do* explore — converting one disappointing attempt into a durable *"Blinkit isn't for that"* belief.

### The governing design constraint

> **Any solution that asks the user to slow down and browse is fighting the product's central promise and will lose.**
>
> The job is not to *surface* new categories.
> The job is to make a **first-time category purchase decidable in under a minute, inside the session the user was already having.**

### Why this is structural, not a bug

Every behaviour that makes Blinkit work is the same behaviour that caps category breadth:

| Blinkit optimised for | Which produces | Which kills discovery because |
|---|---|---|
| 10-minute delivery | Urgency framing on every screen | Urgency collapses browsing |
| Frictionless reorder | 2–3 minute sessions | No dwell time for discovery to occur |
| Search-led navigation | Users type what they already know | Search only returns what you can name |
| Known-intent fulfilment | A "fetch" mental model | The app is a tool, not a store — tools aren't browsed |

No team shipped anything wrong. That is precisely why the problem has survived.

**Full surface-by-surface teardown** (session model, Order Again rail, category grid, search, PDP evaluation vacuum, cart, post-purchase, CRM, ranking bias, assortment depth, trust/risk, onboarding) plus the five compounding feedback loops: [`docs/01-problem-statement.md`](docs/01-problem-statement.md) §3–§4.

---

## 5. The four required parts

### Part 1 — Build an AI-Powered Discovery Engine
Build a system that analyses user feedback **at scale**, *before* proposing any solution.

**Permitted stack (any AI-native choice):** Claude · GPTs · Agents · Workflows · RAG systems · n8n · Zapier · Perplexity

**Sources to analyse:**
- App Store reviews
- Play Store reviews
- Reddit discussions
- Community forums
- Social media conversations
- Product reviews
- Quick-commerce discussions

**Questions the engine must help answer:**
1. Why do users repeatedly buy from the same categories?
2. What prevents users from exploring new categories?
3. How do users discover products today?
4. What role do habits play in shopping behaviour?
5. What information do users need before trying a new category?
6. What frustrations emerge repeatedly?
7. Which user segments are more likely to experiment?
8. What unmet needs emerge consistently across discussions?

**Must explicitly demonstrate:**
- How the workflow **gathers and analyses** data
- How **themes are identified**
- How **insights are generated**
- How **insight quality was validated** ← *most submissions are thin here; this is where the marks are*

### Part 2 — Validate Through User Research
AI insights are a starting point only. Conduct **5–6 user interviews** with the chosen target segment.

*Agreed approach: this project produces the screener, discussion guide and synthesis framework; the interviews are conducted first-hand and the notes synthesised back in. The guide is written to **falsify** the evaluation-cost hypothesis, not to confirm it.*

### Part 3 — Define the Problem
Frame the problem with:
- The target user segment
- The root cause
- Existing user workarounds
- Why solving it creates **user value**
- Why solving it makes **business sense**

Must demonstrate **how primary research validated or challenged** the AI-surfaced insights.

### Part 4 — Build an AI-Native MVP
Design and build a **functional** MVP. May be:
- a prototype for a feature within the existing product, **or**
- an AI-powered workflow, **or**
- an AI agent

**Must be deployed to production.**

---

## 6. Working constraints

| Constraint | Decision |
|---|---|
| **Deployment target** | **Vercel** — production URL required |
| **Git remote** | `github.com/<owner>/NLblinkitmvp` — ⚠️ **the account name carries a personal identifier and conflicts with the anonymity constraint below.** See §6.1. |
| **AI runtime** | **Groq + Gemini** (keys already provisioned; supplied at deploy time as env vars, never committed) |
| **Anonymity** | **Hard requirement.** No name, email, username, local file paths, or author byline beyond a generic role anywhere in any deliverable — including git commit metadata, the Vercel subdomain, page metadata and seeded demo data. Enforced via [`.gitignore`](.gitignore) and repo-local git config. |
| **Interview participants** | Referred to by code (`P1`–`P6`), never by name |
| **Prior work** | Not reused. This project is a clean start. |

### 6.1 Open conflict — repo ownership vs anonymity

The nominated GitHub repository is owned by an account whose username contains a personal name. Repository *contents* can be kept fully anonymous; **repository ownership cannot** — the account name appears in the URL, in the commit author history, and in the Vercel↔GitHub integration.

| Option | Anonymity | Cost |
|---|---|---|
| **A. Private repo, submit only the Vercel URL** | Strong — evaluators never see the GitHub account | Cannot share a code link |
| **B. New neutrally-named GitHub account or org** | Strongest | 10 minutes of setup; must re-point Vercel |
| **C. Use as-is, contents anonymous only** | Weak — username visible to anyone given the repo link | None |

**Unresolved — requires a decision before first push.** Until then, no commits are made to this remote.

Regardless of option: repo-local `git config user.name` / `user.email` are set to neutral values before the first commit, so **commit author metadata is anonymous in all three cases.**

---

## 7. Deliverables tracker

| # | Part | Deliverable | Status |
|---|---|---|---|
| 0 | Context | `context.md` (this file) | ✅ Done |
| 0 | Context | `docs/01-problem-statement.md` — full teardown | ✅ Done |
| 0 | Context | `architecture.md` — technical architecture | ✅ Done |
| 0 | Context | `edge.md` — 97 edge cases | ✅ Done |
| 0 | Context | `implementation-plan.md` — full build plan | ✅ Done |
| 1 | Discovery engine | Ingestion → theming → insight → validation pipeline | ⬜ Not started |
| 1 | Discovery engine | Insight-quality validation report | ⬜ Not started |
| 2 | Research | Screener + discussion guide + synthesis template | ⬜ Not started |
| 2 | Research | Synthesis of 5–6 interviews | ⬜ Blocked on interviews |
| 3 | Problem definition | Final framing + AI-vs-primary reconciliation table | ⬜ Blocked on Part 2 |
| 4 | MVP | `docs/06-mvp-concept.md` — Occasion Engine spec | ✅ Done |
| 4 | MVP | Functional AI-native MVP | ⬜ Not started |
| 4 | MVP | Live Vercel production deployment | ⬜ Not started |

---

## 8. Standing principles for this project

1. **Label the epistemics.** Every claim is tagged `[OBSERVED]` (verifiable in the app), `[INFERRED]` (reasoned), or `[ASSUMPTION]` (needs data). No internal Blinkit data is available — every quantitative figure is a placeholder, marked as such.
2. **Research must be able to fail.** The evaluation-cost thesis is a hypothesis written *before* the evidence. Instruments are designed to disprove it. Being proven wrong early and cheaply is the most valuable outcome available.
3. **Pre-mortem before build.** Naive solutions (Discover tab, more banners, new-category coupons, recommendation carousels, gamification) are documented with why each fails — recorded *before* Part 4, so the MVP is disciplined rather than reactive. See [`docs/01-problem-statement.md`](docs/01-problem-statement.md) §7.
4. **Guard the franchise.** Speed is Blinkit's core promise. Any solution that regresses time-to-order for core-basket sessions is a net loss regardless of what it does to CER.
5. **Don't send users into thin assortment.** Driving traffic to a category that will disappoint manufactures durable *"Blinkit isn't for that"* beliefs at scale — worse than doing nothing.

---

## 9. Document map

| File | Contains |
|---|---|
| `context.md` | **This file.** Brief, selection, goal, problem summary, constraints, tracker. |
| `docs/01-problem-statement.md` | Full analysis: metric definition & gaming traps, surface-by-surface app teardown, five compounding loops, workaround hypotheses, segment analysis, pre-mortem, assumptions register, guard metrics. |
| `architecture.md` | Technical architecture: discovery-engine pipeline, seven-check validation subsystem, data contract, MVP request path & latency budget, repo layout, ADRs, risks, build sequence. |
| `docs/06-mvp-concept.md` | **Occasion Engine** — the MVP. Trigger, surface anatomy, hard rules R1–R8, occasion data model, hybrid compute, instrumentation, invalidation conditions, build plan. |
| `docs/07-demo-journey.md` | Screen-by-screen demo walkthrough — four flows, demo persona, evaluator script. *(Layout superseded by `08`; flows and copy still authoritative.)* |
| `docs/08-design-integration.md` | Stitch → Occasion Engine. What's adopted, what's rejected and why, desktop rail layout, component mapping. |
| `edge.md` | 97 edge cases across 11 domains, severity-rated, with required behaviour for each. |
| `implementation-plan.md` | Every build task across all 4 parts, with full edge-case and brief-requirement traceability, test plan, and go/no-go gates. |
| `.gitignore` | Blocks identity/secret leakage into the submission repo. |

> **Maintenance note.** `context.md` holds the brief, constraints and current status. `docs/01-problem-statement.md` holds the deep analysis. When the analysis changes, update the detailed doc and revise only §4's summary here — so the two never drift into contradicting each other.
