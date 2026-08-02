import json
import hashlib
import time
import urllib.request
from typing import List
from urllib.error import URLError

from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger

logger = setup_logger("app_store_scraper")

def _hash_id(source: str, source_detail: str, item_id: str) -> str:
    return hashlib.sha256(f"{source}:{source_detail}:{item_id}".encode('utf-8')).hexdigest()

def scrape_app_store(app_id: str, count: int = 500) -> List[Document]:
    """
    Scrapes reviews from the Apple App Store RSS feed for a given app_id.
    """
    # Blinkit (909851600), Zepto (1578276459), Instamart/Swiggy (989540920)
    allowed_apps = ["909851600", "1578276459", "989540920"]
    if app_id not in allowed_apps:
        logger.error(f"App ID {app_id} blocked by EC-G14 guard.")
        raise ValueError(f"App ID {app_id} not allowed.")

    logger.info(f"Starting App Store scrape for {app_id}, target count: {count}")
    docs: List[Document] = []
    
    # iTunes RSS limits to 10 pages of 50 reviews (max 500 reviews)
    max_pages = min(10, (count // 50) + 1)
    
    for page in range(1, max_pages + 1):
        url = f"https://itunes.apple.com/in/rss/customerreviews/page={page}/id={app_id}/sortby=mostrecent/json"
        
        retries = 0
        max_retries = 3
        data = None
        
        while retries < max_retries:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read().decode('utf-8'))
                break
            except URLError as e:
                retries += 1
                logger.warning(f"Error fetching {url}, retry {retries}/{max_retries}: {e}")
                time.sleep(2 ** retries)
                
        if not data or 'feed' not in data or 'entry' not in data['feed']:
            logger.info("No more entries found in App Store RSS.")
            break
            
        entries = data['feed']['entry']
        if isinstance(entries, dict):
            # Sometimes single entry comes as dict instead of list
            entries = [entries]
            
        for entry in entries:
            # Skip the first entry if it's the app itself (it often is in iTunes RSS)
            if 'author' not in entry or 'name' not in entry['author']:
                continue
                
            rev_id = entry.get('id', {}).get('label', '')
            author = entry['author']['name'].get('label', 'anonymous')
            content = entry.get('content', {}).get('label', '')
            rating = int(entry.get('im:rating', {}).get('label', '0'))
            version = entry.get('im:version', {}).get('label', '')
            
            doc_id = _hash_id("app_store", app_id, rev_id)
            author_id = hashlib.sha256(author.encode('utf-8')).hexdigest()
            
            docs.append(Document(
                document_id=doc_id,
                text_original=content,
                source="app_store",
                source_detail=app_id,
                author_id=author_id,
                created_at="", # iTunes RSS doesn't reliably give timestamp in this feed
                metadata=DocumentMetadata(
                    rating=rating,
                    app_version=version
                )
            ))
            
            if len(docs) >= count:
                break
                
        if len(docs) >= count:
            break
            
        time.sleep(1) # Rate limit backoff
        
    logger.info(f"Successfully scraped {len(docs)} reviews for App Store {app_id}")
    return docs
