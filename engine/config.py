"""
Central model + parameter configuration for the discovery engine.

Single source of truth — no model ID or threshold should appear anywhere else
in engine/.  See architecture.md §2.1 for the routing rationale.

MODEL IDS VERIFIED: 30 July 2026
    Groq   — console.groq.com/docs/models  (production models only)
    Gemini — ai.google.dev/gemini-api/docs/models

Provider model IDs churn faster than documentation.  Re-verify before any
run after a long gap, and prefer PRODUCTION models over PREVIEW ones — Groq
explicitly warns that preview models may be discontinued without notice.
Run `python -m engine.config --verify` to check IDs against the live APIs.
"""

import json
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ModelConfig:
    provider: str
    model_id: str
    is_free_tier: bool
    note: str = ""


# ---------------------------------------------------------------------------
# Stage 6 — Embeddings
# ---------------------------------------------------------------------------
# Deviation from architecture.md §2.1, which specified Gemini embeddings.
# Running locally via sentence-transformers is free, offline, quota-free and
# fully reproducible — which matters more here than raw quality, because the
# whole corpus must be embedded in one consistent vector space and a rate
# limit mid-run would silently split that space.
#
# Fallback if local inference is unavailable: gemini-embedding-001
EMBEDDING_MODEL = ModelConfig(
    provider="sentence-transformers",
    model_id="BAAI/bge-small-en-v1.5",
    is_free_tier=True,
    note="Local. English-first — documents are translated before embedding.",
)

EMBEDDING_MODEL_FALLBACK = ModelConfig(
    provider="gemini",
    model_id="gemini-embedding-001",
    is_free_tier=True,
)


# ---------------------------------------------------------------------------
# Stage 5 — Relevance tagging (high volume, cheap, fast)
# ---------------------------------------------------------------------------
CLASSIFICATION_MODEL = ModelConfig(
    provider="groq",
    model_id="llama-3.1-8b-instant",
    is_free_tier=True,
    note="Thousands of documents; throughput and cost dominate over depth.",
)


# ---------------------------------------------------------------------------
# Stage 4 — Translation (Hinglish / Devanagari -> EN)
# ---------------------------------------------------------------------------
TRANSLATION_MODEL = ModelConfig(
    provider="gemini",
    model_id="gemini-2.5-flash",
    is_free_tier=True,
    note="Strong Indic-language handling. text_original is NEVER overwritten.",
)


# ---------------------------------------------------------------------------
# Stage 8 — Theme labelling, two independent coders
# ---------------------------------------------------------------------------
# These MUST be different model families.  Cross-model agreement (architecture.md
# §4.5) is the mechanised analogue of two human coders scored with Cohen's kappa.
# Running the same model twice would measure temperature noise, not reliability.
THEME_LABELLER_A = ModelConfig(
    provider="groq",
    model_id="llama-3.3-70b-versatile",
    is_free_tier=True,
    note="Coder A. Llama family.",
)

THEME_LABELLER_B = ModelConfig(
    provider="gemini",
    model_id="gemini-2.5-flash",
    is_free_tier=True,
    note="Coder B. Gemini family — deliberately different from A.",
)


# ---------------------------------------------------------------------------
# Stage 9 — Corpus-scale insight synthesis
# ---------------------------------------------------------------------------
# Runs offline, so latency is irrelevant and reasoning depth is everything.
SYNTHESIS_MODEL = ModelConfig(
    provider="gemini",
    model_id="gemini-2.5-pro",
    is_free_tier=True,
    note="Long context + reasoning depth. Free tier is rate-limited, not absent.",
)

# Used if the synthesis model is rate-limited mid-run.
SYNTHESIS_MODEL_FALLBACK = ModelConfig(
    provider="gemini",
    model_id="gemini-2.5-flash",
    is_free_tier=True,
)


# ---------------------------------------------------------------------------
# Stage 7 — Clustering
# ---------------------------------------------------------------------------
# NOTE (implementation-plan P3-6): every change to these values must be written
# to the run manifest.  Tuning until themes look convincing is the easiest way
# to fabricate a result while feeling rigorous — the log makes it visible.
CLUSTERING_CONFIG = {
    "umap_n_neighbors": 15,
    "umap_n_components": 5,
    "umap_metric": "cosine",
    "hdbscan_min_cluster_size": 5,
    "hdbscan_min_samples": 2,
    "hdbscan_metric": "euclidean",
}

# Bootstrap stability (architecture.md §4.4)
BOOTSTRAP_CONFIG = {
    "n_runs": 10,
    "subsample_fraction": 0.8,
    "seed_start": 1000,
}

# Corpus-size gate (P3-4 / EC-G2).  Below this, clustering is not meaningful —
# report the limitation rather than lowering the threshold.
MIN_CORPUS_SIZE = 300


# ---------------------------------------------------------------------------
# Secrets — never hardcode, never commit
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


ALL_MODELS = {
    "EMBEDDING_MODEL": EMBEDDING_MODEL,
    "EMBEDDING_MODEL_FALLBACK": EMBEDDING_MODEL_FALLBACK,
    "CLASSIFICATION_MODEL": CLASSIFICATION_MODEL,
    "TRANSLATION_MODEL": TRANSLATION_MODEL,
    "THEME_LABELLER_A": THEME_LABELLER_A,
    "THEME_LABELLER_B": THEME_LABELLER_B,
    "SYNTHESIS_MODEL": SYNTHESIS_MODEL,
    "SYNTHESIS_MODEL_FALLBACK": SYNTHESIS_MODEL_FALLBACK,
}


def manifest_entry() -> dict:
    """Model + parameter snapshot for the run manifest (architecture.md §5)."""
    return {
        "models": {
            name: {"provider": m.provider, "model_id": m.model_id}
            for name, m in ALL_MODELS.items()
        },
        "clustering": dict(CLUSTERING_CONFIG),
        "bootstrap": dict(BOOTSTRAP_CONFIG),
        "min_corpus_size": MIN_CORPUS_SIZE,
    }


def verify() -> int:
    """Check every configured model ID against the provider's live model list.

    Returns a process exit code: 0 if all resolve, 1 otherwise.  Run this before
    a pipeline run rather than discovering a decommissioned ID mid-corpus.
    """
    import urllib.request

    failures = []

    def _get(url: str, headers: dict) -> dict:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode())

    groq_ids, gemini_ids = set(), set()

    if GROQ_API_KEY:
        try:
            data = _get(
                "https://api.groq.com/openai/v1/models",
                {"Authorization": f"Bearer {GROQ_API_KEY}"},
            )
            groq_ids = {m["id"] for m in data.get("data", [])}
        except Exception as exc:  # noqa: BLE001
            print(f"  ! could not reach Groq model list: {exc}")
    else:
        print("  ! GROQ_API_KEY not set — skipping Groq verification")

    if GEMINI_API_KEY:
        try:
            data = _get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}",
                {},
            )
            gemini_ids = {
                m["name"].removeprefix("models/") for m in data.get("models", [])
            }
        except Exception as exc:  # noqa: BLE001
            print(f"  ! could not reach Gemini model list: {exc}")
    else:
        print("  ! GEMINI_API_KEY not set — skipping Gemini verification")

    for name, m in ALL_MODELS.items():
        if m.provider == "groq" and groq_ids:
            ok = m.model_id in groq_ids
        elif m.provider == "gemini" and gemini_ids:
            ok = m.model_id in gemini_ids
        else:
            print(f"  ? {name:<26} {m.model_id:<32} (unverified)")
            continue

        print(f"  {'OK' if ok else 'XX'} {name:<26} {m.model_id:<32} [{m.provider}]")
        if not ok:
            failures.append(f"{name} -> {m.model_id} ({m.provider})")

    if failures:
        print("\nUNAVAILABLE MODEL IDS:")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("\nAll verifiable model IDs resolved.")
    return 0


if __name__ == "__main__":
    import sys

    if "--verify" in sys.argv:
        raise SystemExit(verify())
    print(json.dumps(manifest_entry(), indent=2))
