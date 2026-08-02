import random
from typing import List, Dict
from engine.schemas import Document
from engine.logger import setup_logger

logger = setup_logger("sampling")

def sample_cluster_docs(cluster_doc_ids: List[str], all_docs_map: Dict[str, Document], n: int = 10) -> List[Document]:
    """
    Selects representative documents for a cluster (P4-1).
    Since we bypassed PyTorch dense vectors, we perform a robust random uniform 
    sample of size n to represent the cluster density.
    """
    valid_docs = []
    for d_id in cluster_doc_ids:
        if d_id in all_docs_map:
            valid_docs.append(all_docs_map[d_id])
            
    if not valid_docs:
        return []
        
    sample_size = min(len(valid_docs), n)
    # Ensure reproducible sampling for the MVP
    random.seed(42)
    sample = random.sample(valid_docs, sample_size)
    return sample
