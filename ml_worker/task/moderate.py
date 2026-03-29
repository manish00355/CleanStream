import time
from schemas import ModerationJobInput, ModerationResult
from models.text_classifier import classify_text
from models.image_classifier import classify_image


def determine_verdict(text_result=None, image_result=None, misinfo_result=None):
    flag_reasons   = []
    max_confidence = 0.0

    if text_result and text_result.is_toxic:
        flag_reasons.append("toxic_text")
        max_confidence = max(max_confidence, text_result.final_confidence)

    if image_result:
        if image_result.is_inappropriate:
            flag_reasons.append("nsfw_image")
            max_confidence = max(max_confidence, image_result.final_confidence)
        if image_result.image_text_toxic:
            flag_reasons.append("toxic_text_on_image")
            max_confidence = max(max_confidence, image_result.final_confidence)

    if misinfo_result and misinfo_result.contains_misinformation:
        flag_reasons.append("misinformation")
        # Intentionally excluded from max_confidence — misinfo never auto-rejects

    if not flag_reasons:
        return "approved", []

    non_misinfo = [r for r in flag_reasons if r != "misinformation"]
    if non_misinfo and max_confidence >= 0.85:
        return "rejected", flag_reasons

    return "flagged", flag_reasons


def run_moderation(job: ModerationJobInput) -> ModerationResult:
    """
    Pipeline:
      Text  → Detoxify (local) → if borderline: ONE Gemini call (toxicity + misinfo combined)
      Image → NudeNet (local)  → Gemini Vision (NSFW + text-on-image)

    Max Gemini calls per post:
      text-only post  : 0 (obvious cases) or 1 (borderline)
      image-only post : 1 (Gemini Vision always runs for text-on-image)
      text + image    : 0 or 1 (text) + 1 (image) = max 2 total
    """
    start_ms = int(time.time() * 1000)
    print(f"\n{'='*60}")
    print(f"[Pipeline] post: {job.post_id}")
    print(f"  text : {repr(job.text[:80]) if job.text else 'None'}")
    print(f"  image: {job.image_url or 'None'}")
    print(f"{'='*60}")

    text_result    = None
    image_result   = None
    misinfo_result = None

    # Text: Detoxify + optional combined Gemini
    if job.text:
        print("\n[Pipeline] -> Text moderation...")
        text_result, misinfo_result = classify_text(job.text)
        print(f"[Pipeline]   toxic={text_result.is_toxic} ({text_result.final_confidence:.2f}) | chain='{text_result.model_chain}'")
        if misinfo_result:
            print(f"[Pipeline]   misinfo={misinfo_result.contains_misinformation} | verdict='{misinfo_result.verdict}'")
        else:
            print(f"[Pipeline]   misinfo=skipped (Gemini not called)")

    # Image: NudeNet + Gemini Vision
    if job.image_url:
        print("\n[Pipeline] -> Image moderation...")
        image_result = classify_image(job.image_url)
        print(f"[Pipeline]   inappropriate={image_result.is_inappropriate} ({image_result.final_confidence:.2f})")
        print(f"[Pipeline]   text_on_image={repr(image_result.text_on_image)}")

    verdict, flag_reasons = determine_verdict(text_result, image_result, misinfo_result)
    elapsed_ms = int(time.time() * 1000) - start_ms

    print(f"\n[Pipeline] VERDICT: {verdict.upper()} | reasons: {flag_reasons or 'none'} | {elapsed_ms}ms\n")

    return ModerationResult(
        job_id         = job.job_id,
        post_id        = job.post_id,
        final_verdict  = verdict,
        flag_reasons   = flag_reasons,
        text_result    = text_result,
        image_result   = image_result,
        misinfo_result = misinfo_result,
        processing_ms  = elapsed_ms,
    )
