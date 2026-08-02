import hashlib
import time
from typing import List, Optional
from google_play_scraper import Sort, reviews
from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger

logger = setup_logger("play_store_scraper")

def _hash_id(source: str, source_detail: str, item_id: str) -> str:
    return hashlib.sha256(f"{source}:{source_detail}:{item_id}".encode('utf-8')).hexdigest()

def scrape_play_store(app_id: str, count: int = 1000) -> List[Document]:
    """
    Scrapes reviews from the Play Store for a given app_id.
    Explicitly checks that we are scraping the right app.
    """
    allowed_apps = ["com.grofers.customerapp", "com.zeptoconsumerapp", "in.swiggy.android"]
    if app_id not in allowed_apps:
        logger.error(f"App ID {app_id} is not in the allowed list to prevent EC-G14 (wrong app scraping).")
        raise ValueError(f"App ID {app_id} blocked by EC-G14 guard.")
        
    logger.info(f"Starting Play Store scrape for {app_id}, target count: {count}")
    
    docs: List[Document] = []
    continuation_token = None
    fetched = 0
    
    # Retry mechanism for rate limits
    max_retries = 3
    
    while fetched < count:
        retries = 0
        batch_results = []
        while retries < max_retries:
            try:
                batch_results, continuation_token = reviews(
                    app_id,
                    lang='en', # default to en, though we will translate later if it contains hindi
                    country='in',
                    sort=Sort.NEWEST,
                    count=min(199, count - fetched), # Google play scraper limits count per page
                    continuation_token=continuation_token
                )
                break
            except Exception as e:
                retries += 1
                logger.warning(f"Error scraping {app_id}, retry {retries}/{max_retries}: {e}")
                time.sleep(2 ** retries)
                
        if not batch_results:
            logger.info(f"No more reviews found for {app_id} or max retries hit.")
            break
            
        for rev in batch_results:
            doc_id = _hash_id("play_store", app_id, rev.get('reviewId', ''))
            author_id = hashlib.sha256(rev.get('userName', 'anonymous').encode('utf-8')).hexdigest()
            
            doc = Document(
                document_id=doc_id,
                text_original=rev.get('content', ''),
                source="play_store",
                source_detail=app_id,
                author_id=author_id,
                created_at=rev.get('at').isoformat() if rev.get('at') else "",
                metadata=DocumentMetadata(
                    rating=rev.get('score'),
                    upvotes=rev.get('thumbsUpCount'),
                    app_version=rev.get('reviewCreatedVersion')
                )
            )
            docs.append(doc)
            fetched += 1
            
            if fetched >= count:
                break
                
        # Be nice to the API
        time.sleep(1)
        
        if not continuation_token:
            break
            
    logger.info(f"Successfully scraped {len(docs)} reviews for {app_id}")
    return docs
