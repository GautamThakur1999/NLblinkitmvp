import re
import unicodedata

def normalize_whitespace(text: str) -> str:
    """
    Standardizes unicode and whitespace.
    This is load-bearing (P2-10): MUST be used identically during quote verification (V4.1).
    """
    if not text:
        return ""
    
    # Normalize unicode (NFKC normalizes compatibility characters like ﬀ to ff)
    text = unicodedata.normalize("NFKC", text)
    
    # EC-G10: Strip Gemini-Flash conversational translation artifacts
    text = re.sub(r'(?i)^(here is the translation:|translated text:|translation:)\s*', '', text)
    
    # Replace any sequence of whitespace (newlines, tabs, multiple spaces) with a single space
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()
