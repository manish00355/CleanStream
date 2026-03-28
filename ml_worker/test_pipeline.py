import sys
import os
import time
import uuid

# Make sure we can import from ml_worker regardless of where you run from
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schemas import ModerationJobInput
from tasks.moderate import run_moderation


# ─── Color helpers for terminal output ───────────────────────────────────────

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def verdict_color(v):
    return {
        "approved": GREEN,
        "flagged":  YELLOW,
        "rejected": RED,
    }.get(v, RESET)


# ─── Sample images ────────────────────────────────────────────────────────────
# All are public URLs — no downloads needed, classify_image handles fetching.

IMAGES = {
    # 100% safe: Wikimedia Commons nature photo
    "safe_nature": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Sunflower_from_Silesia2.jpg/800px-Sunflower_from_Silesia2.jpg",

    # ⚠️ Borderline — safe but skin exposure beach photo (tests NSFW thresholds)
    "borderline_beach": "https://i.pinimg.com/236x/32/62/cb/3262cba08d7150cf0eacffe05b9d0fe4.jpg",

    # 🚨 NSFW test — controlled synthetic / benchmark-style
    "nsfw_simulated": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM3lVUMBwFPfm5VK9WpEyzRklQiPaOSg9guw&s",
}


# ─── Test cases ───────────────────────────────────────────────────────────────

TEST_CASES = [
    # ── TEXT ONLY ─────────────────────────────────────────────────────────────

    {
        "label":       "✅ TEXT: Clearly clean",
        "text":        "Just had the best chai of my life at this little place in Lucknow. Highly recommend!",
        "image_url":   None,
        "expect":      "approved",
        "notes":       "Should pass Path A (low detoxify score), misinfo check = opinion_no_check",
    },
    {
        "label":       "🧪 TEXT: Misinformation — vaccine microchip (THE BUG CASE)",
        "text":        "Just so everyone knows, vaccines contain microchips that track your location via 5G towers. Do your research before getting the jab.",
        "image_url":   None,
        "expect":      "flagged",
        "notes":       "Was APPROVED before the fix. Should now flag misinfo. Detoxify scores low, but Gemini misinfo-only call should catch it.",
    },
    {
        "label":       "🧪 TEXT: Misinformation — flat earth",
        "text":        "NASA has been lying for decades. The Earth is flat and all satellite images are CGI. Wake up people.",
        "image_url":   None,
        "expect":      "flagged",
        "notes":       "Politely written conspiracy — tests misinfo detection on Path A",
    },
    {
        "label":       "🧪 TEXT: Misinformation — medical (bleach cure)",
        "text":        "Doctors won't tell you this but drinking diluted bleach kills the coronavirus in your body. Happened to my uncle.",
        "image_url":   None,
        "expect":      "flagged",
        "notes":       "Dangerous health misinformation, presented calmly",
    },
    {
        "label":       "✅ TEXT: Opinion (should NOT flag as misinfo)",
        "text":        "I think the government is spending too much on defence and not enough on education. Just my opinion.",
        "image_url":   None,
        "expect":      "approved",
        "notes":       "Opinion, no verifiable factual claim — verdict should be opinion_no_check",
    },
    {
        "label":       "🚨 TEXT: Clearly toxic",
        "text":        "All [slur] people should be exterminated. They are ruining this country and I hate every single one of them.",
        "image_url":   None,
        "expect":      "rejected",
        "notes":       "High detoxify score → Path B. Still runs misinfo check separately now.",
    },
    {
        "label":       "⚠️  TEXT: Borderline toxic + misinfo combo",
        "text":        "These filthy immigrants are bringing diseases and spreading polio which was already eradicated. Send them back.",
        "image_url":   None,
        "expect":      "flagged or rejected",
        "notes":       "Borderline toxicity → Path C (combined Gemini call). Should catch both hate speech + misinfo.",
    },
    {
        "label":       "🧪 TEXT: Coded language misinfo",
        "text":        "The Great Replacement is real. Look at the birth rate statistics — white Europeans will be a minority by 2040 if nothing is done.",
        "image_url":   None,
        "expect":      "flagged",
        "notes":       "Coded hate speech wrapped in fake statistics — tests both misinfo + coded_language detection",
    },

    # ── IMAGE ONLY ────────────────────────────────────────────────────────────

    {
        "label":       "✅ IMAGE: Safe nature photo",
        "text":        None,
        "image_url":   IMAGES["safe_nature"],
        "expect":      "approved",
        "notes":       "Sunflower from Wikimedia — should be clearly safe",
    },
    {
        "label":       "🧪 IMAGE:  NSFW simulated (benchmark-style)",
        "text":        None,
        "image_url":   IMAGES["nsfw_simulated"],
        "expect":      "flagged or rejected",
        "notes":       "Simulated NSFW image with partial nudity — tests if model can catch NSFW without explicit real content (some false positives expected)",
    },
    {
        "label":       "🧪 IMAGE: Borderline beach photo",
        "text":        "Have to work all day, but at least I can relax at the beach later! 🏖️",
        "image_url":   IMAGES["borderline_beach"],
        "expect":      "flagged or rejected",
        "notes":       "Safe but skin exposure — tests NSFW threshold sensitivity",
    },

    # ── TEXT + IMAGE COMBINED ─────────────────────────────────────────────────

    {
        "label":       "🧪 COMBINED: Misinfo text + safe image",
        "text":        "Bill Gates admitted in a leaked video that COVID vaccines have tracking nanoparticles. Share before deleted!",
        "image_url":   IMAGES["safe_nature"],
        "expect":      "flagged",
        "notes":       "Safe image but misinfo text — verdict should be flagged for misinformation",
    },
    {
        "label":       "✅ COMBINED: Clean text + safe image",
        "text":        "Beautiful flowers from my garden this morning! Nature is healing 🌻",
        "image_url":   IMAGES["safe_nature"],
        "expect":      "approved",
        "notes":       "Both clean — should be approved",
    },
    {
        "label":       "🧪 COMBINED: Toxic text + NSFW image (double flag)",
        "text":        "Look at this disgusting garbage, these people are subhuman filth.",
        "image_url":   IMAGES["nsfw_simulated"],
        "expect":      "rejected",
        "notes":       "Highly toxic text + simulated NSFW image — should be rejected, tests if both signals together push it over the edge",
    },

    # ── EDGE CASES ────────────────────────────────────────────────────────────

    {
        "label":       "🔲 EDGE: Empty text",
        "text":        "",
        "image_url":   None,
        "expect":      "approved",
        "notes":       "Empty string — pipeline should handle gracefully, not crash",
    },
    {
        "label":       "🔲 EDGE: Very short text",
        "text":        "ok",
        "image_url":   None,
        "expect":      "approved",
        "notes":       "Single word — should run through pipeline without issues",
    },
]


# ─── Runner ───────────────────────────────────────────────────────────────────

def run_tests():
    print(f"\n{BOLD}{'═'*70}{RESET}")
    print(f"{BOLD}   CLEANSTREAM ML PIPELINE — FULL TEST SUITE{RESET}")
    print(f"{BOLD}{'═'*70}{RESET}")
    print(f"  Total test cases: {len(TEST_CASES)}")
    print(f"  Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{BOLD}{'═'*70}{RESET}\n")

    results = []

    for i, case in enumerate(TEST_CASES, 1):
        print(f"\n{BOLD}[{i}/{len(TEST_CASES)}] {case['label']}{RESET}")
        print(f"  Notes  : {case['notes']}")
        print(f"  Expect : {case['expect']}")
        if case["text"]:
            preview = case["text"][:80] + ("..." if len(case["text"]) > 80 else "")
            print(f"  Text   : {preview}")
        if case["image_url"]:
            print(f"  Image  : {case['image_url'][:70]}...")

        job = ModerationJobInput(
            job_id   = str(uuid.uuid4()),
            post_id  = f"test_{i:02d}",
            text     = case["text"] if case["text"] else None,
            image_url= case["image_url"],
        )

        try:
            result = run_moderation(job)
            vc = verdict_color(result.final_verdict)

            print(f"\n  {BOLD}RESULT:{RESET}")
            print(f"    Verdict      : {vc}{BOLD}{result.final_verdict.upper()}{RESET}")
            print(f"    Flag reasons : {result.flag_reasons or 'none'}")
            print(f"    Time         : {result.processing_ms}ms")

            if result.text_result:
                tr = result.text_result
                print(f"    Text toxic   : {tr.is_toxic} ({tr.final_confidence:.1%}) via [{tr.model_chain}]")

            if result.misinfo_result:
                mr = result.misinfo_result
                color = RED if mr.contains_misinformation else GREEN
                print(f"    Misinfo      : {color}{mr.contains_misinformation}{RESET} | verdict={mr.verdict} ({mr.confidence:.1%})")
                if mr.claims_found:
                    print(f"    Claims found : {mr.claims_found[:2]}")  # first 2 only
                print(f"    Explanation  : {mr.explanation}")
            else:
                print(f"    Misinfo      : {YELLOW}skipped (no text){RESET}")

            if result.image_result:
                ir = result.image_result
                color = RED if ir.is_inappropriate else GREEN
                print(f"    Image NSFW   : {color}{ir.is_inappropriate}{RESET} ({ir.final_confidence:.1%})")
                if ir.nudenet_labels:
                    print(f"    NudeNet      : {ir.nudenet_labels[:3]}")

            results.append({
                "label":   case["label"],
                "verdict": result.final_verdict,
                "passed":  True,
                "ms":      result.processing_ms,
            })

        except Exception as e:
            print(f"\n  {RED}{BOLD}CRASHED: {e}{RESET}")
            import traceback
            traceback.print_exc()
            results.append({
                "label":   case["label"],
                "verdict": "ERROR",
                "passed":  False,
                "ms":      0,
            })

        print(f"  {'─'*60}")
        time.sleep(0.5)  # small delay between tests to avoid rate limiting

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n\n{BOLD}{'═'*70}{RESET}")
    print(f"{BOLD}   SUMMARY{RESET}")
    print(f"{BOLD}{'═'*70}{RESET}")

    passed  = sum(1 for r in results if r["passed"])
    crashed = sum(1 for r in results if not r["passed"])
    avg_ms  = sum(r["ms"] for r in results if r["passed"]) // max(passed, 1)

    for r in results:
        icon = "✅" if r["passed"] else "❌"
        vc = verdict_color(r["verdict"])
        print(f"  {icon} {r['label'][:55]:<55} → {vc}{r['verdict']}{RESET}")

    print(f"\n  Ran     : {len(results)} tests")
    print(f"  Passed  : {GREEN}{passed}{RESET}")
    print(f"  Crashed : {RED if crashed else GREEN}{crashed}{RESET}")
    print(f"  Avg time: {avg_ms}ms per post")
    print(f"{BOLD}{'═'*70}{RESET}\n")


if __name__ == "__main__":
    run_tests()