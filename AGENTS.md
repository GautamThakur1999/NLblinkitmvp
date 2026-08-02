<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project handoff — read before writing any code

Everything below is a decision already made, usually for a reason that is not obvious from the code.

*(If your tool expects `CLAUDE.md`, `GEMINI.md`, or `.cursorrules`, copy or symlink this file — the content is tool-agnostic.)*

---

## What this is

A 4-part product project for **Blinkit** (Indian quick-commerce). Goal: increase the **% of Monthly Active Customers who buy from at least one new category each month** — called **CER** throughout.

The MVP is the **Occasion Engine**: when a user adds a product to cart, infer the occasion behind it and surface 1–2 items from a **different L1 category**, each with the reason it matters, purchasable in one tap.

Deploys to **Vercel**. AI runtime is **Groq** (fast path) + **Gemini** (offline corpus work).

---

## Read in this order

| # | File | Why |
|---|---|---|
| 1 | `context.md` | Brief, constraints, metric definition, deliverables tracker |
| 2 | `implementation-plan.md` | **The build. ~140 tasks with stable IDs.** Work from this. |
| 3 | `docs/06-mvp-concept.md` | What the feature is; the 8 hard rules R1–R8 |
| 4 | `edge.md` | 97 edge cases. **§1 (sensitive categories) is not optional.** |
| 5 | `docs/07-demo-journey.md` | The 4 demo flows the build must produce |
| 6 | `docs/08-design-integration.md` | Layout + design system (desktop rail, Stitch tokens) |
| 7 | `architecture.md` | System design, data contract, ADRs |
| 8 | `docs/01-problem-statement.md` | The reasoning behind all of it. Read when a decision seems wrong. |

**Short on time: 1, 2, 3, and `edge.md` §1.**

---

## Current state — verified 1 Aug 2026

**Done**
- All planning docs above
- **`P0-1`** — git initialised, repo-local identity set to `Anonymous Analyst <analyst@example.com>`, **0 commits, no remote**
- `P0-3` `.vercelignore` · `P0-4` Next.js **16.2.12** + React 19.2.4 + TS scaffolded at `src/app` · `P0-6` `.env.example`
- `P0-7` `engine/config.py` + `lib/models.ts` — model IDs **verified 30 Jul 2026**, latency budgets, `OCCASION_RULES`
- Stitch design system + 5 screens in `stitch_blinkit_ai_category_discovery/`

**Next**
1. `P0-5` — `engine/pyproject.toml` (only Phase 0 item outstanding)
2. `P0-9` boot-safety · `P0-10` structured logging
3. **`P8` — research kit.** Calendar-blocking; every day it isn't sent adds a day to the end.
4. Then `P10` (catalogue + fact set) and `P12` (UI) alongside the engine

**Blocked:** Groq/Gemini keys — gates engine language work and `P11-25` only, **not** the UI, filters, catalogue, or instrumentation. Reddit API credentials for `P1-3`. Repo-ownership decision (`context.md` §6.1) for first push only.

> ⚠️ **The plan says Next.js 15; the scaffold is 16.** Follow the scaffold, and heed the Next.js block at the top of this file — App Router APIs have shifted. Verify against `node_modules/next/dist/docs/` rather than assuming.

---

## The seven invariants — the build fails without these

| | | Task |
|---|---|---|
| **INV-1** | Add-to-cart is the **only** trigger | P11-23 |
| **INV-2** | Every suggestion is a **different L1** than the anchor | P11-2 |
| **INV-3** | Every suggestion is a category the user has **never purchased** | P11-4 |
| **INV-4** | Every suggestion carries a reason from the **curated fact set** | P10-3/5 |
| **INV-5** | Purchasable in **one tap** | P12-21 |
| **INV-6** | **Never blocks** the cart flow | P12-2 |
| **INV-7** | Sensitive anchors produce **nothing at all** | P11-1 |

**INV-2 and INV-3 are the brief itself.** A same-category or already-purchased suggestion contributes exactly zero to CER.

---

## Non-negotiables

**1. Sensitive categories are blocked in code, before any model call.**
Pregnancy/fertility, contraceptive/intimate, pharma-as-suggestion, weight-loss. A denylist check — not a prompt instruction, not an output filter. *A prompt is a request; a code path is a guarantee.* The failure mode is telling someone something devastating about their own life. See `edge.md` §1.

**2. The runtime model never authors user-visible copy.**
Reasons come from a human-reviewed fact set (`P10-3`, `P10-5`). The model *selects*; it does not *write*. This makes wrong safety claims structurally impossible rather than merely unlikely. Do not "simplify" by letting the LLM generate reason text.

**3. Hard rules R1–R8 live in code, never in prompts.**
Models drift — an LLM asked for a cross-category suggestion will return same-category ones. Constants are in `lib/models.ts` → `OCCASION_RULES`.

**4. Anonymity is a hard requirement.**
No name, email, username, local path, or author byline in any file, commit, page title, or deploy URL. Repo-local identity is already set correctly — **do not override it, and do not let a tool set a global identity on this repo.** The nominated GitHub account name contains a personal identifier; unresolved, see `context.md` §6.1. **Do not push until decided.**

**5. Model IDs were verified 30 Jul 2026. Do not guess new ones.**
`python -m engine.config --verify` checks them against the live provider APIs. Groq: production models only — preview models are discontinued without notice. The previous IDs (`llama3-70b-8192`, `gemini-1.5-*`) were all dead, which is why this check exists.

---

## Changes that look like improvements but are regressions

Each was considered and rejected. Reintroducing any breaks the argument the project rests on.

| Don't | Why |
|---|---|
| Make the suggestion surface a **modal** | Taxes time-to-order for everyone who dismisses it. Speed is the franchise. |
| Add **star ratings** to product pages | Their *absence* is the evidence for the problem statement §3.5. The sparse PDP is an argument. |
| Add **progress meters, badges, "% explored"** | Gamification is explicitly pre-mortem'd as failing (`01-problem-statement.md` §7) |
| Lead with **discounts or savings** | Coupon-led trial moves CER and fails C60. We want the category, not the transaction. |
| Show a **loading skeleton** on the suggestion surface | Non-blocking surfaces read as broken when they load. Render within 300ms or render nothing. |
| Show **more than 2 suggestions** by default | A list recreates the evaluation cost we are removing |
| Make the Discovery Hub reachable from **navigation** | That is the Discover tab, which fails. Opt-in expansion only. |
| Add an **error state** when suggestions fail | The user never learns this feature failed. Silent no-op is correct. |
| Cut **DF-C** (the sensitive-category silence) from the demo | The most important 10 seconds. Survives every scope cut. |

---

## Conventions

- Task IDs (`P11-2`, `EC-S1`, `INV-3`, `DF-A`) are **stable** — use them in commits and test names
- Tests: `test_EC_S1_no_adjacency_pregnancy`, `test_INV2_cross_l1`
- Model IDs and thresholds live **only** in `engine/config.py` and `lib/models.ts`
- Synthetic catalogue carries a visible **"DEMO DATA"** label — never presented as real Blinkit data
- `engine/` is Python and stays out of the Vercel build via `.vercelignore`
- `data/artifacts/` is committed evidence — traceable, not regenerated on demand

---

## If a decision looks wrong

Check `docs/01-problem-statement.md` §7 (pre-mortem) and `architecture.md` §9 (ADRs) first — the alternative you are considering is probably already listed with the reason it was rejected. If it genuinely is wrong, change it **and** add an ADR row saying why. Don't silently diverge; the traceability is the point.
