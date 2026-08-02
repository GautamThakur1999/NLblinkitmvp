import numpy as np
from engine.logger import setup_logger

logger = setup_logger("guardrails")

class CorpusTooSmallError(Exception):
    pass

def check_sufficiency(corpus_size: int, threshold: int = 500):
    """
    Implements EC-G2: Corpus too small for stable clustering.
    Below threshold -> report limitation, do not lower thresholds.
    """
    if corpus_size < threshold:
        logger.error(f"EC-G2 triggered: Corpus size {corpus_size} is below the {threshold} threshold.")
        logger.error("Do not lower HDBSCAN thresholds. The statistical significance of themes would be fabricated.")
        raise CorpusTooSmallError(f"Corpus size {corpus_size} too small (threshold={threshold}).")

def check_degenerate(labels: np.ndarray):
    """
    Implements EC-G3 (one giant cluster) and EC-G4 (majority noise).
    """
    if len(labels) == 0:
        return
        
    total = len(labels)
    unique_labels, counts = np.unique(labels, return_counts=True)
    
    noise_count = 0
    max_cluster_fraction = 0.0
    
    for label, count in zip(unique_labels, counts):
        if label == -1:
            noise_count = count
        else:
            fraction = count / total
            if fraction > max_cluster_fraction:
                max_cluster_fraction = fraction
                
    noise_fraction = noise_count / total
    
    if noise_fraction > 0.60:
        logger.warning(f"EC-G4 triggered: Majority noise detected ({noise_fraction:.1%}). Themes may be weak.")
        
    if max_cluster_fraction > 0.50:
        logger.warning(f"EC-G3 triggered: One giant cluster detected ({max_cluster_fraction:.1%}). HDBSCAN failed to separate.")
