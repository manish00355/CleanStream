import os
import json
import requests
import tempfile
from PIL import Image
import google.generativeai as genai
from nudenet import NudeDetector
from config import GEMINI_API_KEY, GEMINI_MODEL, NUDENET_THRESHOLD
from schemas import LayerResult, ImageModerationResult

_nude_detector = None
_gemini_model  = None

# NudeNet labels that are definitely NSFW
NSFW_LABELS = {
    "FEMALE_BREAST_EXPOSED", "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED", "ANUS_EXPOSED",
    "BUTTOCKS_EXPOSED", "MALE_BREAST_EXPOSED",
}

# Labels that are borderline (covered but suggestive)
BORDERLINE_LABELS = {
    "FEMALE_BREAST_COVERED", "FEMALE_GENITALIA_COVERED",
    "BUTTOCKS_COVERED",
}


def _get_nudenet():
    global _nude_detector
    if _nude_detector is None:
        print("[ImageClassifier] Loading NudeNet...")
        _nude_detector = NudeDetector()
    return _nude_detector


def _get_gemini():
    global _gemini_model
    if _gemini_model is None:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in .env")
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel(GEMINI_MODEL)
    return _gemini_model


def _load_image(image_url: str) -> str:
    """
    Returns a local file path.
    If image_url is already a local path, return as-is.
    If it's an http URL, download to a temp file.
    """
    if image_url.startswith("http://") or image_url.startswith("https://"):
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        suffix = ".jpg"
        if "png" in image_url.lower():
            suffix = ".png"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp.write(resp.content)
        tmp.close()
        return tmp.name
    return image_url


# ── Layer 1: NudeNet ──────────────────────────────────────────────────────────

def run_nudenet(image_path: str) -> LayerResult:
    try:
        detector = _get_nudenet()
        results  = detector.detect(image_path)
        # results = [{"class": "FEMALE_BREAST_EXPOSED", "score": 0.91, "box": [...]}, ...]

        found_nsfw        = []
        found_borderline  = []
        max_confidence    = 0.0

        for det in results:
            label = det.get("class", "")
            score = float(det.get("score", 0.0))
            if score < NUDENET_THRESHOLD:
                continue
            max_confidence = max(max_confidence, score)
            if label in NSFW_LABELS:
                found_nsfw.append({"label": label, "confidence": round(score, 3)})
            elif label in BORDERLINE_LABELS:
                found_borderline.append({"label": label, "confidence": round(score, 3)})

        triggered = len(found_nsfw) > 0
        reason = (
            f"NudeNet found: {[x['label'] for x in found_nsfw]}" if triggered
            else ("Borderline content detected" if found_borderline else "NudeNet: clean")
        )

        return LayerResult(
            triggered  = triggered,
            confidence = max_confidence,
            reason     = reason,
            model_used = "NudeNet v3",
            raw_scores = {"nsfw": found_nsfw, "borderline": found_borderline},
        )
    except Exception as e:
        return LayerResult(
            triggered      = False,
            confidence     = 0.0,
            reason         = "NudeNet failed",
            model_used     = "NudeNet v3",
            failure_reason = str(e),
        )


# ── Layer 2: Gemini Vision — NSFW + text-on-image in one call ─────────────────

GEMINI_IMAGE_PROMPT = """You are a content moderation system analyzing a user-submitted image.

Please do two things:

1. VISUAL CHECK: Is this image inappropriate, NSFW, sexually suggestive, violent, gory, or otherwise harmful?

2. TEXT EXTRACTION: Read ALL text visible in this image (signs, overlays, memes, captions, watermarks, handwriting). 
   Then assess if any of that text is toxic, hateful, abusive, threatening, or harmful.

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "is_inappropriate": true or false,
  "visual_confidence": 0.0 to 1.0,
  "visual_reason": "one sentence",
  "text_found": "exact text you read from the image, or null if none",
  "text_is_toxic": true or false,
  "text_confidence": 0.0 to 1.0,
  "text_reason": "one sentence about the text, or null",
  "overall_safe": true or false
}"""


def run_gemini_vision(image_path: str) -> tuple[LayerResult, str | None, bool]:
    """
    Returns: (layer_result, extracted_text, text_is_toxic)
    """
    try:
        model = _get_gemini()
        img   = Image.open(image_path)

        response = model.generate_content([GEMINI_IMAGE_PROMPT, img])
        raw = response.text.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)

        triggered = not data.get("overall_safe", True)
        confidence = max(
            float(data.get("visual_confidence", 0.0)),
            float(data.get("text_confidence", 0.0))
        )

        reason_parts = [data.get("visual_reason", "")]
        if data.get("text_is_toxic"):
            reason_parts.append(f"Text on image: {data.get('text_reason', '')}")

        return (
            LayerResult(
                triggered  = triggered,
                confidence = confidence,
                reason     = " | ".join(filter(None, reason_parts)),
                model_used = f"gemini-vision/{GEMINI_MODEL}",
                raw_scores = data,
            ),
            data.get("text_found"),
            bool(data.get("text_is_toxic", False)),
        )
    except Exception as e:
        return (
            LayerResult(
                triggered      = False,
                confidence     = 0.0,
                reason         = "Gemini Vision failed",
                model_used     = f"gemini-vision/{GEMINI_MODEL}",
                failure_reason = str(e),
            ),
            None,
            False,
        )


# ── Main entry point ──────────────────────────────────────────────────────────

def classify_image(image_url: str) -> ImageModerationResult:
    """
    2-layer pipeline:
      Layer 1: NudeNet — fast local NSFW detection
      Layer 2: Gemini Vision — catches borderline visuals + reads text on image
    
    Gemini Vision ALWAYS runs (unlike text where it's only borderline).
    Reason: text-on-image check is critical and NudeNet can't do it.
    """
    layers        = []
    text_on_image = None
    text_is_toxic = False

    try:
        image_path = _load_image(image_url)
    except Exception as e:
        return ImageModerationResult(
            is_inappropriate = False,
            final_confidence = 0.0,
            nudenet_labels   = [],
            text_on_image    = None,
            image_text_toxic = False,
            layers           = [],
            model_chain      = "failed — image load error",
            failure_reason   = str(e),
        )

    # Layer 1: NudeNet
    nudenet_result = run_nudenet(image_path)
    layers.append(nudenet_result)

    # Layer 2: Gemini Vision (always runs for text-on-image check)
    print("[ImageClassifier] Running Gemini Vision (text-on-image + visual check)...")
    gemini_result, text_on_image, text_is_toxic = run_gemini_vision(image_path)
    layers.append(gemini_result)

    # Final decision: flag if EITHER layer flags it
    is_inappropriate = nudenet_result.triggered or gemini_result.triggered or text_is_toxic
    final_confidence = max(nudenet_result.confidence, gemini_result.confidence)

    nudenet_labels = (
        nudenet_result.raw_scores.get("nsfw", []) +
        nudenet_result.raw_scores.get("borderline", [])
    )

    model_chain = "nudenet → gemini-vision"
    if nudenet_result.failure_reason:
        model_chain = "gemini-vision only (nudenet failed)"

    return ImageModerationResult(
        is_inappropriate = is_inappropriate,
        final_confidence = final_confidence,
        nudenet_labels   = nudenet_labels,
        text_on_image    = text_on_image,
        image_text_toxic = text_is_toxic,
        layers           = layers,
        model_chain      = model_chain,
    )
