import json
import google.generativeai as genai
from detoxify import Detoxify
from config import (
    GEMINI_API_KEY, GEMINI_MODEL,
    DETOXIFY_LOW_THRESHOLD, DETOXIFY_HIGH_THRESHOLD
)
from schemas import LayerResult, TextModerationResult, MisinformationResult

_detoxify_model = None
_gemini_model   = None


def _get_detoxify():
    global _detoxify_model
    if _detoxify_model is None:
        print("[TextClassifier] Loading Detoxify model...")
        _detoxify_model = Detoxify("original")
    return _detoxify_model


def _get_gemini():
    global _gemini_model
    if _gemini_model is None:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in .env")
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel(GEMINI_MODEL)
    return _gemini_model


# ── Layer 1: Detoxify (local, always runs) ────────────────────────────────────

def run_detoxify(text: str) -> LayerResult:
    try:
        model  = _get_detoxify()
        scores = model.predict(text)
        scores = {k: round(float(v), 4) for k, v in scores.items()}
        top    = max(scores, key=scores.get)
        top_val = scores[top]

        return LayerResult(
            triggered  = top_val >= DETOXIFY_LOW_THRESHOLD,
            confidence = top_val,
            reason     = f"Detoxify: '{top}' at {top_val:.0%}" if top_val >= DETOXIFY_LOW_THRESHOLD else "Detoxify: clean",
            model_used = "unitary/toxic-bert via Detoxify",
            raw_scores = scores,
        )
    except Exception as e:
        return LayerResult(
            triggered      = False,
            confidence     = 0.0,
            reason         = "Detoxify failed — treating as clean",
            model_used     = "detoxify",
            failure_reason = str(e),
        )


# ── Combined Gemini call (used in Path C — borderline toxicity) ───────────────

COMBINED_PROMPT = """You are a content moderation system. Analyze this social media post for TWO things.

Post:
\"\"\"
{text}
\"\"\"

TASK 1 — TOXICITY: Look for toxic/abusive/hateful language, threats, harassment, coded language, dog whistles.

TASK 2 — MISINFORMATION: Does the post make a verifiable factual claim (medical, scientific, statistical, historical)?
If yes — is it likely false or misleading?
If it's opinion/personal story/question → verdict: "opinion_no_check"
Only flag if reasonably confident. If unsure → "unverifiable"

Respond ONLY in this exact JSON (no markdown):
{{
  "toxicity": {{
    "is_toxic": true or false,
    "confidence": 0.0 to 1.0,
    "reason": "one sentence",
    "categories": {{"hate_speech": 0.0, "harassment": 0.0, "threat": 0.0, "coded_language": 0.0, "sarcastic_abuse": 0.0}}
  }},
  "misinformation": {{
    "claim_type": "factual_claim" or "opinion" or "no_claim",
    "claims_found": ["list of specific claims"],
    "contains_misinformation": true or false,
    "confidence": 0.0 to 1.0,
    "verdict": "likely_false" or "likely_misleading" or "unverifiable" or "likely_true" or "opinion_no_check",
    "explanation": "one sentence"
  }}
}}"""


# ── NEW: Lightweight misinfo-only Gemini prompt (Path A and B) ─────────────────
# Smaller prompt = fewer tokens = cheaper. No toxicity check here since
# Detoxify already handled that in Path A/B.

MISINFO_ONLY_PROMPT = """You are a misinformation detection system. Analyze this social media post.

Post:
\"\"\"
{text}
\"\"\"

Does this post make a verifiable factual claim (medical, scientific, statistical, historical facts)?
If yes — is the claim likely false or misleading based on established knowledge?
If it's just an opinion, personal story, or question → verdict: "opinion_no_check"
Only flag misinformation if you are reasonably confident. If unsure → "unverifiable"

Respond ONLY in this exact JSON (no markdown, no extra text):
{{
  "claim_type": "factual_claim" or "opinion" or "no_claim",
  "claims_found": ["list of specific claims extracted from the post"],
  "contains_misinformation": true or false,
  "confidence": 0.0 to 1.0,
  "verdict": "likely_false" or "likely_misleading" or "unverifiable" or "likely_true" or "opinion_no_check",
  "explanation": "one sentence explaining the decision"
}}"""


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── NEW: Misinfo-only Gemini call (lightweight) ───────────────────────────────

def run_misinfo_only(text: str) -> MisinformationResult:
    """
    Standalone misinfo check — called in Path A and B where Gemini
    wasn't being called at all before this fix.
    Uses a smaller prompt than the combined call to keep cost low.
    """
    try:
        model    = _get_gemini()
        response = model.generate_content(MISINFO_ONLY_PROMPT.format(text=text))
        data     = _parse_json(response.text)

        return MisinformationResult(
            contains_misinformation = bool(data.get("contains_misinformation", False)),
            confidence              = float(data.get("confidence", 0.0)),
            claim_type              = data.get("claim_type", "no_claim"),
            verdict                 = data.get("verdict", "unverifiable"),
            explanation             = data.get("explanation", ""),
            claims_found            = data.get("claims_found", []),
            model_used              = f"gemini/{GEMINI_MODEL} (misinfo-only)",
        )
    except Exception as e:
        return MisinformationResult(
            contains_misinformation = False,
            confidence              = 0.0,
            claim_type              = "no_claim",
            verdict                 = "unverifiable",
            explanation             = "Misinfo check failed",
            claims_found            = [],
            model_used              = f"gemini/{GEMINI_MODEL}",
            failure_reason          = str(e),
        )


# ── Combined Gemini call — toxicity + misinfo (Path C only) ──────────────────

def run_combined_gemini(text: str) -> tuple[LayerResult, MisinformationResult]:
    try:
        model    = _get_gemini()
        response = model.generate_content(COMBINED_PROMPT.format(text=text))
        data     = _parse_json(response.text)

        tox = data.get("toxicity", {})
        mis = data.get("misinformation", {})

        toxicity_layer = LayerResult(
            triggered  = bool(tox.get("is_toxic", False)),
            confidence = float(tox.get("confidence", 0.0)),
            reason     = tox.get("reason", ""),
            model_used = f"gemini/{GEMINI_MODEL} (combined)",
            raw_scores = tox.get("categories", {}),
        )

        misinfo_result = MisinformationResult(
            contains_misinformation = bool(mis.get("contains_misinformation", False)),
            confidence              = float(mis.get("confidence", 0.0)),
            claim_type              = mis.get("claim_type", "no_claim"),
            verdict                 = mis.get("verdict", "unverifiable"),
            explanation             = mis.get("explanation", ""),
            claims_found            = mis.get("claims_found", []),
            model_used              = f"gemini/{GEMINI_MODEL} (combined)",
        )

        return toxicity_layer, misinfo_result

    except Exception as e:
        fallback_layer = LayerResult(
            triggered      = False,
            confidence     = 0.0,
            reason         = "Gemini combined call failed",
            model_used     = f"gemini/{GEMINI_MODEL}",
            failure_reason = str(e),
        )
        fallback_misinfo = MisinformationResult(
            contains_misinformation = False,
            confidence              = 0.0,
            claim_type              = "no_claim",
            verdict                 = "unverifiable",
            explanation             = "Check failed",
            claims_found            = [],
            model_used              = f"gemini/{GEMINI_MODEL}",
            failure_reason          = str(e),
        )
        return fallback_layer, fallback_misinfo


# ── Main entry point ──────────────────────────────────────────────────────────

def classify_text(text: str) -> tuple[TextModerationResult, MisinformationResult | None]:
    """
    Returns (TextModerationResult, MisinformationResult).

    Path A (score < LOW):  detoxify clean + misinfo-only Gemini call   → 1 Gemini call
    Path B (score > HIGH): detoxify toxic + misinfo-only Gemini call   → 1 Gemini call
    Path C (borderline):   1 combined Gemini call (tox + misinfo)      → 1 Gemini call

    Max Gemini calls: always 1. Same cost as before, misinfo never skipped.
    """
    if not text or not text.strip():
        return TextModerationResult(
            is_toxic         = False,
            final_confidence = 0.0,
            categories       = {},
            layers           = [],
            model_chain      = "skipped — empty text",
        ), None

    layers = []

    detoxify_result = run_detoxify(text)
    layers.append(detoxify_result)
    score = detoxify_result.confidence

    # Path A: clearly clean toxicity — but still check misinfo (THE FIX)
    if score < DETOXIFY_LOW_THRESHOLD:
        print(f"[TextClassifier] Detoxify clean ({score:.2f}) — running misinfo check...")
        misinfo_result = run_misinfo_only(text)
        return TextModerationResult(
            is_toxic         = False,
            final_confidence = score,
            categories       = detoxify_result.raw_scores,
            layers           = layers,
            model_chain      = "detoxify (clean) → gemini misinfo-only",
        ), misinfo_result

    # Path B: clearly toxic — still check misinfo independently (THE FIX)
    if score >= DETOXIFY_HIGH_THRESHOLD:
        print(f"[TextClassifier] Detoxify high confidence toxic ({score:.2f}) — running misinfo check...")
        misinfo_result = run_misinfo_only(text)
        return TextModerationResult(
            is_toxic         = True,
            final_confidence = score,
            categories       = detoxify_result.raw_scores,
            layers           = layers,
            model_chain      = "detoxify (toxic) → gemini misinfo-only",
        ), misinfo_result

    # Path C: borderline — ONE combined Gemini call handles both (unchanged)
    print(f"[TextClassifier] Detoxify borderline {score:.2f} — escalating to Gemini (combined)...")
    gemini_layer, misinfo_result = run_combined_gemini(text)
    layers.append(gemini_layer)

    final_confidence = (
        gemini_layer.confidence if not gemini_layer.failure_reason else score
    )

    return TextModerationResult(
        is_toxic         = gemini_layer.triggered,
        final_confidence = final_confidence,
        categories       = {**detoxify_result.raw_scores, "gemini": gemini_layer.raw_scores},
        layers           = layers,
        model_chain      = "detoxify → gemini combined (1 API call)",
    ), misinfo_result