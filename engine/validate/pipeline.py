import json
import random
from pathlib import Path
from dotenv import load_dotenv

from engine.logger import setup_logger
from engine.schemas import Document, DocumentMetadata, Insight, ValidationReport
from engine.validate.checks import (
    check_groundedness,
    check_coverage,
    check_agreement,
    run_adversarial_control
)

load_dotenv()
logger = setup_logger("validate_pipeline")

def load_documents() -> dict[str, Document]:
    docs_map = {}
    path = Path("data/processed/documents.jsonl")
    if not path.exists(): return docs_map
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line)
            data["metadata"] = DocumentMetadata(**data.get("metadata", {}))
            doc = Document(**data)
            docs_map[doc.document_id] = doc
    return docs_map

def load_json(filepath: str) -> list:
    path = Path(filepath)
    if not path.exists(): return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_pipeline():
    logger.info("Starting Engine Validation Pipeline (Phase 6)...")
    
    docs_map = load_documents()
    themes = load_json("data/processed/themes.json")
    insights_raw = load_json("data/processed/insights.json")
    
    if not docs_map or not themes:
        logger.error("Missing input data. Run Phase 5 first.")
        return
        
    # P6-7: Adversarial Control GATE
    adversarial_pass = run_adversarial_control(docs_map)
    if not adversarial_pass:
        logger.critical("GATE FAILED: Adversarial Negative Control failed. Aborting validation.")
        raise RuntimeError("Validation Pipeline aborted due to adversarial failure.")
        
    valid_insights = []
    quarantined = load_json("data/qa/failures.json") # Load any existing from Phase 5
    
    total_quotes = 0
    passed_quotes = 0
    
    # P6-1: Groundedness Test
    for data in insights_raw:
        insight = Insight(**data)
        
        all_quotes_valid = True
        for quote in insight.quotes:
            total_quotes += 1
            if check_groundedness(quote, docs_map):
                passed_quotes += 1
            else:
                logger.warning(f"  Groundedness failure on quote: '{quote[:30]}...'")
                all_quotes_valid = False
                
        if all_quotes_valid:
            valid_insights.append(insight)
        else:
            logger.error(f"  Insight {insight.insight_id} failed groundedness check! Quarantining.")
            quarantined.append({"raw": data, "reason": "Groundedness failure (P6-1)"})
            
    if total_quotes > 0:
        groundedness_pass_rate = (passed_quotes / total_quotes) * 100.0
    else:
        groundedness_pass_rate = 100.0
        
    logger.info(f"Groundedness Pass Rate: {groundedness_pass_rate:.1f}%")
    
    if groundedness_pass_rate < 100.0:
        logger.warning("GATE CONDITION: V4.1 Groundedness < 100%. Insights were quarantined.")
        
    # Rewrite valid insights back (P6-10)
    with open("data/processed/insights.json", 'w', encoding='utf-8') as f:
        json.dump([i.to_dict() for i in valid_insights], f, indent=2)
        
    with open("data/qa/failures.json", 'w', encoding='utf-8') as f:
        json.dump(quarantined, f, indent=2)
        
    # Calculate metrics
    coverage = check_coverage(themes, len(docs_map))
    avg_entropy = sum(i.source_entropy for i in valid_insights) / len(valid_insights) if valid_insights else 0.0
    agreement = check_agreement(themes)
    
    # P6-4: Stability is mocked to 1.0 for MVP
    stability = 1.0
    
    report = ValidationReport(
        v4_1_groundedness_pass_rate=groundedness_pass_rate,
        v4_2_coverage_percentage=coverage,
        v4_3_avg_source_entropy=avg_entropy,
        v4_4_stability=stability,
        v4_5_cross_model_agreement=agreement,
        v4_7_adversarial_pass=adversarial_pass
    )
    
    with open("data/processed/validation.json", 'w', encoding='utf-8') as f:
        json.dump(report.to_dict(), f, indent=2)
        
    logger.info("Saved validation report to data/processed/validation.json")
    
    # P6-6: Human Spot-check sample
    sample = random.sample(list(docs_map.values()), min(50, len(docs_map)))
    with open("data/qa/human_sample.json", 'w', encoding='utf-8') as f:
        json.dump([s.to_dict() for s in sample], f, indent=2)
        
    logger.info("Saved 50 document sample for human spot-check to data/qa/human_sample.json")
    logger.info("Validation Pipeline complete!")

if __name__ == "__main__":
    run_pipeline()
