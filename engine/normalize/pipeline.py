import json
from pathlib import Path
from typing import List

from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger
from dotenv import load_dotenv

load_dotenv()
from engine.normalize.text import normalize_whitespace
from engine.normalize.pii import scrub_pii
from engine.normalize.heuristics import dedup_corpus, flag_bots, flag_minimum_content
from engine.normalize.enrich import translate_to_english, tag_relevance

logger = setup_logger("normalize_pipeline")

def load_raw_corpus(filepath: str) -> List[Document]:
    docs = []
    path = Path(filepath)
    if not path.exists():
        logger.error(f"Raw corpus {filepath} not found.")
        return docs
        
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            # Reconstruct Document object
            metadata = DocumentMetadata(**data.get("metadata", {}))
            data["metadata"] = metadata
            docs.append(Document(**data))
            
    return docs

def run_pipeline():
    """
    Orchestrates the Phase 2 conditioning pipeline.
    """
    logger.info("Starting Engine Conditioning Pipeline...")
    
    docs = load_raw_corpus("data/raw/raw_corpus.jsonl")
    if not docs:
        logger.warning("No documents loaded. Exiting.")
        return
        
    logger.info(f"Loaded {len(docs)} raw documents.")
    
    # 1. Base formatting & PII (P2-10, P2-2)
    for doc in docs:
        doc.text_original = normalize_whitespace(doc.text_original)
        doc.text_original = scrub_pii(doc.text_original)
        
    # 2. Heuristics & Deduplication (P2-4, P2-5, P2-7)
    docs = flag_minimum_content(docs)
    docs = flag_bots(docs)
    docs = dedup_corpus(docs)
    
    # 3. Enrichment (P2-6, P2-8)
    docs = translate_to_english(docs)
    docs = tag_relevance(docs)
    
    # 4. Save processed corpus
    processed_dir = Path("data/processed")
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    out_file = processed_dir / "documents.jsonl"
    with open(out_file, 'w', encoding='utf-8') as f:
        for doc in docs:
            f.write(json.dumps(doc.to_dict()) + "\n")
            
    logger.info(f"Pipeline complete. Saved {len(docs)} conditioned documents to {out_file}.")

if __name__ == "__main__":
    run_pipeline()
