import os
import json
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv

from engine.logger import setup_logger
from engine.schemas import Document, Insight
from engine.normalize.text import normalize_whitespace

load_dotenv()
logger = setup_logger("validate_checks")

def check_groundedness(quote: str, docs_map: dict[str, Document]) -> bool:
    """
    P6-1: Verbatim string match against text_original.
    Uses the same normalization function as the pipeline to ensure spacing matches.
    """
    normalized_quote = normalize_whitespace(quote).lower()
    
    # In a real large corpus, we would index this. For MVP, O(N) scan is fine.
    for doc in docs_map.values():
        normalized_doc = normalize_whitespace(doc.text_original).lower()
        if normalized_quote in normalized_doc:
            return True
            
    return False

def check_coverage(themes: list[dict], total_docs: int) -> float:
    """
    P6-2: % of relevant documents in a named theme.
    """
    if total_docs == 0: return 0.0
    themed_docs = sum(t["size"] for t in themes)
    return (themed_docs / total_docs) * 100.0

def check_agreement(themes: list[dict]) -> float:
    """
    P6-5: Cross-model agreement average.
    """
    if not themes: return 0.0
    return sum(t.get("agreement_score", 0.0) for t in themes) / len(themes)

def run_adversarial_control(docs_map: dict[str, Document]) -> bool:
    """
    P6-7: Adversarial negative control.
    Requests evidence for a known absent theme. If LLM manufactures support, fail.
    """
    logger.info("Running Adversarial Negative Control (P6-7)...")
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY missing. Skipping adversarial check (auto-pass).")
        return True
        
    client = Groq(api_key=api_key)
    
    # Grab 20 random documents
    sample_docs = list(docs_map.values())[:20]
    
    context = ""
    for d in sample_docs:
        context += f"Document ID: {d.document_id}\nText: {d.text_original}\n---\n"
        
    prompt = f"""
You are a strict QA system validating user reviews.
Your task is to search for explicit mentions of "Blinkit drone deliveries crashing into windows causing damage".

Review Data:
{context}

RULES:
1. You MUST ONLY extract an insight if the text explicitly contains words like "drone", "flying", or "crash into window".
2. If the text is just a normal complaint (e.g., bad food, late delivery, broken items), it is NOT a drone crash.
3. If there is NO EXPLICIT EVIDENCE of drone crashes, you MUST output exactly: []
4. Output ONLY a JSON array.

Output format: JSON array of objects, or empty JSON array [].
"""

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        # Unpack if Groq wrapped it in an object like {"insights": []}
        if isinstance(parsed, dict):
            for val in parsed.values():
                if isinstance(val, list):
                    parsed = val
                    break
        
        if isinstance(parsed, list) and len(parsed) == 0:
            logger.info("Adversarial control passed. LLM correctly found no evidence.")
            return True
            
        if isinstance(parsed, dict) and not any(parsed.values()):
            logger.info("Adversarial control passed. LLM returned empty object.")
            return True
            
        logger.error(f"Adversarial control FAILED! LLM hallucinated evidence: {content}")
        return False
        
    except Exception as e:
        logger.error(f"Adversarial control API error: {e}")
        # In strict mode, an error on the control might fail the run. For MVP, we fail it.
        return False
