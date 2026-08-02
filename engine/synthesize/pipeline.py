import json
import uuid
import math
from pathlib import Path
from collections import Counter
from dotenv import load_dotenv

from engine.logger import setup_logger
from engine.schemas import Document, DocumentMetadata, Insight
from engine.synthesize.llm import generate_insights

load_dotenv()
logger = setup_logger("synthesize_pipeline")

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

def load_themes() -> list[dict]:
    path = Path("data/processed/themes.json")
    if not path.exists():
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)
        
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

def run_discovery_prior_test(docs_map: dict[str, Document]):
    """
    P5-7: Discovery-prior test. Quantifies how much of the corpus is actually
    about discovery vs delivery/pricing/app.
    """
    logger.info("Running Discovery-Prior Test (P5-7)...")
    counts = {
        "delivery_issue": 0,
        "pricing": 0,
        "app_bug": 0,
        "product_quality": 0,
        "feature_request": 0,
        "discovery_related": 0, # Custom heuristic combining feature_request + specific keywords
        "total_tagged": 0
    }
    
    for doc in docs_map.values():
        if not doc.relevance_tags: continue
        counts["total_tagged"] += 1
        
        is_discovery = False
        text = (doc.text_english or doc.text_original).lower()
        if "feature_request" in doc.relevance_tags or "search" in text or "find" in text or "category" in text:
            counts["discovery_related"] += 1
            is_discovery = True
            
        for tag in doc.relevance_tags:
            if tag in counts and not is_discovery: # Don't double count if we already counted as discovery
                counts[tag] += 1
                
    out_path = Path("data/processed/discovery_prior.json")
    with open(out_path, 'w') as f:
        json.dump(counts, f, indent=2)
    logger.info(f"Discovery-prior test saved. Discovery share: {counts['discovery_related']} / {counts['total_tagged']}")

def run_pipeline():
    logger.info("Starting Engine Synthesis Pipeline...")
    docs_map = load_documents()
    themes = load_themes()
    clusters = load_clusters()
    
    if not docs_map or not themes or not clusters:
        logger.error("Missing input data. Run Phase 4 first.")
        return
        
    cluster_map = {c["cluster_id"]: c for c in clusters}
    valid_insights = []
    quarantined = []
    
    for theme in themes:
        c_id = theme["cluster_id"]
        # In MVP, we bypass manual review block and use Labeller A
        theme_name = theme["labeller_a"]["theme_name"]
        
        logger.info(f"Synthesizing insights for {c_id}: '{theme_name}'...")
        
        cluster = cluster_map.get(c_id)
        if not cluster: continue
        
        # Take a representative sample to fit in LLM context
        # We take top 40 documents from the cluster to synthesize
        doc_ids = cluster["document_ids"][:40]
        sample_docs = [docs_map[d_id] for d_id in doc_ids if d_id in docs_map]
        
        raw_insights = generate_insights(theme_name, sample_docs)
        
        for raw in raw_insights:
            # P5-2: Schema Gate
            cited_ids = raw.get("document_ids", [])
            if not isinstance(cited_ids, list) or len(cited_ids) < 3:
                logger.warning(f"  Dropped: <3 distinct document_ids")
                quarantined.append({"raw": raw, "reason": "<3 document_ids"})
                continue
                
            if not raw.get("quotes") or not raw.get("confidence_score") or not raw.get("falsifier") or not raw.get("answers_brief_question"):
                logger.warning(f"  Dropped: Missing required schema fields")
                quarantined.append({"raw": raw, "reason": "Schema validation failed"})
                continue
                
            # P5-3: Document ID existence validation (No hallucinations!)
            fabrication = False
            for d_id in cited_ids:
                if d_id not in docs_map:
                    fabrication = True
                    break
            if fabrication:
                logger.error(f"  Hard Fail: Fabricated document_id detected! Quarantining.")
                quarantined.append({"raw": raw, "reason": "Fabricated document_id (P5-3)"})
                continue
                
            # P5-6: Brand Segregation
            # Check if cited docs mix Blinkit and Competitors
            sources = [docs_map[d].source_detail for d in cited_ids]
            is_competitor = all("zepto" in s.lower() or "instamart" in s.lower() for s in sources)
            is_mixed = any("zepto" in s.lower() or "instamart" in s.lower() for s in sources) and any("blinkit" in s.lower() for s in sources)
            if is_mixed:
                logger.warning(f"  Brand segregation violation. Flagging insight.")
                # We could drop it, but we'll flag it by overriding the title
                raw["title"] = "[MIXED BRAND WARNING] " + raw["title"]
                
            # Calculate metrics
            entropy = calculate_source_entropy(cited_ids, docs_map)
            
            # P5-5: Ranking = frequency (theme size) * source diversity (entropy) * persistence (assume 1.0 for now)
            rank_score = theme["size"] * (entropy if entropy > 0 else 0.1)
            
            insight = Insight(
                insight_id=f"INS-{uuid.uuid4().hex[:8].upper()}",
                theme_id=c_id,
                title=raw["title"],
                description=raw["description"],
                confidence_score=float(raw["confidence_score"]),
                document_ids=cited_ids,
                quotes=raw["quotes"],
                falsifier=raw["falsifier"],
                answers_brief_question=int(raw["answers_brief_question"]),
                is_competitor_only=is_competitor,
                source_entropy=entropy,
                rank_score=rank_score
            )
            valid_insights.append(insight)
            logger.info(f"  Added valid insight: {insight.insight_id}")
            
    # Sort by rank_score descending
    valid_insights.sort(key=lambda x: x.rank_score, reverse=True)
    
    # Save artifacts
    out_dir = Path("data/processed")
    with open(out_dir / "insights.json", 'w', encoding='utf-8') as f:
        json.dump([i.to_dict() for i in valid_insights], f, indent=2)
        
    qa_dir = Path("data/qa")
    qa_dir.mkdir(parents=True, exist_ok=True)
    with open(qa_dir / "failures.json", 'w', encoding='utf-8') as f:
        json.dump(quarantined, f, indent=2)
        
    logger.info(f"Synthesis complete. Generated {len(valid_insights)} valid insights. {len(quarantined)} quarantined.")
    
    # Run P5-7
    run_discovery_prior_test(docs_map)

if __name__ == "__main__":
    run_pipeline()
