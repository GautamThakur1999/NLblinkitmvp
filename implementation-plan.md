# Implementation Plan — Blinkit Category Expansion

**Status:** v1
**Upstream:** [`context.md`](context.md) · [`architecture.md`](architecture.md) · [`edge.md`](edge.md) · [`docs/01-problem-statement.md`](docs/01-problem-statement.md) · [`docs/06-mvp-concept.md`](docs/06-mvp-concept.md) · [`docs/07-demo-journey.md`](docs/07-demo-journey.md)
**Purpose:** Every task required to ship all four parts, with explicit traceability so nothing in the upstream documents is dropped.

---

## The core product requirement

> **Selecting a product must lead to a recommendation from a *different* category, purchasable in one tap.**

This is not one feature among several — it is the MVP. Everything in Phases 10–13 exists to make this single interaction correct, fast, safe, and measurable. Stated as an invariant the build must satisfy:

| # | Invariant | Enforced by |
|---|---|---|
| **INV-1** | Product selection (add-to-cart) is the **only** trigger | P11-23 |
| **INV-2** | Every suggestion is from a **different L1** than the anchor | P11-2 (R1) |
| **INV-3** | Every suggestion is a category the user has **never purchased** | P11-4 (R3) |
| **INV-4** | Every suggestion carries a **reason**, drawn from a validated fact set | P10-3, P10-5 |
| **INV-5** | Every suggestion is **purchasable in one tap** from the surface | P12-2 |
| **INV-6** | The surface **never blocks** the cart flow | P12-2, P12-5 |
| **INV-7** | Sensitive anchors produce **no suggestion at all** | P11-1 |

**If any invariant fails, the MVP does not meet the brief** — INV-2 and INV-3 in particular, since a same-category or already-purchased suggestion contributes nothing to CER.

> **Evidential note.** The premise that discovery is a live problem in user discourse is currently a **prior**, not a finding. Phase 1 must test it — see P5-7. If the corpus does not support it, that is reported, not quietly dropped (`architecture.md` §10).

---

## 0. How to use this plan

### Conventions

- **Task IDs** are `P<phase>-<n>` and stable. Reference them in commits.
- **Covers** column maps each task to the upstream requirement it satisfies — edge-case IDs (`EC-*`), hard rules (`R1`–`R8`), brief questions (`Q1`–`Q8`), validation checks (`V4.1`–`V4.8`).
- **Size:** S ≈ under an hour · M ≈ half a day · L ≈ 1–2 days.
- **Gate** tasks block everything downstream until they pass.

### Completeness guarantee

§14 maps **all 97 edge cases** from `edge.md` to an owning task and a verifying test. §15 maps every explicit brief requirement from `context.md` §5. §16 maps the four demo flows and seven invariants from `docs/07-demo-journey.md`. If a row has no owner, the plan is incomplete — that is the check to run against this document.

### Critical path

```
P0 (foundation) ──┬── P8 (research kit) ──► interviews (CALENDAR-BLOCKING) ──► P9 ──┐
                  │                                                                 │
                  └── P1..P6 (engine) ──► P7 (explorer) ─────────────────────────────┤
                                                                                     │
                       P10..P13 (MVP) ──► P14 (deploy) ──► P15 (submission) ◄────────┘
```

**P8 ships first.** It is the only task whose duration is set by other people's calendars. Everything else is bounded by build time.

---

## Phase 0 — Foundation

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P0-1** | Initialise repo; set **repo-local** `git config user.name` / `user.email` to neutral values **before the first commit** | Clean git history with no personal identifiers | EC-P4 | S |
| **P0-2** | Verify `.gitignore` blocks `.env*`, `.claude/settings.local.json`, `desktop.ini`, `data/raw/` | — | EC-P4 | S |
| **P0-3** | Create `.vercelignore` excluding `engine/`, `data/raw/` | Python never enters the Vercel build | EC-P2 | S |
| **P0-4** | Scaffold Next.js 15 + TypeScript + Tailwind at repo root | Bootable app | — | M |
| **P0-5** | Scaffold Python 3.12 engine package with `pyproject.toml`, pinned deps | `engine/` importable | — | M |
| **P0-6** | Write `.env.example` with variable **names only** — no values | Wiring in place, secrets absent | EC-P1 | S |
| **P0-7** | `engine/config.py` + `lib/models.ts` — single source for model IDs, thresholds, budgets | No magic numbers anywhere else | — | S |
| **P0-8** | ⚠️ **Replace stale model IDs.** `engine/config.py` and `lib/models.ts` currently specify `llama3-8b-8192`, `llama3-70b-8192` (decommissioned on Groq) and `gemini-1.5-flash` / `gemini-1.5-pro` (legacy). **Every live call will fail.** Verify against current provider docs and update both files | Working IDs | — | S |
| **P0-8b** | Record the local-embedding deviation — `BAAI/bge-small-en-v1.5` via sentence-transformers replaces Gemini embeddings. Free, offline, no quota risk. Update `architecture.md` §2.1 | Documented deviation | — | S |
| **P0-9** | Boot-safety: app serves with **no** env vars set, degrading to precomputed-only | Never crashes on missing key | EC-P1 | S |
| **P0-10** | Structured logging + run-ID tagging in both systems | Traceable runs | — | S |

> **P0-1 is irreversible if missed.** Commit author metadata cannot be cleanly rewritten once pushed. Do it first.

---

## Phase 1 — Engine: ingestion

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P1-1** | Play Store scraper — Blinkit package, paginated, newest + most-relevant sort | Raw JSON | EC-G14 | M |
| **P1-2** | App Store RSS scraper — kept as a **separate source**, not merged | Raw JSON | EC-G14 | M |
| **P1-3** | Reddit reader — subreddit list per `architecture.md` §3.1; **comments as individual documents**, not concatenated threads | Raw JSON | EC-G7 | M |
| **P1-4** | Forum/social curated export loader with per-document provenance | Raw JSON, tier-flagged | — | S |
| **P1-5** | **Competitor corpus** — Zepto + Instamart, identical method | Control corpus | EC-G16 | M |
| **P1-6** | Rate-limit handling, retry with backoff, **partial-run recording** | Per-source counts in manifest | EC-G1 | M |
| **P1-7** | Explicit app/package ID verification assertion | Fails loudly on wrong app | EC-G14 | S |
| **P1-8** | Robots/ToS compliance check; public data only | Documented in report | — | S |

**Phase DoD:** raw corpus on disk; manifest records actual per-source counts including zeros; no run silently presents partial data as complete.

---

## Phase 2 — Engine: conditioning

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P2-1** | Normalise all sources into the `Document` schema (`architecture.md` §5.1) | `documents.jsonl` | — | M |
| **P2-2** | **PII scrubber** — phone numbers, emails, addresses, order IDs. Runs *before* persistence and before any model call | Scrubbed corpus | **EC-G8** | M |
| **P2-3** | Hash author identifiers at ingest; cleartext never written | — | EC-G8 | S |
| **P2-4** | MinHash/LSH near-duplicate detection; **collapse with count retained**, never delete | `duplicate_count` populated | EC-G5 | M |
| **P2-5** | Bot / incentivised-review heuristics — duplicate text, timing clusters, generic 5-star. **Flag, do not delete**; report estimated share | Flagged corpus | EC-G15 | M |
| **P2-6** | Language detection + Hinglish/Devanagari translation. **`text_original` never overwritten** | `text_english` populated | EC-G10 | M |
| **P2-7** | Minimum-content filter (emoji-only, "good", "bad"). **Tag and count, never silently drop** | Tagged | EC-G6 | S |
| **P2-8** | Relevance tagger (Groq, fast model) — tags only, no dropping | `relevance_tags` | — | M |
| **P2-9** | Temporal distribution check — flag themes concentrated in a single window as events, not patterns | Temporal report | EC-G13 | M |
| **P2-10** | Unicode + whitespace normalisation utility, **used identically on both sides of quote verification** | Shared function | EC-G9 | S |

> **P2-10 is small and load-bearing.** If normalisation differs between the quote and the source, V4.1 produces false hallucination flags — which would discredit valid insights as badly as missing real ones.

---

## Phase 3 — Engine: embedding & clustering

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P3-1** | Gemini embedding of `text_english ?? text_original`, batched with retry | Vectors | — | M |
| **P3-2** | UMAP dimensionality reduction | Reduced vectors | — | S |
| **P3-3** | HDBSCAN clustering — **no `k`**, explicit noise class | `clusters.json` | — | M |
| **P3-4** | Corpus-size sufficiency gate. Below threshold → **report the limitation, do not lower thresholds** | Gate | **EC-G2** | S |
| **P3-5** | Degenerate-clustering detection — single giant cluster, or majority-noise | Warning + report | EC-G3, EC-G4 | S |
| **P3-6** | **Parameter change log** — every UMAP/HDBSCAN tuning recorded in the manifest | Audit trail | **EC-G3** | S |
| **P3-7** | Bootstrap harness — N runs at 80% subsample, varied seeds | Stability inputs | — | M |
| **P3-8** | Cross-run theme matching by **centroid similarity**, not index | Persistence scores | EC-G12 | M |

> **P3-6 exists to prevent p-hacking.** Tuning parameters until themes look convincing is the easiest way to fabricate a result while feeling rigorous. The log makes it visible.

---

## Phase 4 — Engine: theme labelling

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P4-1** | Representative-document selection per cluster (medoid + stratified sample) | Prompt inputs | — | S |
| **P4-2** | Labeller A — Groq, independent, no sight of B | Candidate labels | — | M |
| **P4-3** | Labeller B — Gemini, independent, no sight of A | Candidate labels | — | M |
| **P4-4** | Both candidates preserved in `themes.json`; neither discarded | Audit trail | — | S |
| **P4-5** | Agreement scoring (κ-analogue); divergent clusters **escalated to manual review**, never auto-resolved | `agreement_score` | V4.5 | M |
| **P4-6** | Theme tagging vocabulary — `habit`, `barrier`, `discovery-channel`, `information-gap`, `frustration` | Tagged themes | Q1–Q8 | S |
| **P4-7** | Source-entropy computation per theme | `source_entropy` | V4.3 | S |

---

## Phase 5 — Engine: synthesis

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P5-1** | Gemini Pro synthesis over themes → `Insight` objects | Draft insights | — | L |
| **P5-2** | **Schema gate** — reject at parse time any insight with <3 distinct `document_id`s, missing quotes, missing confidence, or missing falsifier | Enforced contract | — | M |
| **P5-3** | `document_id` existence validation — non-existent citation is **fabrication, hard fail** | Quarantine | **EC-G11** | S |
| **P5-4** | Brief-question mapping (`answers_brief_question`), answered **from artifacts**, never by re-prompting raw text | Q1–Q8 answered traceably | Q1–Q8 | M |
| **P5-5** | Insight ranking: frequency × source diversity × persistence | Ranked output | Q8 | S |
| **P5-6** | Brand segregation — never aggregate Blinkit and competitor documents without an explicit flag | Clean findings | **EC-G16** | S |
| **P5-7** | **Discovery-prior test** — quantify how much of the corpus actually concerns category discovery vs delivery/pricing/app issues. Report the share honestly, including if it is small | Evidence for (or against) the premise | — | M |

> **P5-7 tests the project's founding premise.** The MVP is built on the belief that discovery is a real problem in user discourse. If the corpus shows users overwhelmingly discuss delivery and pricing instead, that is a finding worth reporting — and per `architecture.md` §10 it *supports* the mental-model thesis (Loop E: users don't discuss discovery because they don't think of Blinkit that way). Either result is publishable. Silently omitting the measurement is not.

---

## Phase 6 — Engine: validation subsystem ⭐ **GATE**

> `context.md` §5 flags this as where the marks are. It is a first-class subsystem with its own artifacts, and it must be **able to fail the run**.

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P6-1** | **V4.1 Groundedness** — verbatim string match of every quote against `text_original`, using P2-10 normalisation. **Target 100%** | `validation.json` | EC-G9, EC-G10 | M |
| **P6-2** | **V4.2 Coverage** — % of relevant documents in a named theme; noise reported honestly | — | EC-G4 | S |
| **P6-3** | **V4.3 Source diversity** — Shannon entropy per insight; low-entropy insights **flagged in the UI, not hidden** | — | — | M |
| **P6-4** | **V4.4 Stability** — bootstrap persistence from P3-7/P3-8 | — | EC-G12 | M |
| **P6-5** | **V4.5 Cross-model agreement** — κ-analogue from P4-5 | — | — | S |
| **P6-6** | **V4.6 Human spot-check** — stratified ~50-doc sample, hand-coded **blind**, compared. Include code-mixed docs deliberately | `qa/human_sample.json` | — | L |
| **P6-7** | **V4.7 Adversarial negative control** — request evidence for a theme known absent. Manufacturing support **invalidates the entire run** | Pass/fail | — | M |
| **P6-8** | **V4.8 Confounder control** — competitor-corpus comparison | — | EC-G16 | M |
| **P6-9** | Validation report generator — machine-readable + human-readable | `validation.json` | — | M |
| **P6-10** | Quarantine path — failed insights written to `qa/failures.json` **with reasons**, not deleted | Audit trail | — | S |

**Gate condition:** V4.1 at 100% and V4.7 passing. Either failing blocks Phase 7.

---

## Phase 7 — Insights Explorer

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P7-1** | Static generation from committed artifacts — **no live API dependency** | `/insights` | — | M |
| **P7-2** | Insight → theme → document drill-through with verbatim quotes | Full traceability | — | M |
| **P7-3** | Validation scorecard page — all eight checks, including failures | Honest reporting | — | M |
| **P7-4** | Single-source / low-confidence badges rendered visibly | — | V4.3 | S |
| **P7-5** | Eight-question view — each brief question with its supporting evidence | Q1–Q8 | Q1–Q8 | M |
| **P7-6** | Artifact size management — ship only current run to client | — | EC-P3 | S |
| **P7-7** | `docs/02-discovery-engine-report.md` — method, themes, insights, validation, limitations | **Part 1 deliverable** | — | L |

---

## Phase 8 — Research kit ⏱ **START FIRST**

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P8-1** | Screener — targets Segment A (high-frequency, low-breadth) per `docs/01-problem-statement.md` §6 | Recruitment tool | — | M |
| **P8-2** | Discussion guide written to **falsify** the evaluation-cost thesis, not confirm it | Interview guide | — | L |
| **P8-3** | Questions covering the five invalidation conditions in `docs/06-mvp-concept.md` §8 | — | — | M |
| **P8-4** | Concept-reaction protocol for the Occasion Engine mechanic — trigger timing, reason value, occasion plausibility | — | — | M |
| **P8-5** | Note-taking template using participant codes `P1`–`P6`, never names | — | — | S |
| **P8-6** | Synthesis framework + AI-vs-primary reconciliation template | — | — | M |
| **P8-7** | Publish as `docs/03-research-kit.md` | **Part 2 deliverable** | — | S |

> **Ship P8 before starting Phase 1.** Recruiting is the only thing in this project that cannot be compressed by working harder.

---

## Phase 9 — Reconciliation

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P9-1** | Code interview notes against engine themes | — | — | M |
| **P9-2** | **AI-vs-primary table** — what held, what broke, **what neither method saw** | Honest reconciliation | — | M |
| **P9-3** | Resolve assumptions A1–A8 from `docs/01-problem-statement.md` §10 | Updated register | — | M |
| **P9-4** | Final problem definition — segment, root cause, workarounds, user value, business value | `docs/05-problem-definition.md` — **Part 3 deliverable** | — | L |
| **P9-5** | `docs/04-research-synthesis.md` | **Part 2 deliverable** | — | M |
| **P9-6** | Feed findings back into the occasion set and copy | Revised P10-3 inputs | — | M |

---

## Phase 10 — MVP data layer

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P10-1** | Synthetic catalogue, 200–400 SKUs across L1s — brand, pack, price, **stock state**, fit attributes | `data/catalogue/` | EC-P5 | L |
| **P10-2** | **Dietary/veg flags** on every food SKU | Enables EC-S6 filter | **EC-S6** | M |
| **P10-3** | **Curated fact set** — every reason written and **human-reviewed offline**. The runtime model selects; it never authors | `data/facts/` | **EC-M4, EC-M5, R6** | L |
| **P10-4** | Occasion map generation (Gemini, offline) across the catalogue | `data/occasions/` | — | L |
| **P10-5** | Human review pass over every generated occasion and reason | Approved map | **EC-M4** | L |
| **P10-6** | **Sensitive-category denylist** — pregnancy/fertility, contraceptive/intimate, pharma-as-suggestion, weight-loss | `lib/denylist.ts` | **EC-S1, S2, S3, S7** | M |
| **P10-7** | Headline review against the "describes the basket, not the person" test | Approved copy | **EC-S10** | M |
| **P10-8** | Neutral-tone copy audit — no exclamation marks, no celebratory language | — | **EC-S11** | S |
| **P10-9** | Version hashes on catalogue and occasion map | Mismatch detection | EC-D2 | S |
| **P10-10** | Seasonal validity windows + region tags on occasions | — | EC-D8, EC-D9 | M |
| **P10-11** | Precompute catalogue embeddings as a static artifact | — | — | M |
| **P10-12** | **Persona A fixture** — 23 orders, 3 L1s (Staples, Dairy, Snacks). The Segment A user from `docs/07-demo-journey.md` §2 | Enables R3, INV-3 | DF-A | M |
| **P10-13** | **Persona B fixture** — already purchases Home & Office, to demonstrate R3 suppression | Enables DF-D | DF-D | S |
| **P10-14** | **Hero adjacency set** — Staples anchor → Home & Office + Cleaning, two distinct new L1s, both reasons teaching rather than selling | The demo's core moment | DF-A, INV-2 | M |
| **P10-15** | **Multi-item occasion fixtures** — combinations (paneer + cream + naan) with no single-SKU precomputed entry, forcing live inference | Proves AI-native claim | DF-B | M |
| **P10-16** | **Sensitive-anchor fixtures** — pregnancy test and contraceptive SKUs present in the catalogue *specifically so the block can be demonstrated* | Enables DF-C | DF-C, EC-S1 | S |

> **P10-3 and P10-5 are the largest items in the MVP and the ones most likely to be cut under time pressure. They must not be.** They are the sole control against a confidently wrong safety claim reaching a user.

---

## Phase 11 — MVP core logic

All of this is **deterministic, unit-tested code** — not prompts.

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P11-1** | **Denylist check — runs before any model call** | Hard block | **EC-S1, S2, S3, S7** | M |
| **P11-2** | **R1** — suggestion L1 ≠ anchor L1 | Filter | R1, **EC-M1** | S |
| **P11-3** | **R2** — max 2 suggestions, never a rail | Cap | R2 | S |
| **P11-4** | **R3** — suppress already-purchased L1 | Filter | R3, EC-E4 | M |
| **P11-5** | **R4** — suppress out-of-stock | Filter | R4, EC-E5 | S |
| **P11-6** | **R5** — once-per-session frequency cap | Guard | R5 | S |
| **P11-7** | **R7** — no price-led framing anywhere in copy | Lint | R7 | S |
| **P11-8** | **R8** — 300ms budget; abandon rather than delay | Timer | R8, EC-L1 | M |
| **P11-9** | Catalogue-ID validation on every suggested SKU | Drop unmatched | **EC-M2, EC-D1** | S |
| **P11-10** | Anchor-exclusion filter | — | EC-M11 | S |
| **P11-11** | Cart-contents exclusion filter | — | EC-M12 | S |
| **P11-12** | Dedup by SKU **and by L1** | — | EC-M10 | S |
| **P11-13** | Price-ratio cap vs anchor | — | EC-D4 | S |
| **P11-14** | Live price read at render; never cached | — | EC-D3 | S |
| **P11-15** | Version-hash mismatch → **disable feature entirely** | Kill switch | EC-D2 | S |
| **P11-16** | Purchase-history availability check → suppress if absent or stale | — | EC-D5, EC-D6 | M |
| **P11-17** | Store/pincode assortment filter | — | EC-D7 | M |
| **P11-18** | Baby & pet adjacency **60-day decay**, no auto-resume | — | **EC-S4, EC-S5** | M |
| **P11-19** | Vegetarian-basket inference; ambiguity → more restrictive default | — | **EC-S6** | M |
| **P11-20** | No allergy-tolerance claims in any reason | Copy rule | EC-S8 | S |
| **P11-21** | In-session only; no persistent trace of the anchor purchase | — | **EC-S9** | M |
| **P11-22** | Seasonal/regional time-gating at render | — | EC-D8, EC-D9 | S |
| **P11-23** | Trigger guards: debounce 800ms · no re-fire on qty · **no recursive fire** · suppress at checkout · suppress for first-order users · suppress after 3 dismissals · discard on navigation | Trigger module | **EC-T2, T3, T4, T5, T6, T7, T9, T10** | L |
| **P11-24** | Anchor-removal invalidation — dismiss sheet | — | EC-T1 | S |
| **P11-25** | Live inference route with schema validation, one retry, then fallback | `/api/occasion` | EC-M3 | M |
| **P11-26** | Explicit model-refusal detection → no suggestion, never surface the refusal | — | **EC-M8** | S |
| **P11-27** | Reason length validation — **drop, never truncate** | — | EC-M6 | S |
| **P11-28** | Injection guard — delimit, length-cap, render as text only | — | **EC-M9** | M |
| **P11-29** | Full degradation ladder: live → fallback provider → precomputed → nothing | — | **EC-L1–L4, EC-L6, EC-L7** | M |
| **P11-30** | Precomputed path served without function invocation | Cold-start immunity | EC-L5 | M |
| **P11-31** | Rate limiting per session and per IP; token caps; spend ceiling | — | **EC-B1, B2, B3** | M |
| **P11-32** | Silent no-op paths for every empty case | — | **EC-E1, E2, E3, E6** | S |

---

## Phase 12 — MVP interface

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P12-1** | Cart simulator shell — **Home** (ETA banner, search, Order Again rail, category grid), **category listing**, **PDP**, **cart**. Screens 1, 2, 3, 6 of `docs/07-demo-journey.md` §9 | Demo shell | DF-A | L |
| **P12-2** | **Discovery rail** — 320px, sticky, **always occupied** (persona panel when idle) so a suggestion causes no layout shift. Desktop equivalent of the non-blocking sheet | Core UI | R8, INV-6 | L |
| **P12-2b** | **Tailwind config generated from Stitch `DESIGN.md` tokens** — colours, Inter scale, spacing, radius, elevation | Design system | — | M |
| **P12-2c** | Port Stitch product card, occasion chip, `Why this?` and Discovery Nudge components | Component library | — | M |
| **P12-3** | Anatomy per `docs/06-mvp-concept.md` §3.3 — occasion headline, per-item reason | — | AD-11 | M |
| **P12-4** | `aria-live="polite"` — announce, **never steal focus** | — | **EC-A1** | S |
| **P12-5** | Never obscure cart button or bottom nav | — | **EC-A3** | M |
| **P12-6** | `prefers-reduced-motion` support | — | EC-A2 | S |
| **P12-7** | Reflow at 200% zoom / large system font | — | EC-A4 | M |
| **P12-8** | Two suggestions fit small viewports without internal scroll | — | EC-A5 | M |
| **P12-9** | Dark mode | — | EC-A6 | M |
| **P12-10** | Suppress while keyboard open | — | EC-A7 | S |
| **P12-11** | Landscape reflow or suppression | — | EC-A8 | S |
| **P12-12** | Reason line meets WCAG AA — **not styled as de-emphasised secondary text** | — | **EC-A9** | S |
| **P12-13** | Animation cancellation on rapid re-fire | — | EC-T8 | S |
| **P12-14** | Persistent visible **"demo data"** label | — | **EC-P5** | S |
| **P12-15** | No byline, no identifying page metadata or `<title>` | — | **EC-P4** | S |

### Demo-journey screens

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P12-16** | **Order Again rail on Home** — prominent, exactly as in the real app | Shows the anti-discovery mechanism in its natural habitat before the fix is demonstrated | DF-A | M |
| **P12-17** | **Deliberately sparse PDP** — price, pack size, ADD. **No ratings, no reviews, no fit guidance** | The PDP's emptiness *is* the evidence for `docs/01-problem-statement.md` §3.5 | DF-A | M |
| **P12-18** | **Persona panel** — orders, L1s purchased, L1s never purchased. Visible throughout | Evaluator sees *why* a suggestion is new-category without being told | DF-A, DF-D | M |
| **P12-19** | **Persona switcher + demo reset** | Enables DF-D; repeatable runs | DF-D | M |
| **P12-20** | **Discovery Hub as opt-in expansion** — Stitch's hub screen, reached only from `⌄ more for this` in the rail, **never from navigation**. Strip the progress meter and discounted bundle; all items cross-L1 | `docs/08-design-integration.md` §6 | DF-A | M |
| **P12-23** | **No star ratings anywhere** — their absence is the problem statement's §3.5 argument | Design integrity | — | S |
| **P12-24** | **No gamification** — no progress meters, no explored-percentage, no badges | `docs/01-problem-statement.md` §7 | — | S |
| **P12-25** | **No discount-led framing** in any discovery surface | R7 | R7 | S |
| **P12-21** | **One-tap ADD on every suggestion**, no intermediate screen | **INV-5** | INV-5 | S |
| **P12-22** | Add-from-listing and add-from-PDP both trigger identically | INV-1 consistency | INV-1 | S |

> **P12-17 is an argument, not an oversight.** The demo PDP is sparse because the real one is. An evaluator who notices its emptiness has understood the problem statement without being told.

---

## Phase 13 — Instrumentation

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P13-1** | Impressions logged **on render, not on request** | Correct denominator | **EC-X7** | M |
| **P13-2** | Add-rate, and **new-L1 add rate** per user | CER contribution | — | M |
| **P13-3** | Adds reversed on cart removal, cancellation, return | — | **EC-X1, X2, X3** | M |
| **P13-4** | Discount-adjusted exclusion from CER | — | EC-X4 | S |
| **P13-5** | **Holdout group** for causal attribution | Honest measurement | **EC-X5** | M |
| **P13-6** | L1 counted once per order | — | EC-X6 | S |
| **P13-7** | Delayed-attribution window defined and applied | — | EC-X8 | M |
| **P13-8** | C60 tracking scaffold | `context.md` §3 | — | M |
| **P13-9** | Per-occasion precision reporting | Prune weak adjacencies | — | M |
| **P13-10** | **Reason-lift A/B toggle** — with reason vs product-only | Tests the core thesis | — | M |
| **P13-11** | Guard-metric panel — time-to-checkout, dismissal rate | — | — | M |
| **P13-12** | Visible evaluator metrics panel | Makes logic legible in a 2-min review | — | M |
| **P13-13** | **`Categories: N → N+1` counter** in the metrics panel | The single most legible expression of CER in a demo | DF-A | S |
| **P13-14** | **Debug / trigger log panel** — shows every decision including blocks and silent no-ops, with the governing EC ID | **Makes DF-C and DF-D visible.** A no-op is invisible without it | **DF-C, DF-D** | M |
| **P13-15** | Measured (not hardcoded) render time displayed against the 300ms R8 budget | Demo integrity | R8 | S |
| **P13-16** | Network-call counter — surfaces 0 calls on the precomputed path, 1 on live | Makes the hybrid architecture visible in seconds | DF-B | S |

> **P13-14 is what makes restraint demonstrable.** Flow C's entire value is that *nothing happens* — and nothing happening is indistinguishable from a broken feature unless the log shows the block was deliberate, with the rule that caused it.

> **P13-10 is the single most valuable experiment in the project.** It isolates the one claim everything else rests on. If the reason produces no lift, the evaluation-cost diagnosis is wrong and the submission should say so.

---

## Phase 14 — Deployment

| ID | Task | Output | Covers | Size |
| --- | --- | --- | --- | --- |
| **P14-1** | **Resolve repo-ownership anonymity decision** (`context.md` §6.1) | Decision | **EC-P4** | — |
| **P14-2** | Neutral Vercel project name → neutral subdomain | — | EC-P4 | S |
| **P14-3** | Set Groq + Gemini keys in Vercel dashboard only | — | — | S |
| **P14-4** | Verify build excludes `engine/` | — | EC-P2 | S |
| **P14-5** | Verify app boots with env vars **absent** | — | EC-P1 | S |
| **P14-6** | Production smoke test of all four degradation tiers | — | EC-P6 | M |
| **P14-7** | **Final anonymity sweep** — commit metadata, page metadata, artifacts, demo data, subdomain | Verified clean | **EC-P4** | M |
| **P14-8** | Load/rate-limit check against the public URL | — | EC-B3 | S |

> **P14-1 blocks first push.** Unresolved as of this plan.

---

## Phase 15 — Submission package

| ID | Task | Output | Size |
| --- | --- | --- | --- |
| **P15-1** | Part 1 writeup — gathering, theming, insight generation, **validation** | `docs/02-discovery-engine-report.md` | L |
| **P15-2** | Part 2 — kit + synthesis | `docs/03`, `docs/04` | M |
| **P15-3** | Part 3 — problem definition + reconciliation | `docs/05-problem-definition.md` | M |
| **P15-4** | Part 4 — MVP writeup + live URL | — | M |
| **P15-5** | Honest limitations section — synthetic catalogue, no internal data, pre-research concept lock, curated-not-generated reasons | — | M |
| **P15-6** | README tying all four parts together | — | M |

---

## 14. Edge-case coverage matrix

All 97 cases from [`edge.md`](edge.md). **Every row has an owner.**

### Sensitive categories (S1 — 11)

| EC | Owner | Verified by |
| --- | --- | --- |
| EC-S1 pregnancy/fertility | P10-6, P11-1 | `test_EC_S1_no_adjacency_pregnancy` |
| EC-S2 contraceptive/intimate | P10-6, P11-1 | `test_EC_S2_no_adjacency_intimate` |
| EC-S3 pharma never a suggestion | P10-6, P11-1 | `test_EC_S3_pharma_anchor_only` |
| EC-S4 baby decay 60d | P11-18 | `test_EC_S4_baby_decay` |
| EC-S5 pet decay 60d | P11-18 | `test_EC_S5_pet_decay` |
| EC-S6 dietary/religious | P10-2, P11-19 | `test_EC_S6_veg_basket` |
| EC-S7 weight-loss block | P10-6, P11-1 | `test_EC_S7_no_diet_from_food` |
| EC-S8 allergy claims | P11-20 | Copy review |
| EC-S9 shared account | P11-21 | `test_EC_S9_no_persistence` |
| EC-S10 headline assumes life | P10-7 | Copy review |
| EC-S11 neutral tone | P10-8 | Copy lint |

### Trigger (10)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-T1 anchor removed | P11-24 | | EC-T6 checkout | P11-23 |
| EC-T2 qty change | P11-23 | | EC-T7 first order | P11-23 |
| EC-T3 rapid adds | P11-23 | | EC-T8 animation | P12-13 |
| EC-T4 recursive fire | P11-23 | | EC-T9 3 dismissals | P11-23 |
| EC-T5 Order Again | P11-23 | | EC-T10 navigated away | P11-23 |

### Empty states (6)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-E1 no occasion | P11-32 | | EC-E4 power user | P11-4 |
| EC-E2 all filtered | P11-32 | | EC-E5 all OOS | P11-5 |
| EC-E3 only one | P11-32 | | EC-E6 unmapped SKU | P11-32 |

### Data integrity (9)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-D1 delisted SKU | P11-9 | | EC-D6 stale history | P11-16 |
| EC-D2 version mismatch | P10-9, P11-15 | | EC-D7 pincode | P11-17 |
| EC-D3 price drift | P11-14 | | EC-D8 off-season | P10-10, P11-22 |
| EC-D4 price gap | P11-13 | | EC-D9 wrong region | P10-10, P11-22 |
| EC-D5 no history | P11-16 | | | |

### Latency & failure (7)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-L1 budget blown | P11-8, P11-29 | | EC-L5 cold start | P11-30 |
| EC-L2 provider timeout | P11-29 | | EC-L6 network drop | P11-29 |
| EC-L3 all inference down | P11-29 | | EC-L7 slow connection | P11-29 |
| EC-L4 map load fail | P11-29 | | | |

### Model failure (12)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-M1 same L1 | P11-2 | | EC-M7 wrong language | P10-5 |
| EC-M2 hallucinated SKU | P11-9 | | EC-M8 refusal | P11-26 |
| EC-M3 bad JSON | P11-25 | | EC-M9 injection | P11-28 |
| EC-M4 wrong fact | **P10-3, P10-5** | | EC-M10 duplicates | P11-12 |
| EC-M5 offensive reason | **P10-3, P10-5** | | EC-M11 suggests anchor | P11-10 |
| EC-M6 length | P11-27 | | EC-M12 already in cart | P11-11 |

### Metric integrity (8)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-X1 removed pre-checkout | P13-3 | | EC-X5 organic attribution | P13-5 |
| EC-X2 cancelled | P13-3 | | EC-X6 duplicate L1 | P13-6 |
| EC-X3 returned | P13-3 | | EC-X7 impression logging | P13-1 |
| EC-X4 discounted | P13-4 | | EC-X8 delayed purchase | P13-7 |

### Accessibility (9)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-A1 screen reader | P12-4 | | EC-A6 dark mode | P12-9 |
| EC-A2 reduced motion | P12-6 | | EC-A7 keyboard open | P12-10 |
| EC-A3 obscures cart | P12-5 | | EC-A8 landscape | P12-11 |
| EC-A4 large font | P12-7 | | EC-A9 contrast | P12-12 |
| EC-A5 small viewport | P12-8 | | | |

### Abuse & cost (3)

| EC | Owner |
|---|---|
| EC-B1 bot spam · EC-B2 cost runaway · EC-B3 public hammering | P11-31, P14-8 |

### Discovery engine (16)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-G1 source blocked | P1-6 | | EC-G9 normalisation | P2-10, P6-1 |
| EC-G2 corpus too small | P3-4 | | EC-G10 translation quotes | P2-6, P6-1 |
| EC-G3 one giant cluster | P3-5, P3-6 | | EC-G11 fake doc ID | P5-3 |
| EC-G4 majority noise | P3-5, P6-2 | | EC-G12 cluster matching | P3-8 |
| EC-G5 duplicate inflation | P2-4 | | EC-G13 event vs pattern | P2-9 |
| EC-G6 trivial content | P2-7 | | EC-G14 wrong app | P1-7 |
| EC-G7 long threads | P1-3 | | EC-G15 fake reviews | P2-5 |
| EC-G8 PII | **P2-2, P2-3** | | EC-G16 competitor bleed | P5-6, P6-8 |

### Deployment (6)

| EC | Owner | | EC | Owner |
| --- | --- | --- | --- | --- |
| EC-P1 missing env | P0-9, P14-5 | | EC-P4 identity leak | **P0-1, P12-15, P14-7** |
| EC-P2 Python in build | P0-3, P14-4 | | EC-P5 demo data label | P12-14 |
| EC-P3 artifact size | P7-6 | | EC-P6 demo breaks | P14-6 |

---

## 15. Brief-requirement traceability

| `context.md` §5 requirement | Owning tasks |
| --- | --- |
| App Store reviews | P1-2 |
| Play Store reviews | P1-1 |
| Reddit discussions | P1-3 |
| Community forums | P1-4 |
| Social media conversations | P1-4 |
| Product reviews | P1-1, P1-2 |
| Quick-commerce discussions | P1-3, P1-5 |
| **Q1** repeat same categories | P4-6, P5-4 |
| **Q2** what prevents exploration | P4-6, P5-4 |
| **Q3** how users discover today | P4-6, P5-4 |
| **Q4** role of habits | P4-6, P5-4 |
| **Q5** information needed | P4-6, P5-4 |
| **Q6** recurring frustrations | P4-6, P5-4, P5-5 |
| **Q7** segments that experiment | P5-4 |
| **Q8** unmet needs | P5-4, P5-5 |
| Demonstrate **gathering & analysis** | P7-7, P15-1 |
| Demonstrate **theme identification** | P3-3, P4-*, P7-7 |
| Demonstrate **insight generation** | P5-*, P7-7 |
| Demonstrate **insight validation** | **P6-* (all), P7-3** |
| Part 2 — 5–6 interviews | P8-*, P9-5 |
| Part 3 — problem definition | P9-4 |
| Part 3 — validated/challenged AI insights | **P9-2** |
| Part 4 — functional MVP | P10–P13 |
| Part 4 — **deployed to production** | P14-* |

---

## 16. Demo-flow and invariant traceability

From [`docs/07-demo-journey.md`](docs/07-demo-journey.md). **The demo is a deliverable, not a presentation of one** — each flow has owning tasks and a verification step.

### The four flows

| Flow | Demonstrates | Owning tasks | Verified by |
| --- | --- | --- | --- |
| **DF-A — Hero** | Staples anchor → 2 new L1s with teaching reasons, precomputed, 0 network calls | P10-12, P10-14, P11-*, P12-1, P12-2, P12-3, P12-16, P12-17, P12-18, P12-20, P12-21, P13-13 | Manual walkthrough + `test_DF_A_hero_flow` |
| **DF-B — Live AI** | Multi-item cart → occasion inferred at runtime, no precomputed entry exists | P10-15, P11-25, P13-16 | `test_DF_B_multi_item_live` + network-tab check |
| **DF-C — Restraint** | Sensitive anchor → **nothing**, blocked before any model call | P10-16, P11-1, P13-14 | **Manual, mandatory** + `test_EC_S1_no_adjacency_pregnancy` |
| **DF-D — Suppression** | Already-purchased L1 → suppressed, because it cannot move CER | P10-13, P11-4, P12-19, P13-14 | `test_DF_D_r3_suppression` |

### The seven invariants

| Invariant | Owning tasks | Verified by |
| --- | --- | --- |
| **INV-1** Selection is the only trigger | P11-23, P12-22 | `test_INV1_trigger_source` |
| **INV-2** Suggestion is a different L1 | P11-2 | `test_INV2_cross_l1` |
| **INV-3** Suggestion is a never-purchased category | P11-4 | `test_INV3_new_category_only` |
| **INV-4** Every suggestion carries a validated reason | P10-3, P10-5, P11-27 | `test_INV4_reason_present_and_curated` |
| **INV-5** Purchasable in one tap | P12-21 | `test_INV5_one_tap_add` |
| **INV-6** Never blocks the cart flow | P12-2, P12-5, P11-8 | `test_INV6_non_blocking` |
| **INV-7** Sensitive anchors produce nothing | P11-1 | `test_INV7_sensitive_silence` |

> **INV-2 and INV-3 are the brief.** A suggestion that is same-category, or from a category the user already buys, contributes **zero** to CER. Everything else in the MVP is refinement; these two are the requirement itself.

### Demo integrity

| Requirement | Owner |
| --- | --- |
| "DEMO DATA" label always visible | P12-14 |
| Reset control, repeatable runs | P12-19 |
| Works fully with APIs down (DF-A is precomputed) | P11-29, P11-30 |
| Real measured timings, never hardcoded | P13-15 |
| No identifying metadata | P12-15, P14-7 |

---

## 17. Test plan

| Layer | Scope |
| --- | --- |
| **Unit** | Every filter R1–R8, denylist, decay, dietary inference, trigger guards. One test per EC ID in §14. |
| **Contract** | Schema validation on `Document`, `Theme`, `Insight`, occasion map. Version-hash mismatch. |
| **Golden** | Fixed corpus subset → expected clusters. Detects silent pipeline regressions. |
| **Adversarial** | V4.7 negative control. Injection attempts. Malformed model responses. |
| **Degradation** | All four tiers forced via fault injection. |
| **Accessibility** | Screen-reader pass, contrast audit, 200% zoom, reduced motion. |
| **Manual** | Every §1 sensitive case walked by hand. **These do not get automated-only coverage.** |
| **Demo flows** | DF-A through DF-D walked end-to-end before every deploy. DF-C is verified by *observing nothing happen* plus reading the trigger log. |
| **Invariants** | INV-1…INV-7 asserted in CI. A build violating INV-2 or INV-3 fails, since those are the brief itself. |

---

## 18. Go / no-go gates

| Gate | Condition | Blocks |
| --- | --- | --- |
| **G1** | P0-1 done — neutral git identity | First commit |
| **G2** | V4.1 groundedness = 100% | Phase 7 |
| **G3** | V4.7 negative control passes | Phase 7 — *failure invalidates the run* |
| **G4** | Every §1 sensitive case manually verified | Any demo |
| **G5** | P10-5 human review complete | MVP demo |
| **G6** | All four degradation tiers verified | Deploy |
| **G7** | P14-7 anonymity sweep clean | Submission |
| **G8** | P14-1 repo decision made | First push |
| **G9** | **All 7 invariants pass** (INV-1…INV-7) | Any demo — *these are the brief* |
| **G10** | **All 4 demo flows walked end-to-end**, including DF-C's silence | Submission |

---

## 19. Open items blocking work

| # | Item | Blocks | Owner |
| --- | --- | --- | --- |
| 1 | **Repo-ownership anonymity decision** (`context.md` §6.1) | P14-1, **first push only — not the build** | User |
| 2 | **Groq + Gemini API keys** | P2-6, P2-8, P4-2, P4-3, P5-*, P11-25. **Not** P1 scrapers, P10, P11 filters, P12, P13 | User |
| 3 | ~~Model IDs to pin~~ | ~~P0-8~~ | ✅ **Resolved 30 Jul 2026** — production IDs verified and set in both config modules |
| 4 | Interview recruitment | P9 | User — start after P8 |
| 5 | **Reddit API credentials** — client ID + secret from a registered Reddit app (separate from Groq/Gemini) | P1-3 | User |

### What is buildable *today*, with no keys at all

`P0` (all) · `P8` research kit · `P10-1`, `P10-2`, `P10-12`, `P10-13`, `P10-16` catalogue and fixtures · `P11` **every filter except P11-25** · `P12` entire UI · `P13` instrumentation · `P1-1`, `P1-2` Play/App Store scrapers.

That is the majority of the MVP. Keys gate the *engine's* language work and the single live-inference route — not the product.

---

## 20. Recommended order

1. **P0** — foundation, especially P0-1
2. **P8** — research kit, then start recruiting immediately
3. **P1 → P6** — engine, while interviews are being scheduled
4. **P10** — catalogue and fact set *(long, can run alongside P1–P6)*
5. **P7** — Insights Explorer
6. **P9** — reconciliation, once interviews land
7. **P11 → P13** — MVP
8. **P14 → P15** — deploy and package

> **Two items are consistently underestimated: P10-3/P10-5 (the curated fact set and its human review) and P6-6 (blind human coding).** Both are slow, neither is technically interesting, and both are the difference between a system that is rigorous and one that merely looks rigorous.

---

## 21. Thin-slice option

If time compresses, this is the smallest build that still satisfies the core requirement and demonstrates it end-to-end:

| Keep | Drop / defer |
| --- | --- |
| P0 foundation, P0-1 especially | Live inference (P11-25) — **DF-B deferred**, precomputed only |
| P10-12, P10-14, P10-16 — persona + hero set + sensitive SKUs | Persona B and DF-D (P10-13, P12-19) |
| P10-3, P10-5 — **curated fact set, never cut** | Expanded view (P12-20) |
| P11-1 denylist, P11-2 (R1), P11-4 (R3), P11-8 (R8) | Seasonal/regional gating (P11-22) |
| P12-1, P12-2, P12-17, P12-18, P12-21 | Most of Phase 13 except P13-13 and P13-14 |
| **DF-A and DF-C** | — |

**DF-C survives every cut.** A demo that shows the feature working but not the moments it refuses is a weaker submission than one showing both, even if the second has fewer features.

The thin slice still satisfies INV-1 through INV-7 — which is the actual bar.
