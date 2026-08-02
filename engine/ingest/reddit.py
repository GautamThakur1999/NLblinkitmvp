import os
import hashlib
import time
from typing import List
import praw

from engine.schemas import Document, DocumentMetadata
from engine.logger import setup_logger

logger = setup_logger("reddit_scraper")

def _hash_id(source: str, source_detail: str, item_id: str) -> str:
    return hashlib.sha256(f"{source}:{source_detail}:{item_id}".encode('utf-8')).hexdigest()

def scrape_reddit(subreddit_names: List[str], search_queries: List[str], limit_per_query: int = 50) -> List[Document]:
    """
    Scrapes Reddit comments for specific queries across multiple subreddits.
    Treats comments as individual documents (EC-G7).
    """
    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        logger.warning("Reddit API credentials missing. Skipping Reddit scrape.")
        return []
        
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent="script:discovery_engine:v1.0 (by /u/anonymous)"
    )
    
    docs: List[Document] = []
    
    for sub_name in subreddit_names:
        logger.info(f"Searching r/{sub_name}")
        try:
            subreddit = reddit.subreddit(sub_name)
            for query in search_queries:
                # Search for submissions
                for submission in subreddit.search(query, limit=limit_per_query):
                    # We process comments, not just the submission text, because "reasoning lives in comments"
                    submission.comments.replace_more(limit=0) # Flatten comments
                    for comment in submission.comments.list():
                        if not comment.body or comment.body == '[deleted]':
                            continue
                            
                        doc_id = _hash_id("reddit", sub_name, comment.id)
                        author_name = comment.author.name if comment.author else 'anonymous'
                        author_id = hashlib.sha256(author_name.encode('utf-8')).hexdigest()
                        
                        docs.append(Document(
                            document_id=doc_id,
                            text_original=comment.body,
                            source="reddit",
                            source_detail=sub_name,
                            author_id=author_id,
                            created_at=str(comment.created_utc),
                            metadata=DocumentMetadata(
                                upvotes=comment.score,
                                url=f"https://reddit.com{comment.permalink}"
                            )
                        ))
        except Exception as e:
            logger.error(f"Failed searching subreddit {sub_name}: {e}")
            
        time.sleep(2) # Be polite to Reddit API
        
    logger.info(f"Successfully scraped {len(docs)} Reddit comments.")
    return docs
