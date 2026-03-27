import os
from dotenv import load_dotenv

load_dotenv()

# ── Gemini ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = "gemini-3.1-flash-lite-preview"   # fast + cheap, good enough for moderation

# ── Thresholds ────────────────────────────────────────────────────────────────
# Detoxify: if score < LOW  → pass immediately (don't call Gemini)
#           if score > HIGH → reject immediately (don't call Gemini)
#           if score in between → escalate to Gemini (borderline zone)
DETOXIFY_LOW_THRESHOLD  = 0.30   # below this = clearly fine
DETOXIFY_HIGH_THRESHOLD = 0.75   # above this = clearly toxic, no need for Gemini

# NudeNet: confidence above this = flag image
NUDENET_THRESHOLD = 0.60

# ── Redis (for later when you add queue) ─────────────────────────────────────
REDIS_URL     = os.getenv("REDIS_URL", "redis://localhost:6379")
QUEUE_NAME    = "moderation"

# ── MongoDB (for later) ───────────────────────────────────────────────────────
MONGO_URI     = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB", "cleanstream")
