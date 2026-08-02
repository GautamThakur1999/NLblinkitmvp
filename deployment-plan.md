# Deployment Plan — Railway (backend) + Vercel (frontend)

**Status:** v2 — phased for agent execution
**Upstream:** [`architecture.md`](architecture.md) · [`implementation-plan.md`](implementation-plan.md) Phase 14 · [`edge.md`](edge.md) §11
**Format:** Same conventions as `implementation-plan.md`. Task IDs `DP-<phase>-<n>` are stable — use them in commits.

---

## How to execute this

Every task is marked with an owner:

| | Meaning |
|---|---|
| 🤖 | **Agent-executable.** File writes, commands, verification. Antigravity can complete these unattended. |
| 👤 | **Human-only.** Dashboard clicks, API keys, account decisions. An agent cannot and must not attempt these. |
| 🤖👤 | Agent prepares, human confirms or supplies a value. |

**Phases with a ⛔ gate block everything downstream until they pass.**

### Suggested Antigravity batching

| Batch | Give the agent | Stops because |
|---|---|---|
| 1 | `DP-1` + `DP-2` | Nothing blocks — pure file work + local verification |
| 2 | `DP-3` | Needs your repo-ownership decision |
| 3 | — | `DP-4` is dashboard-only, you do it |
| 4 | `DP-5` | Needs the Railway URL from you |
| 5 | — | `DP-6` is dashboard-only, you do it |
| 6 | `DP-7` + `DP-8` | Needs the Vercel URL from you |
| 7 | `DP-9` | Final sweep, agent-verifiable |

---

## DP-0 — The topology decision ⛔

**This must be settled before any file is written. It changes what gets built.**

`architecture.md` AD-1 defines the Python engine as an **offline batch pipeline that never runs in production**. Adding Railway is a deliberate departure — justified, because Vercel cannot run `sentence-transformers`, UMAP or HDBSCAN, and a pipeline run exceeds any serverless timeout. But *where the boundary sits* decides whether R8 survives.

| | **Split A — recommended** | **Split B** |
|---|---|---|
| **Vercel** | Next.js app **+ `/api/occasion`** | Next.js app only |
| **Railway** | Python engine service only | Python engine **+ live inference** |
| Hot-path hops | browser → Vercel → Groq | browser → Vercel → **Railway** → Groq |
| Added latency | none | **+40–200ms** |
| R8 (300ms) | achievable | **not achievable** |

**Split B budget:**

```
browser → Vercel function        40–80ms
Vercel   → Railway               15–200ms   ← the added hop
Railway  → Groq inference       180–400ms
return path                       30–60ms
                                ─────────
                          TOTAL  265–740ms   vs R8 ceiling of 300ms
```

p50 is borderline; p95 fails. Since `edge.md` EC-L1 abandons rather than delays an over-budget path, **Split B makes Flow B silently render nothing much of the time** — the demo looks broken while behaving exactly as specified.

**What survives either way:** the precomputed occasion map is bundled static, so **Flow A (the hero demo) makes zero network calls under both splits.** Only Flow B is at risk.

| ID | Task | Owner | DoD |
|---|---|---|---|
| **DP-0-1** | Choose Split A or Split B | 👤 | Decision recorded |
| **DP-0-2** | If Split B: add ADR row relaxing R8 for the live path to **600ms**, and pin Railway + Vercel to the same region | 🤖 | ADR present in `architecture.md` §9 |

> **Everything below assumes Split A.** For Split B, also apply §Appendix B.

---

## DP-1 — Repo packaging 🤖

All agent-executable. No credentials needed.

| ID | Task | Owner | Output | DoD |
|---|---|---|---|---|
| **DP-1-1** | Create `engine/pyproject.toml` (Appendix A.1) | 🤖 | Package metadata | `pip install -e ./engine` succeeds |
| **DP-1-2** | Create empty `engine/__init__.py` | 🤖 | — | `import engine.config` works |
| **DP-1-3** | Create `.python-version` containing `3.12` | 🤖 | — | File exists at repo root |
| **DP-1-4** | Create `engine/service/__init__.py` + `engine/service/main.py` (Appendix A.2) | 🤖 | FastAPI app | `uvicorn engine.service.main:app` boots |
| **DP-1-5** | Create `railway.json` (Appendix A.3) — **must bind `$PORT`** | 🤖 | Deploy config | Valid JSON; `startCommand` contains `$PORT` |
| **DP-1-6** | Verify `.vercelignore` excludes `engine/`, `data/raw/`, `stitch_*/` | 🤖 | — | All three present |
| **DP-1-7** | Add `.env.example` entries for every variable in DP-4-3 and DP-6-3 — **names only** | 🤖 | — | No values committed |

**Phase DoD:** repo builds locally as both a Next.js app and an installable Python package. No secrets added.

---

## DP-2 — Local verification 🤖

Catch here what is expensive to catch in production.

| ID | Task | Owner | Verification |
|---|---|---|---|
| **DP-2-1** | Python package installs | 🤖 | `pip install -e ./engine` → exit 0 |
| **DP-2-2** | Config resolves | 🤖 | `python -m engine.config` → prints manifest |
| **DP-2-3** | Service boots and healthchecks | 🤖 | `uvicorn engine.service.main:app --port 8000` then `curl localhost:8000/health` → `{"status":"ok"}` |
| **DP-2-4** | Auth rejects a missing token | 🤖 | `curl localhost:8000/config` → 401 |
| **DP-2-5** | Next.js production build passes | 🤖 | `npm run build` → exit 0 |
| **DP-2-6** | **App boots with zero env vars** (`EC-P1`) | 🤖 | Unset all keys, `npm run build && npm start` → 200, no crash |
| **DP-2-7** | Invariant tests pass (`G9`) | 🤖 | `npm test` → INV-1…INV-7 green |
| **DP-2-8** | Four degradation tiers verified by fault injection (`G6`) | 🤖 | All four behave per `architecture.md` §6.4 |

**Phase DoD:** every check green. **DP-2-6 is the one people skip** — if the app crashes without keys, `P0-9` isn't done and the Vercel deploy will fail in a confusing way.

---

## DP-3 — Anonymity gate and first commit ⛔

| ID | Task | Owner | DoD |
|---|---|---|---|
| **DP-3-1** | Resolve repo ownership (`context.md` §6.1) — private repo / new neutral account / public as-is | 👤 | Decision made |
| **DP-3-2** | Verify repo-local git identity | 🤖 | `git config --local user.name` → `Anonymous Analyst` |
| **DP-3-3** | Verify no global identity overrides it | 🤖 | `git config --global user.name` → empty, or local set |
| **DP-3-4** | Scan tracked files for identifiers | 🤖 | `git grep -inE 'gautam\|thakur\|thaku\|@gmail\|C:\\\\Users'` → empty |
| **DP-3-5** | Verify no `.env` staged | 🤖 | `git status --porcelain \| grep -i '\.env'` → empty |
| **DP-3-6** | Verify `data/raw/` ignored, `data/artifacts/` **not** | 🤖 | `git check-ignore data/raw` prints; `git check-ignore data/artifacts` → exit 1 |
| **DP-3-7** | Sensitive cases hand-verified (`G4`) | 👤 | All `edge.md` §1 walked manually |
| **DP-3-8** | Fact-set review complete (`G5`, `P10-5`) | 👤 | Every reason human-approved |
| **DP-3-9** | First commit | 🤖 | `git log --format='%an <%ae>'` → only `Anonymous Analyst` |
| **DP-3-10** | Push to remote | 👤 | Only after DP-3-1 |

> **DP-3-9 is the irreversible one.** A real name in pushed history requires rewriting history and recreating both deployments. Currently clean: identity set, zero commits, no remote.

---

## DP-4 — Railway provisioning 👤

Dashboard only. An agent cannot do these.

| ID | Task | Owner | Notes |
|---|---|---|---|
| **DP-4-1** | railway.app → New Project → Deploy from GitHub repo | 👤 | Authorise if prompted |
| **DP-4-2** | **Name the service neutrally** — e.g. `discovery-engine` | 👤 | Appears in the public domain (`EC-P4`) |
| **DP-4-3** | Set environment variables (table below) | 👤 | Dashboard only — never commit |
| **DP-4-4** | Settings → Region → `asia-southeast1` (Singapore) | 👤 | Nearest to India |
| **DP-4-5** | Settings → Volumes → mount `/app/data`, 1GB | 👤 | Without it, artifacts vanish every redeploy |
| **DP-4-6** | Generate `ENGINE_API_TOKEN` | 🤖👤 | Agent: `openssl rand -hex 32`. Human pastes into dashboard. |
| **DP-4-7** | Record the deployed URL | 👤 | Needed for DP-6-3 |

### Railway environment variables

| Variable | Value | Notes |
|---|---|---|
| `GROQ_API_KEY` | *(your key)* | |
| `GEMINI_API_KEY` | *(your key)* | |
| `REDDIT_CLIENT_ID` | *(from Reddit app)* | `P1-3` |
| `REDDIT_CLIENT_SECRET` | *(from Reddit app)* | |
| `REDDIT_USER_AGENT` | `blinkit-research/0.1` | **No name or email.** Reddit's convention suggests a contact — do not comply (`EC-P4`). |
| `ENGINE_API_TOKEN` | *(from DP-4-6)* | Same value goes into Vercel |
| `ALLOWED_ORIGIN` | *(set in DP-7)* | Leave blank for now |
| `PYTHONUNBUFFERED` | `1` | Logs stream instead of buffering |

---

## DP-5 — Railway verification 🤖

Agent-executable once the URL exists.

| ID | Task | Owner | Verification |
|---|---|---|---|
| **DP-5-1** | Health endpoint responds | 🤖 | `curl https://<svc>.up.railway.app/health` → `{"status":"ok"}` |
| **DP-5-2** | Deployed build matches repo | 🤖 | `curl -H "X-Engine-Token: $TOKEN" .../config` → model IDs match `engine/config.py` |
| **DP-5-3** | Unauthenticated `/config` rejected | 🤖 | → 401 |
| **DP-5-4** | Docs endpoints disabled | 🤖 | `/docs` and `/redoc` → 404 |

**If DP-5-1 fails:** the cause is almost always not binding `$PORT` — Railway reports "crashed" with no useful log. See Troubleshooting.

---

## DP-6 — Vercel provisioning 👤

| ID | Task | Owner | Notes |
|---|---|---|---|
| **DP-6-1** | vercel.com → Add New → Project → import repo | 👤 | Framework auto-detects as Next.js |
| **DP-6-2** | **Neutral project name** — `blinkit-occasion-engine` ✅ / `<name>-blinkit` ❌ | 👤 | Becomes the subdomain (`EC-P4`) |
| **DP-6-3** | Set environment variables (table below) | 👤 | |
| **DP-6-4** | Root directory `./`, Node 20.x or 22.x | 👤 | Other defaults correct for Next.js 16 |
| **DP-6-5** | Deploy; record production URL | 👤 | Needed for DP-7 |

### Vercel environment variables

| Variable | Value | Scope |
|---|---|---|
| `GROQ_API_KEY` | *(your key)* | Production, Preview |
| `GEMINI_API_KEY` | *(your key)* | Production, Preview |
| `ENGINE_URL` | Railway URL from DP-4-7 | Production |
| `ENGINE_API_TOKEN` | Same as DP-4-6 | Production |

> **No `NEXT_PUBLIC_` prefix on any of these.** That prefix inlines the value into the client bundle and would publish your API keys.

---

## DP-7 — Wiring 🤖👤

| ID | Task | Owner | DoD |
|---|---|---|---|
| **DP-7-1** | Set Railway `ALLOWED_ORIGIN` to the exact Vercel production URL | 👤 | Set |
| **DP-7-2** | Redeploy the Railway service | 👤 | Deploy green |
| **DP-7-3** | Verify CORS from the Vercel origin | 🤖 | Preflight returns the correct `Access-Control-Allow-Origin` |
| **DP-7-4** | Verify keys absent from the client bundle | 🤖 | `curl -s <vercel-url> \| grep -iE 'gsk_\|AIza'` → **empty** |
| **DP-7-5** | Verify Python excluded from the build | 🤖 | `curl -o /dev/null -w "%{http_code}" <vercel-url>/engine/config.py` → 404 |

> **If DP-7-4 finds anything, the keys are burned.** Rename the variable *and rotate both keys* — renaming alone leaves them in deployment history.

---

## DP-8 — Production smoke tests 🤖👤

Against the live URL, never localhost.

| ID | Flow | Owner | Pass condition |
|---|---|---|---|
| **DP-8-1** | **DF-A** — add atta as Persona A | 👤 | Rail renders 2 cross-L1 suggestions with reasons. **Network tab: 0 requests.** |
| **DP-8-2** | **DF-B** — add paneer + cream + naan | 👤 | Occasion inferred live. Exactly 1 request. Within budget. |
| **DP-8-3** | **DF-C** — add pregnancy test | 👤 | **Nothing renders.** Trigger log shows `SENSITIVE_FERTILITY`, 0 inference calls. |
| **DP-8-4** | **DF-D** — Persona B, add atta | 👤 | Suppressed. Log cites R3. |
| **DP-8-5** | Tier 1 — normal | 🤖 | Live inference |
| **DP-8-6** | Tier 2 — invalid `GROQ_API_KEY` | 🤖 | Silent Gemini fallback |
| **DP-8-7** | Tier 3 — both keys invalid | 🤖 | Precomputed only. **DF-A still works.** |
| **DP-8-8** | Tier 4 — corrupt precomputed map | 🤖 | Renders nothing. Cart unaffected. No error toast. |
| **DP-8-9** | Rate limiting holds (`EC-B3`) | 🤖 | Burst requests → throttled, service stays up |

> **DP-8-7 is the one that matters.** It proves the retrieval logic is real code rather than a prompt, and it is what protects the demo if a provider rate-limits you mid-evaluation.

---

## DP-9 — Final anonymity sweep ⛔ 🤖👤

`P14-7` / `EC-P4`. Last gate before submission.

| ID | Surface | Owner | Check |
|---|---|---|---|
| **DP-9-1** | Commit metadata | 🤖 | `git log --format='%an <%ae>' \| sort -u` → only `Anonymous Analyst` |
| **DP-9-2** | Tracked files | 🤖 | `git grep -inE 'gautam\|thakur\|thaku\|@gmail\|C:\\\\Users' -- . ':!*lock*'` → empty |
| **DP-9-3** | Vercel subdomain | 👤 | No name fragment |
| **DP-9-4** | Railway domain | 👤 | No name fragment |
| **DP-9-5** | Page `<title>`, meta, footer | 🤖 | No author or byline |
| **DP-9-6** | Committed artifacts | 🤖 | No PII survived `P2-2` scrubbing |
| **DP-9-7** | Demo data | 🤖 | Fictional personas only |
| **DP-9-8** | Reddit user-agent | 🤖 | No contact identifier |
| **DP-9-9** | Screenshots in docs | 👤 | No username in window chrome or path bars |

---

## DP-10 — Cost control 👤

| ID | Task | Owner | Why |
|---|---|---|---|
| **DP-10-1** | After the pipeline runs, commit artifacts | 🤖 | They are the evidence (`AD-8`) |
| **DP-10-2** | **Pause or delete the Railway service** | 👤 | Under Split A it is not on the user path. Artifacts are committed; the Insights Explorer is static. The submission stays fully functional. |
| **DP-10-3** | Set Groq/Gemini spend alerts | 👤 | `EC-B2` |

| Platform | Free tier | Risk |
|---|---|---|
| **Vercel Hobby** | 100GB bandwidth | Fine. Hobby forbids commercial use — a graded project is not commercial. |
| **Railway** | Trial credit, then usage-based | **Will require a card eventually.** Hence DP-10-2. |
| **Groq** | Generous, rate-limited | Token caps per request |
| **Gemini** | Free tier, rate-limited | Fallback only under Split A |

---

## Dependency graph

```
DP-0 ──► DP-1 ──► DP-2 ──► DP-3 ⛔ ──┬──► DP-4 (👤) ──► DP-5 ──┐
                                      │                          ├──► DP-7 ──► DP-8 ──► DP-9 ⛔ ──► DP-10
                                      └──► DP-6 (👤) ────────────┘
```

DP-4 and DP-6 are independent and can run in either order. DP-7 needs both URLs.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Railway "crashed", no logs | Not binding `$PORT` | `--port $PORT` in `startCommand` |
| Healthcheck timeout | Cold start slower than window | Raise `healthcheckTimeout`; torch import is slow |
| Railway build OOM / image too large | `sentence-transformers` pulls torch | Switch to `gemini-embedding-001` fallback (already in `engine/config.py`); drop torch deps; record ADR |
| `ModuleNotFoundError: engine` | Package not installed | `pip install -e ./engine`; confirm `engine/__init__.py` |
| Vercel tries to install Python | `.vercelignore` missing `engine/` | Fix, redeploy |
| CORS errors in console | `ALLOWED_ORIGIN` unset or stale | Exact Vercel URL, then redeploy Railway |
| Keys visible in page source | `NEXT_PUBLIC_` prefix | Rename **and rotate keys** |
| Suggestions never render in prod, fine locally | Budget exceeded, correctly abandoned | Check measured render time in metrics panel; reconsider Split A |
| Artifacts missing at build | `data/artifacts/` gitignored | Only `data/raw/` should be |

---

## Appendix A — files to create

### A.1 `engine/pyproject.toml`

```toml
[project]
name = "blinkit-discovery-engine"
version = "0.1.0"
description = "Offline discovery-engine pipeline"
requires-python = ">=3.12"

dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.32",
  "pydantic>=2.9",
  "httpx>=0.27",
  "python-dotenv>=1.0",
  "google-play-scraper>=1.2",
  "praw>=7.8",
  "sentence-transformers>=3.3",
  "umap-learn>=0.5.7",
  "hdbscan>=0.8.40",
  "scikit-learn>=1.6",
  "datasketch>=1.6",
  "langdetect>=1.0.9",
  "orjson>=3.10",
]

[project.optional-dependencies]
dev = ["pytest>=8.3", "ruff>=0.8"]

[build-system]
requires = ["setuptools>=75"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
include = ["engine*"]
```

### A.2 `engine/service/main.py`

```python
"""FastAPI wrapper around the discovery-engine pipeline.

Deployed to Railway. NOT on the user hot path — see deployment-plan.md DP-0.
Serves pipeline control and artifact reads only.
"""

import os
import secrets

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from engine.config import manifest_entry

# docs disabled — this service holds provider keys and needs no public surface
app = FastAPI(title="Discovery Engine", docs_url=None, redoc_url=None)

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN else [],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

ENGINE_TOKEN = os.environ.get("ENGINE_API_TOKEN", "")


def _auth(token: str | None) -> None:
    """Constant-time shared-secret check. Pipeline runs are expensive."""
    if not ENGINE_TOKEN or not token or not secrets.compare_digest(token, ENGINE_TOKEN):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict:
    """Railway healthcheck target. Unauthenticated, reveals nothing."""
    return {"status": "ok"}


@app.get("/config")
def config(x_engine_token: str | None = Header(default=None)) -> dict:
    """Model + parameter snapshot. Verifies a deploy matches the repo."""
    _auth(x_engine_token)
    return manifest_entry()


@app.post("/pipeline/run")
def pipeline_run(x_engine_token: str | None = Header(default=None)) -> dict:
    """Trigger a pipeline run. Long-running — returns a run_id immediately."""
    _auth(x_engine_token)
    # TODO P1–P6: enqueue run; write to data/artifacts/<run_id>/
    raise HTTPException(status_code=501, detail="pipeline not yet implemented")
```

### A.3 `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -e ./engine"
  },
  "deploy": {
    "startCommand": "uvicorn engine.service.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

## Appendix B — if you chose Split B

Three changes, made deliberately:

| ID | Task | Owner |
|---|---|---|
| **DP-B-1** | Add ADR: *"R8 relaxed to 600ms for the live path; cross-cloud hop makes 300ms unachievable."* Do **not** leave R8 nominally at 300ms and quietly miss it. | 🤖 |
| **DP-B-2** | Pin Railway and Vercel functions to the same region. Cross-region alone costs ~150ms. | 👤 |
| **DP-B-3** | Proxy through the Vercel route handler — **never call Railway from the browser.** Keeps `ENGINE_API_TOKEN` server-side and avoids exposing the service to direct abuse. | 🤖 |

**Unaffected:** Flow A. The precomputed map is bundled static and makes no network call under either split.

---

## New tasks for `implementation-plan.md` Phase 14

| ID | Task | Maps to |
|---|---|---|
| **P14-9** | Topology decision, ADR if Split B | DP-0 |
| **P14-10** | Python packaging *(= `P0-5`)* | DP-1-1…1-3 |
| **P14-11** | FastAPI service wrapper | DP-1-4 |
| **P14-12** | `railway.json` with `$PORT` + healthcheck | DP-1-5 |
| **P14-13** | Generate and distribute `ENGINE_API_TOKEN` | DP-4-6 |
| **P14-14** | Close the CORS loop post-Vercel-deploy | DP-7-1 |
