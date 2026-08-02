import os
import time
import numpy as np
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from google import genai

from engine.schemas import Document
from engine.logger import setup_logger

logger = setup_logger("embed")

def generate_embeddings_tfidf(texts: List[str]) -> np.ndarray:
    """Fallback TF-IDF local embedding."""
    logger.info("Falling back to local TF-IDF embedding...")
    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))
    sparse_matrix = vectorizer.fit_transform(texts)
    n_components = min(384, len(texts) - 1)
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    return svd.fit_transform(sparse_matrix)

def generate_embeddings(docs: List[Document]) -> np.ndarray:
    """
    Generates dense vectors using Gemini text-embedding-004 (P3-1).
    Falls back to local TF-IDF if the API key lacks embedding permissions.
    """
    if not docs:
        return np.array([])
        
    texts = [doc.text_english if doc.text_english else doc.text_original for doc in docs]
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set. Cannot use Gemini Embeddings.")
        return generate_embeddings_tfidf(texts)
        
    client = genai.Client(api_key=api_key)
    logger.info(f"Attempting Gemini embeddings for {len(texts)} documents...")
    
    batch_size = 100
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        logger.info(f"Embedding batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}...")
        
        retries = 0
        success = False
        while retries < 3:
            try:
                response = client.models.embed_content(
                    model='text-embedding-004',
                    contents=batch,
                )
                for emb in response.embeddings:
                    all_embeddings.append(emb.values)
                success = True
                break
            except Exception as e:
                retries += 1
                logger.warning(f"Error calling Gemini Embeddings: {e}")
                time.sleep(1)
                
        if not success:
            logger.error("Gemini Embeddings failed permanently (likely a 404 API tier permission error).")
            # If a single batch fails, we must fallback entirely so dimensions don't mismatch
            return generate_embeddings_tfidf(texts)
            
        time.sleep(1) # Rate limit
        
    return np.array(all_embeddings)
