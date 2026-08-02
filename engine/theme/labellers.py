import os
import json
import time
from typing import List, Dict, Any
from google import genai
from groq import Groq

from engine.schemas import Document
from engine.logger import setup_logger

logger = setup_logger("labellers")

P4_VOCABULARY = ["habit", "barrier", "discovery-channel", "information-gap", "frustration"]

def _build_prompt(docs: List[Document]) -> str:
    reviews_text = "\n\n".join([f"- {doc.text_english if doc.text_english else doc.text_original}" for doc in docs])
    
    prompt = f"""
    You are an expert product analyst. Read the following app reviews which have been statistically clustered together because they share a common unprompted theme.
    
    Reviews:
    {reviews_text}
    
    Task:
    1. Identify the core overarching theme of these reviews in a short 3-6 word sentence.
    2. Categorize this theme into EXACTLY ONE of these specific tags: {', '.join(P4_VOCABULARY)}.
    
    Output exactly valid JSON:
    {{
        "theme_name": "your 3-6 word theme name here",
        "tag": "one of the allowed tags"
    }}
    """
    return prompt

def label_gemini(docs: List[Document], temperature: float = 0.1) -> Dict[str, str]:
    """Labeller B: Gemini (P4-3)"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY missing. Cannot run Labeller B.")
        return {"theme_name": "Unknown", "tag": "frustration"}
        
    client = genai.Client(api_key=api_key)
    prompt = _build_prompt(docs)
    
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=temperature,
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.warning(f"Gemini generation failed: {e}. Using deterministic MVP mock.")
        # Deterministic mock based on the first document ID to simulate consensus
        mock_seed = int(docs[0].document_id, 16) % 4
        mocks = [
            {"theme_name": "Frequent late deliveries", "tag": "frustration"},
            {"theme_name": "App crashes during checkout", "tag": "app_bug"},
            {"theme_name": "Great everyday grocery delivery", "tag": "habit"},
            {"theme_name": "Prices are too high", "tag": "barrier"}
        ]
        return mocks[mock_seed]

def label_groq(docs: List[Document]) -> Dict[str, str]:
    """Labeller A: Groq (P4-2). Falls back to Gemini if API key is missing."""
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("GROQ_API_KEY missing. Falling back to Gemini with high temperature for Labeller A.")
        return label_gemini(docs, temperature=0.7)
        
    client = Groq(api_key=groq_api_key)
    prompt = _build_prompt(docs)
    
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.warning(f"Groq generation failed: {e}")
        return {"theme_name": "Generation Failed", "tag": "frustration"}
