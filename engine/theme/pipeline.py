import json
import math
from collections import Counter
from pathlib import Path
from dotenv import load_dotenv

from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger
from engine.theme.sampling import sample_cluster_docs
from engine.theme.labellers import label_groq, label_gemini

load_dotenv()
logger = setup_logger("theme_pipeline")

def load_documents() -> dict[str, Document]:
    docs_map = {}
    path = Path("data/processed/documents.jsonl")
    if not path.exists():
        return docs_map
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line)
            data["metadata"] = DocumentMetadata(**data.get("metadata", {}))
            doc = Document(**data)
            docs_map[doc.document_id] = doc
    return docs_map

def load_clusters() -> list[dict]:
    path = Path("data/processed/clusters.json")
    if not path.exists():
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def calculate_source_entropy(doc_ids: list[str], docs_map: dict[str, Document]) -> float:
    sources = [docs_map[d].source_detail for d in doc_ids if d in docs_map]
    if not sources: return 0.0
    counts = Counter(sources)
    total = len(sources)
    entropy = 0.0
    for count in counts.values():
        p = count / total
        entropy -= p * math.log2(p)
    return entropy

def calculate_agreement(theme_a: str, theme_b: str) -> float:
    """Simple κ-analogue using Jaccard word overlap (P4-5)."""
    set_a = set(theme_a.lower().split())
    set_b = set(theme_b.lower().split())
    if not set_a or not set_b: return 0.0
    return len(set_a.intersection(set_b)) / len(set_a.union(set_b))

def run_pipeline():
    logger.info("Starting Engine Theme Labelling Pipeline...")
    docs_map = load_documents()
    clusters = load_clusters()
    
    if not docs_map or not clusters:
        logger.error("Missing input data. Run Phase 3 first.")
        return
        
    themes = []
    
    for cluster in clusters:
        c_id = cluster["cluster_id"]
        doc_ids = cluster["document_ids"]
        size = cluster["size"]
        
        logger.info(f"Processing {c_id} ({size} documents)...")
        
        # P4-1: Sample
        sample = sample_cluster_docs(doc_ids, docs_map, n=10)
        if not sample:
            continue
            
        # P4-2 & P4-3: Dual Labelling
        logger.info(f"  Requesting Labeller A (Groq) & Labeller B (Gemini)...")
        label_a = label_groq(sample)
        label_b = label_gemini(sample)
        
        # P4-5: Agreement Score
        agreement = calculate_agreement(label_a.get("theme_name", ""), label_b.get("theme_name", ""))
        
        # Escalate if divergent (kappa < 0.2 threshold for Jaccard on short strings)
        needs_review = agreement < 0.2
        if needs_review:
            logger.warning(f"  {c_id} divergent consensus (score={agreement:.2f}). Escalating to manual review.")
            
        # P4-7: Source Entropy
        entropy = calculate_source_entropy(doc_ids, docs_map)
        
        themes.append({
            "cluster_id": c_id,
            "size": size,
            "is_competitor_only": cluster.get("is_competitor_only", True),
            "source_entropy": entropy,
            "agreement_score": agreement,
            "needs_manual_review": needs_review,
            "labeller_a": label_a,
            "labeller_b": label_b,
            # P4-4: We keep both, but surface the agreed tag or A's tag as primary for MVP UI mapping
            "primary_tag": label_a.get("tag") if not needs_review else "escalated",
            "primary_theme": label_a.get("theme_name") if not needs_review else "Pending Manual Review"
        })
        
    out_dir = Path("data/processed")
    with open(out_dir / "themes.json", 'w') as f:
        json.dump(themes, f, indent=2)
        
    logger.info(f"Theme extraction complete. Saved {len(themes)} themes.")

if __name__ == "__main__":
    run_pipeline()
