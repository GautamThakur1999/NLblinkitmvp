import os
import json
import time
from typing import List, Dict, Any
from groq import Groq
from engine.logger import setup_logger
from engine.schemas import Document

logger = setup_logger("synthesize_llm")

def generate_insights(theme_name: str, docs: List[Document]) -> List[Dict[str, Any]]:
    """
    Uses Groq to generate draft insights from a theme and its representative documents.
    Fallback from Gemini Pro (P5-1).
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY missing. Cannot synthesize insights.")
        return []
        
    client = Groq(api_key=api_key)
    
    # Format documents for context
    context = ""
    for d in docs:
        context += f"Document ID: {d.document_id}\nText: {d.text_english if d.text_english else d.text_original}\nSource: {d.source_detail}\n---\n"
        
    prompt = f"""
You are a senior Product Manager at Blinkit analyzing user reviews to understand category expansion and discovery behavior.

We have clustered a set of reviews into the theme: "{theme_name}"

Review Data:
{context}

Your task is to synthesize 1 to 3 key business insights from this theme.
Output a JSON array of objects, where each object matches this schema:
{{
  "title": "Short, punchy insight title",
  "description": "Detailed explanation of the insight, focusing on the root cause and user behavior.",
  "confidence_score": 0.0 to 1.0 (float representing how strongly the data supports this),
  "document_ids": ["id1", "id2", "id3"] (Array of AT LEAST 3 distinct Document IDs from the context that prove this insight),
  "quotes": ["Exact quote 1", "Exact quote 2"] (Array of verbatim quotes from the context proving this),
  "falsifier": "What evidence would prove this insight wrong?",
  "answers_brief_question": integer 1 to 8 (Which brief question this best answers, see list below)
}}

Brief Questions (pick the most relevant one for 'answers_brief_question'):
1. Why do users repeatedly buy from the same categories?
2. What prevents users from exploring new categories?
3. How do users discover products today?
4. What role do habits play in shopping behaviour?
5. What information do users need before trying a new category?
6. What frustrations emerge repeatedly?
7. Which user segments are more likely to experiment?
8. What unmet needs emerge consistently across discussions?

CRITICAL CONSTRAINTS:
1. You MUST return valid JSON format (an array of objects).
2. 'document_ids' MUST contain at least 3 distinct IDs exactly as they appear in the Review Data.
3. 'quotes' MUST be verbatim from the text.
"""

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        content = response.choices[0].message.content
        # Groq might wrap array in an object like {"insights": [...]} due to json_object enforcement
        parsed = json.loads(content)
        
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict):
            # Find the first array value
            for val in parsed.values():
                if isinstance(val, list):
                    return val
            return [parsed] # Fallback if it returned a single object
        else:
            logger.warning(f"Unexpected JSON structure from Groq for theme {theme_name}")
            return []
            
    except Exception as e:
        logger.error(f"Synthesis failed for theme {theme_name}: {e}")
        return []
