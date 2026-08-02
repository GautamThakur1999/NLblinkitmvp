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
