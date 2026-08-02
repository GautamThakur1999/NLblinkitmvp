import json
import hashlib
from typing import List
from pathlib import Path

from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger

logger = setup_logger("curated_loader")

def load_curated_export(filepath: str) -> List[Document]:
    """
    Loads a manually curated JSON export of forum/social data.
    Expected schema: [{"text": "...", "source_detail": "Twitter", "timestamp": "...", "url": "..."}]
    """
    path = Path(filepath)
    if not path.exists():
        logger.warning(f"Curated export file {filepath} not found. Skipping.")
        return []
        
    docs: List[Document] = []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for idx, item in enumerate(data):
            text = item.get("text")
            if not text:
                continue
                
            source_detail = item.get("source_detail", "curated_forum")
            # Generate stable ID based on index if no natural ID exists
            item_id = str(item.get("id", idx))
            
            doc_id = hashlib.sha256(f"forum:{source_detail}:{item_id}".encode('utf-8')).hexdigest()
            
            docs.append(Document(
                document_id=doc_id,
                text_original=text,
                source="forum",
                source_detail=source_detail,
                author_id="curated_export_author", # Anonymous bulk
                created_at=item.get("timestamp", ""),
                metadata=DocumentMetadata(
                    url=item.get("url")
                )
            ))
        logger.info(f"Successfully loaded {len(docs)} curated documents.")
    except Exception as e:
        logger.error(f"Failed to load curated export: {e}")
        
    return docs
