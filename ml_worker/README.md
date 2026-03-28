# CleanStream — ML Worker

> Multi-layer AI content moderation pipeline | Python | Detoxify · NudeNet · Gemini

The ML worker is the intelligence layer of CleanStream. It picks up moderation jobs from a Redis queue (pushed by the Node.js backend), runs content through a multi-layer AI pipeline, and POSTs results back to the backend via HTTP callback.

---

## How It Fits In

```
User submits post
      ↓
Node.js Backend  →  Redis Queue (BullMQ)
                           ↓
                      ML Worker (this)
                           ↓
               Multi-layer pipeline runs
                           ↓
               HTTP POST → /api/moderation/ml-callback
                           ↓
                  Backend updates MongoDB
```

The worker runs as a completely separate Python process. It does not touch MongoDB directly — all DB writes go through the backend callback.

---

## Pipeline Architecture

### Text Moderation

```
Text Input
    │
    ▼
[Layer 1] Detoxify (local, always runs)
    │
    ├── score < 0.30  →  CLEAN  →  [Gemini: misinfo-only check]
    │
    ├── score > 0.75  →  TOXIC  →  [Gemini: misinfo-only check]
    │
    └── 0.30–0.75     →  BORDERLINE  →  [Gemini: combined toxicity + misinfo check]

Max Gemini calls per text post: 1
```

### Image Moderation

```
Image Input
    │
    ▼
[Layer 1] NudeNet (local) — NSFW detection
    │
    ▼
[Layer 2] Gemini Vision (always runs)
         ├── Visual NSFW check (catches what NudeNet misses)
         └── Text-on-image extraction + toxicity check (memes, overlays, captions)
```

### Why Multi-Layer?

| Model | Strength | Weakness |
|---|---|---|
| Detoxify | Fast, free, runs locally | Misses sarcasm, coded language, double meanings |
| NudeNet | Fast local NSFW detection | Can't read text on images |
| Gemini | Context-aware, catches nuance | API cost + latency |

The layered approach keeps Gemini calls minimal (max 1 per text, max 1 per image) while ensuring accuracy where it matters.

---

## Verdict Logic

| Condition | Verdict |
|---|---|
| Nothing flagged | `approved` |
| Something flagged, confidence < 0.85 | `flagged` (human review) |
| Non-misinfo flag, confidence ≥ 0.85 | `rejected` (auto-removed) |
| Misinformation only | `flagged` (never auto-rejects — needs human review) |

`flag_reasons` can contain: `toxic_text`, `nsfw_image`, `toxic_text_on_image`, `misinformation`

---

## Input / Output Contract

### Input (from Redis queue)

```json
{
  "job_id":    "550e8400-e29b-41d4-a716-446655440000",
  "post_id":   "6650f1a2b3c4d5e6f7a8b9c0",
  "text":      "post body text or null",
  "image_url": "https://res.cloudinary.com/... or null"
}
```

At least one of `text` or `image_url` must be present.

### Output (HTTP POST to backend callback)

```json
{
  "job_id":        "550e8400-e29b-41d4-a716-446655440000",
  "post_id":       "6650f1a2b3c4d5e6f7a8b9c0",
  "final_verdict": "approved | flagged | rejected",
  "flag_reasons":  ["toxic_text", "nsfw_image", "misinformation"],
  "processing_ms": 1240,
  "text_result": {
    "is_toxic":         false,
    "final_confidence": 0.12,
    "model_chain":      "detoxify (clean) → gemini misinfo-only",
    "categories": {
      "toxicity": 0.12, "severe_toxicity": 0.01,
      "obscene": 0.03, "threat": 0.01,
      "insult": 0.08, "identity_attack": 0.02
    }
  },
  "image_result": {
    "is_inappropriate": false,
    "final_confidence":  0.0,
    "nudenet_labels":    [],
    "text_on_image":     null,
    "image_text_toxic":  false,
    "model_chain":       "nudenet → gemini-vision"
  },
  "misinfo_result": {
    "contains_misinformation": true,
    "confidence":   0.91,
    "claim_type":   "factual_claim",
    "verdict":      "likely_false",
    "explanation":  "Vaccines do not contain microchips — no scientific basis.",
    "claims_found": ["vaccines contain microchips that track location via 5G"]
  }
}
```

---

## Real Examples

### Clean post
```
Input:  "Just had the best chai of my life in Lucknow!"
Output: verdict=approved | flag_reasons=[] | 180ms
        detoxify=0.04 (clean) | misinfo=opinion_no_check
```

### Misinformation (the tricky case)
```
Input:  "Vaccines contain microchips that track your location via 5G towers."
Output: verdict=flagged | flag_reasons=["misinformation"] | 920ms
        detoxify=0.10 (clean → Path A) | misinfo=likely_false (0.91)

Why tricky: Detoxify scores 0.10 (very low, no hate speech).
Old system would have approved this. Fix: misinfo check always runs
independently of toxicity score.
```

### Clearly toxic
```
Input:  "[slur] people should be exterminated."
Output: verdict=rejected | flag_reasons=["toxic_text"] | 340ms
        detoxify=0.94 → auto-reject (above 0.75 threshold + confidence ≥ 0.85)
```

### NSFW image
```
Input:  image_url="https://..."
Output: verdict=flagged | flag_reasons=["nsfw_image"] | 2100ms
        nudenet=FEMALE_BREAST_EXPOSED (0.89) | gemini-vision=inappropriate
```

---

## Failure Cases & Handling

| Failure | Behaviour |
|---|---|
| Detoxify crashes | Treated as clean (0.0 score), pipeline continues |
| Gemini API fails | Falls back gracefully, misinfo marked as `unverifiable` |
| NudeNet crashes | Skipped, Gemini Vision still runs |
| Image load fails | Returns clean result with `failure_reason` logged |
| Empty/null text | Skipped immediately, returns `approved` |

No failure causes the worker to crash — all exceptions are caught per layer.

---

## Thresholds (tune in `config.py`)

| Setting | Default | Meaning |
|---|---|---|
| `DETOXIFY_LOW_THRESHOLD` | 0.30 | Below → clean, skip Gemini toxicity check |
| `DETOXIFY_HIGH_THRESHOLD` | 0.75 | Above → toxic, skip Gemini toxicity check |
| `NUDENET_THRESHOLD` | 0.60 | NudeNet confidence to consider a detection valid |

The **borderline zone** (0.30–0.75) is where Gemini's combined call runs. This saves API cost on obvious cases while keeping accuracy on edge cases.

---

## File Structure

```
ml_worker/
├── config.py                  # thresholds, API keys, queue config
├── schemas.py                 # input/output dataclasses (the contract)
├── tasks/
│   └── moderate.py            # main pipeline orchestrator
├── models/
│   ├── text_classifier.py     # Detoxify → Gemini (3 paths)
│   └── image_classifier.py    # NudeNet → Gemini Vision
├── worker.py                  # BullMQ consumer + HTTP callback
├── test_pipeline.py           # standalone test runner (no Redis needed)
├── requirements.txt
└── Dockerfile
```

---

## Setup

```bash
cd ml_worker
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Add GEMINI_API_KEY to .env
```

Get a free Gemini API key: https://aistudio.google.com/app/apikey

### Environment Variables

```env
GEMINI_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379
```

---

## Running

### Test pipeline locally (no Redis, no backend needed)
```bash
python test_pipeline.py
```

### Run the actual worker (requires Redis + backend running)
```bash
python worker.py
```

### Test a single input
```python
from schemas import ModerationJobInput
from tasks.moderate import run_moderation

result = run_moderation(ModerationJobInput(
    job_id="test-1",
    post_id="post-1",
    text="vaccines contain microchips",
    image_url=None
))
print(result.final_verdict, result.flag_reasons)
```

---

## Key Design Decisions

**1. Why Python + Node.js instead of one language?**
ML libraries (Detoxify, NudeNet, HuggingFace) are Python-native. Wrapping them in Node would be painful. Redis queue cleanly decouples the two without either blocking the other.

**2. Why always run Gemini for images but not always for text?**
Text has an obvious cheap pre-filter (Detoxify). Images don't — and NudeNet can't read text overlays on memes/screenshots. Gemini Vision is the only way to catch that, so it always runs.

**3. Why does misinfo never auto-reject?**
Misinformation detection has higher false positive risk than toxicity — context matters a lot. A human moderator reviews all misinfo flags before action.

**4. Why HTTP callback instead of writing to MongoDB directly?**
Keeps the ML worker stateless and decoupled. Backend owns the DB contract. This also means the ML worker can be restarted/scaled independently without DB credential management.

**5. Why not Dockerize the ML worker?**
NudeNet + Detoxify + Gemini dependencies produce a ~4–5GB image. In a dev/assessment environment, running directly in a venv is the practical trade-off. A production multi-stage Dockerfile would separate model download from runtime.
