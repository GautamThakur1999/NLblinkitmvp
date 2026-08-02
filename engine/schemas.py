from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

@dataclass
class DocumentMetadata:
    rating: Optional[int] = None
    upvotes: Optional[int] = None
    url: Optional[str] = None
    app_version: Optional[str] = None

@dataclass
class Document:
    document_id: str
    text_original: str
    source: str  # 'play_store' | 'app_store' | 'reddit' | 'forum' | 'social'
    source_detail: str
    author_id: str
    created_at: str
    metadata: DocumentMetadata
    text_english: Optional[str] = None
    duplicate_count: int = 1
    is_bot_flag: bool = False
    relevance_tags: List[str] = field(default_factory=list)
    theme_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "text_original": self.text_original,
            "text_english": self.text_english,
            "source": self.source,
            "source_detail": self.source_detail,
            "author_id": self.author_id,
            "created_at": self.created_at,
            "metadata": {
                "rating": self.metadata.rating,
                "upvotes": self.metadata.upvotes,
                "url": self.metadata.url,
                "app_version": self.metadata.app_version
            },
            "duplicate_count": self.duplicate_count,
            "is_bot_flag": self.is_bot_flag,
            "relevance_tags": self.relevance_tags,
            "theme_id": self.theme_id
        }

@dataclass
class Insight:
    insight_id: str
    theme_id: str
    title: str
    description: str
    confidence_score: float
    document_ids: List[str]
    quotes: List[str]
    falsifier: str
    answers_brief_question: int
    is_competitor_only: bool
    source_entropy: float
    rank_score: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "insight_id": self.insight_id,
            "theme_id": self.theme_id,
            "title": self.title,
            "description": self.description,
            "confidence_score": self.confidence_score,
            "document_ids": self.document_ids,
            "quotes": self.quotes,
            "falsifier": self.falsifier,
            "answers_brief_question": self.answers_brief_question,
            "is_competitor_only": self.is_competitor_only,
            "source_entropy": self.source_entropy,
            "rank_score": self.rank_score
        }

@dataclass
class ValidationReport:
    v4_1_groundedness_pass_rate: float
    v4_2_coverage_percentage: float
    v4_3_avg_source_entropy: float
    v4_4_stability: float
    v4_5_cross_model_agreement: float
    v4_7_adversarial_pass: bool
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "v4_1_groundedness_pass_rate": self.v4_1_groundedness_pass_rate,
            "v4_2_coverage_percentage": self.v4_2_coverage_percentage,
            "v4_3_avg_source_entropy": self.v4_3_avg_source_entropy,
            "v4_4_stability": self.v4_4_stability,
            "v4_5_cross_model_agreement": self.v4_5_cross_model_agreement,
            "v4_7_adversarial_pass": self.v4_7_adversarial_pass
        }
