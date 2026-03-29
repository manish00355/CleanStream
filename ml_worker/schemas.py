from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class ModerationJobInput:
    """What Node.js pushes into the queue (or what you pass directly for testing)"""
    job_id: str
    post_id: str
    text: Optional[str] = None        # post body text
    image_url: Optional[str] = None   # local path OR http URL


@dataclass
class LayerResult:
    """Result from a single model/layer"""
    triggered: bool                   # did this layer flag it?
    confidence: float                 # 0.0 → 1.0
    reason: str                       # human-readable reason
    model_used: str
    raw_scores: dict = field(default_factory=dict)  # full breakdown from model
    failure_reason: Optional[str] = None            # if model crashed/failed


@dataclass
class TextModerationResult:
    is_toxic: bool
    final_confidence: float
    categories: dict                  # detoxify breakdown
    layers: list[LayerResult]         # full audit trail — every layer's decision
    model_chain: str                  # e.g. "detoxify → gemini"
    failure_reason: Optional[str] = None


@dataclass
class MisinformationResult:
    """Result from the misinformation check — runs independently of toxicity"""
    contains_misinformation: bool
    confidence: float                 # 0.0 → 1.0
    claim_type: str                   # "factual_claim" | "opinion" | "no_claim"
    verdict: str                      # "likely_false" | "unverifiable" | "likely_true" | "opinion_no_check"
    explanation: str                  # why Gemini thinks it's misinformation
    claims_found: list[str]           # specific claims extracted from the text
    model_used: str = "gemini"
    failure_reason: Optional[str] = None


@dataclass
class ImageModerationResult:
    is_inappropriate: bool
    final_confidence: float
    nudenet_labels: list              # what nudenet found
    text_on_image: Optional[str]      # OCR text extracted by Gemini Vision
    image_text_toxic: bool            # was text-on-image toxic?
    layers: list[LayerResult]
    model_chain: str
    failure_reason: Optional[str] = None


@dataclass
class ModerationResult:
    """Final output — written back to MongoDB"""
    job_id: str
    post_id: str
    final_verdict: str                # "approved" | "flagged" | "rejected"
    flag_reasons: list[str]           # ["toxic_text", "nsfw_image", "text_on_image", "misinformation"]
    text_result: Optional[TextModerationResult] = None
    image_result: Optional[ImageModerationResult] = None
    misinfo_result: Optional[MisinformationResult] = None
    processed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    processing_ms: int = 0            # how long the full pipeline took
