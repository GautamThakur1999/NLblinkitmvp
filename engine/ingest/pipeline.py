import json
import os
from pathlib import Path
from engine.logger import setup_logger
from engine.ingest.play_store import scrape_play_store
from engine.ingest.app_store import scrape_app_store
from engine.ingest.reddit import scrape_reddit
from engine.ingest.curated import load_curated_export

logger = setup_logger("ingest_pipeline")

def run_pipeline():
    """
    Orchestrates the ingestion pipeline across all sources.
    Outputs to data/raw/raw_corpus.jsonl and a manifest.json.
    """
    raw_dir = Path("data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    corpus_file = raw_dir / "raw_corpus.jsonl"
    manifest_file = raw_dir / "manifest.json"
    
    manifest = {
        "play_store": 0,
        "app_store": 0,
        "reddit": 0,
        "forum": 0,
        "competitors_play_store": 0,
        "competitors_app_store": 0
    }
    
    total_docs = 0
    
    logger.info("Starting ingestion pipeline...")
    
    with open(corpus_file, 'w', encoding='utf-8') as f:
        def save_docs(docs, manifest_key):
            nonlocal total_docs
            for doc in docs:
                f.write(json.dumps(doc.to_dict()) + "\n")
                manifest[manifest_key] += 1
                total_docs += 1
                
        # 1. Play Store (Blinkit)
        try:
            blinkit_play = scrape_play_store("com.grofers.customerapp", count=500)
            save_docs(blinkit_play, "play_store")
        except Exception as e:
            logger.error(f"Failed to scrape Blinkit Play Store: {e}")
            
        # 2. App Store (Blinkit)
        try:
            blinkit_app = scrape_app_store("909851600", count=500)
            save_docs(blinkit_app, "app_store")
        except Exception as e:
            logger.error(f"Failed to scrape Blinkit App Store: {e}")
            
        # 3. Competitors (Zepto, Instamart)
        try:
            zepto_play = scrape_play_store("com.zeptoconsumerapp", count=300)
            swiggy_play = scrape_play_store("in.swiggy.android", count=300)
            save_docs(zepto_play + swiggy_play, "competitors_play_store")
            
            zepto_app = scrape_app_store("1578276459", count=300)
            swiggy_app = scrape_app_store("989540920", count=300)
            save_docs(zepto_app + swiggy_app, "competitors_app_store")
        except Exception as e:
            logger.error(f"Failed to scrape competitors: {e}")
            
        # 4. Reddit
        try:
            subreddits = [
                "india", "bangalore", "mumbai", "delhi", 
                "IndianFood", "PetsIndia", "IndianSkincareAddicts", "personalfinanceindia"
            ]
            queries = ["blinkit", "zepto", "instamart", "quick commerce", "10 minute delivery"]
            reddit_docs = scrape_reddit(subreddits, queries, limit_per_query=10)
            save_docs(reddit_docs, "reddit")
        except Exception as e:
            logger.error(f"Failed to scrape Reddit: {e}")
            
        # 5. Curated Forum
        try:
            curated_docs = load_curated_export("data/raw/forums_export.json")
            save_docs(curated_docs, "forum")
        except Exception as e:
            logger.error(f"Failed to load curated forums: {e}")
            
    # Save manifest
    with open(manifest_file, 'w', encoding='utf-8') as mf:
        json.dump(manifest, mf, indent=2)
        
    logger.info(f"Ingestion complete. Total documents saved: {total_docs}. Manifest written.")

if __name__ == "__main__":
    run_pipeline()
