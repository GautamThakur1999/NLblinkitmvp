import re
from typing import List, Dict, Any, Set
from collections import defaultdict
from engine.schemas import Document
from engine.logger import setup_logger

logger = setup_logger("heuristics")

def extract_ngrams(text: str, n: int = 3) -> Set[str]:
    words = text.lower().split()
    if len(words) < n:
        return set([" ".join(words)])
    return set([" ".join(words[i:i+n]) for i in range(len(words)-n+1)])

def jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

def dedup_corpus(docs: List[Document], threshold: float = 0.85) -> List[Document]:
    """
    Simulates MinHash/LSH near-duplicate detection (P2-4).
    Collapses near-duplicates into a single document and retains the count.
    """
    logger.info("Starting near-duplicate detection...")
    unique_docs = []
    
    # Store ngrams for fast comparison
    doc_ngrams = []
    
    for doc in docs:
        ngrams = extract_ngrams(doc.text_original)
        is_duplicate = False
        
        for idx, existing_ngrams in enumerate(doc_ngrams):
            if jaccard_similarity(ngrams, existing_ngrams) >= threshold:
                # Collapse into existing doc
                unique_docs[idx].duplicate_count += 1
                is_duplicate = True
                break
                
        if not is_duplicate:
            unique_docs.append(doc)
            doc_ngrams.append(ngrams)
            
    logger.info(f"Dedup complete. Collapsed {len(docs) - len(unique_docs)} duplicates.")
    return unique_docs

def flag_bots(docs: List[Document]) -> List[Document]:
    """
    Flags bot / incentivized-review heuristics (P2-5).
    - Generic 5-star (e.g., just "good", "nice" with 5 stars)
    - Duplicate text across different authors
    """
    logger.info("Running bot heuristics...")
    
    # Track text frequencies to catch cross-author spam
    text_counts = defaultdict(int)
    for doc in docs:
        text_counts[doc.text_original.strip().lower()] += 1
        
    for doc in docs:
        text_lower = doc.text_original.strip().lower()
        
        # Condition 1: Generic 5-star
        is_generic = (
            doc.metadata.rating == 5 and 
            len(text_lower.split()) <= 2 and 
            any(w in text_lower for w in ['good', 'nice', 'awesome', 'best', 'super'])
        )
        
        # Condition 2: Exact same text spammed > 3 times (even across authors)
        is_spam_text = text_counts[text_lower] > 3 and len(text_lower.split()) > 2
        
        if is_generic or is_spam_text:
            doc.is_bot_flag = True
            
    return docs

def flag_minimum_content(docs: List[Document]) -> List[Document]:
    """
    Tags emoji-only or extremely short reviews (P2-7).
    Never silently drops them, just adds a tag.
    """
    logger.info("Running minimum-content filter...")
    
    emoji_pattern = re.compile(r'^[^\w\s]+$')
    
    for doc in docs:
        text = doc.text_original.strip()
        
        # Emoji only
        if emoji_pattern.match(text):
            doc.relevance_tags.append("emoji_only")
            
        # Less than 3 words (if not already tagged generic by bot filter)
        elif len(text.split()) < 3:
            doc.relevance_tags.append("too_short")
            
    return docs
