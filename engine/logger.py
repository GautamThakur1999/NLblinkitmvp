import logging
import sys
import uuid
from typing import Optional

def setup_logger(name: str, run_id: Optional[str] = None) -> logging.Logger:
    """
    Creates a structured logger that includes a run_id for traceability.
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        
        if run_id is None:
            run_id = str(uuid.uuid4())[:8]
            
        formatter = logging.Formatter(
            f'%(asctime)s | RUN:{run_id} | %(levelname)s | %(name)s | %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger
