import os
import json
import numpy as np
from pathlib import Path
from collections import defaultdict
from typing import Dict, Any

from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger
from engine.cluster.embed import generate_embeddings
from engine.cluster.model import reduce_dimensions, cluster_hdbscan, bootstrap_stability
from engine.cluster.guardrails import check_sufficiency, check_degenerate, CorpusTooSmallError
from dotenv import load_dotenv

load_dotenv()

logger = setup_logger("cluster_pipeline")

def load_processed_corpus(filepath: str) -> list[Document]:
    docs = []
    path = Path(filepath)
    if not path.exists():
        return docs
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            metadata = DocumentMetadata(**data.get("metadata", {}))
            data["metadata"] = metadata
            docs.append(Document(**data))
    return docs

def run_pipeline():
    logger.info("Starting Engine Clustering Pipeline...")
    
    docs = load_processed_corpus("data/processed/documents.jsonl")
    if not docs:
        logger.error("No processed documents found. Run Phase 2 first.")
        return
        
    logger.info(f"Loaded {len(docs)} conditioned documents.")
    
    # Check minimum corpus size (P3-4)
    try:
        check_sufficiency(len(docs), threshold=500)
    except CorpusTooSmallError:
        return
        
    # P3-1: Embeddings
    embeddings = generate_embeddings(docs)
    
    # P3-6: Parameter log to prevent p-hacking
    params = {
        "umap_n_components": 5,
        "umap_n_neighbors": 15,
        "hdbscan_min_cluster_size": 15,
        "hdbscan_min_samples": 5
    }
    
    # P3-2 & P3-3: UMAP + HDBSCAN
    reduced = reduce_dimensions(embeddings, n_components=params["umap_n_components"], n_neighbors=params["umap_n_neighbors"])
    labels, probs = cluster_hdbscan(reduced, min_cluster_size=params["hdbscan_min_cluster_size"], min_samples=params["hdbscan_min_samples"])
    
    # P3-5: Guardrails check
    check_degenerate(labels)
    
    # P3-7: Stability Check
    stability = bootstrap_stability(embeddings)
    
    # Build clusters output
    clusters: Dict[str, Dict[str, Any]] = {}
    
    for i, doc in enumerate(docs):
        label = int(labels[i])
        if label == -1:
            continue # Noise
            
        cluster_id = f"CLUSTER_{label}"
        if cluster_id not in clusters:
            clusters[cluster_id] = {
                "cluster_id": cluster_id,
                "document_ids": [],
                "size": 0,
                "is_competitor_only": True # default to true, set false if we find Blinkit
            }
            
        clusters[cluster_id]["document_ids"].append(doc.document_id)
        clusters[cluster_id]["size"] += 1
        
        # P3-7: Isolate competitor-only clusters
        if doc.source_detail == "909851600" or doc.source_detail == "com.grofers.customerapp":
            clusters[cluster_id]["is_competitor_only"] = False
            
    out_dir = Path("data/processed")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Save parameter log
    with open(out_dir / "tuning_log.json", 'w') as f:
        json.dump(params, f, indent=2)
        
    # Save clusters
    with open(out_dir / "clusters.json", 'w') as f:
        json.dump(list(clusters.values()), f, indent=2)
        
    logger.info(f"Clustering complete. Formed {len(clusters)} distinct themes. Noise ratio: {(np.sum(labels == -1) / len(labels)):.1%}")

if __name__ == "__main__":
    run_pipeline()
