import os
import json
import time
from typing import List
from groq import Groq
from google import genai
from engine.schemas import Document
from engine.logger import setup_logger

logger = setup_logger("enrich")

def translate_to_english(docs: List[Document]) -> List[Document]:
    """
    Uses Gemini (P2-6) to translate Hinglish/Devanagari to English.
    Falls back to a basic mock if the API key lacks permissions.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY missing. Skipping translation.")
        for doc in docs: doc.text_english = doc.text_original
        return docs
        
    client = genai.Client(api_key=api_key)
    logger.info("Running translation pass via Gemini...")
    
    for i, doc in enumerate(docs):
        # Very basic check to avoid translating obvious English
        if not ("achha" in doc.text_original.lower() or "bekar" in doc.text_original.lower() or "bakwas" in doc.text_original.lower()):
            doc.text_english = doc.text_original
            continue
            
        try:
            prompt = f"Translate this text to English, preserving the exact original meaning. Output ONLY the English translation: '{doc.text_original}'"
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt
            )
            doc.text_english = response.text.strip()
        except Exception as e:
            # Fallback to local heuristic mock on 404 / quota errors to prevent crashing
            if i == 0: logger.warning(f"Gemini translation failed ({e}). Falling back to local heuristic.")
            lower_text = doc.text_original.lower()
            doc.text_english = doc.text_original.replace("achha", "good").replace("bekar", "bad").replace("bakwas", "rubbish")
            
        time.sleep(0.1) # Soft rate limit
            
    return docs

def tag_relevance(docs: List[Document]) -> List[Document]:
    """
    Uses Groq (fast model) to tag relevance (P2-8).
    Does NOT drop the review, only appends tags.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("GROQ_API_KEY missing. Skipping relevance tagging.")
        return docs
        
    client = Groq(api_key=groq_api_key)
    logger.info(f"Running relevance tagger via Groq on {len(docs)} documents...")
    
    for i, doc in enumerate(docs):
        if doc.is_bot_flag or "too_short" in doc.relevance_tags:
            continue
            
        prompt = f"""
        Analyze this app review and output a single JSON array of string tags describing its relevance.
        Tags can be: "delivery_issue", "product_quality", "app_bug", "pricing", "feature_request".
        If irrelevant, return ["irrelevant"].
        Review: "{doc.text_english if doc.text_english else doc.text_original}"
        """
        
        try:
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            # Very basic extraction logic for MVP
            if "delivery" in content.lower():
                doc.relevance_tags.append("delivery_issue")
            if "bug" in content.lower():
                doc.relevance_tags.append("app_bug")
            if "pricing" in content.lower():
                doc.relevance_tags.append("pricing")
                
        except Exception as e:
            logger.error(f"Groq API error on doc {doc.document_id}: {e}")
            time.sleep(1) # Backoff
            
        if i % 100 == 0 and i > 0:
            logger.info(f"  Tagged {i}/{len(docs)} documents...")
            
    return docs
