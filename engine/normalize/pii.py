import re
from engine.logger import setup_logger

logger = setup_logger("pii_scrubber")

# Simple regex patterns for common PII
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'(\+91[\-\s]?)?[6-9]\d{9}')
ORDER_ID_REGEX = re.compile(r'(?i)\b(?:order id|order|id)[\s:#-]*([a-z0-9]{8,15})\b')

def scrub_pii(text: str) -> str:
    """
    Strips PII from text before it's saved or sent to any model (P2-2).
    Replaces matches with [EMAIL], [PHONE], [ORDER_ID].
    """
    if not text:
        return ""
        
    scrubbed = EMAIL_REGEX.sub('[EMAIL]', text)
    scrubbed = PHONE_REGEX.sub('[PHONE]', scrubbed)
    
    # For order ID, we replace just the captured group
    def order_id_replacer(match):
        return match.group(0).replace(match.group(1), '[ORDER_ID]')
        
    scrubbed = ORDER_ID_REGEX.sub(order_id_replacer, scrubbed)
    
    return scrubbed
