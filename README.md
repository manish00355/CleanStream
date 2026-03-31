# CleanStream — Team 02 [BERLIN]

> AI Content Moderation Platform · HBTU Campus Drive · Ampcus Cyber

CleanStream is a full-stack AI-powered content moderation platform. Users post text and images — the system automatically detects toxic content, NSFW images, and misinformation using a multi-layer ML pipeline, before content ever reaches the public feed. Flagged content goes to a moderator dashboard for human review.

---

## Architecture Overview

```
┌─────────────┐     POST /api/posts      ┌─────────────────┐
│   React     │ ─────────────────────── ▶│  Node.js/Express│
│  Frontend   │ ◀─────── 202 pending ─── │    Backend      │
└─────────────┘                          └────────┬────────┘
                                                  │ BullMQ job
                                                  ▼
                                         ┌─────────────────┐
                                         │   Redis Queue   │
                                         └────────┬────────┘
                                                  │ consumes
                                                  ▼
                                         ┌─────────────────┐
                                         │  Python ML      │
                                         │  Worker         │
                                         │  Detoxify       │
                                         │  NudeNet        │
                                         │  Gemini API     │
                                         └────────┬────────┘
                                                  │ POST /ml-callback
                                                  ▼
                                         ┌─────────────────┐
                                         │    MongoDB      │
                                         │  posts updated  │
                                         │  results saved  │
                                         └─────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Zustand |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (access 15m + refresh 7d httpOnly cookie) + bcryptjs |
| Queue | BullMQ + Redis |
| Image Storage | Cloudinary |
| ML — Text | Detoxify (toxicity) + Gemini API (misinformation) |
| ML — Image | NudeNet (NSFW) + Gemini Vision |
| ML Runtime | Python |

---

## Repository Structure

```
CleanStream/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/          # db.js, redis.js, cloudinary.js
│   │   ├── models/          # User, Post, ModerationResult, ModerationJob
│   │   ├── middleware/      # verifyToken, requireModerator, errorHandler
│   │   ├── controllers/     # auth, post, moderation
│   │   └── routes/          # auth, post, moderation
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # axios.js, auth.api.js, posts.api.js, moderation.api.js
│   │   ├── store/           # authStore.js (Zustand)
│   │   ├── routes/          # ProtectedRoute, ModeratorRoute
│   │   ├── components/      # Navbar, PostCard, Badge, Spinner, StatsGrid
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── user/        # FeedPage, CreatePostPage, MyPostsPage
│   │       └── moderator/   # DashboardPage, FlaggedPage, PostDetailPage
│   ├── .env.example
│   └── package.json
│
└── ml_worker/
    ├── worker.py
    ├── requirements.txt
    └── .env.example
```

---

## Team Roles

| Member | Role | Responsibility |
|---|---|---|
| Manish Kumar | Backend Lead | Express API, JWT auth, BullMQ queue, MongoDB schemas, Cloudinary |
| Sumit Singh | ML Lead & FullStack | Python worker, Detoxify, NudeNet, Gemini integration, callback |
| Shiv Kumar | Frontend Lead | React + Vite, Zustand, all pages, Tailwind UI |
| Shiva Soni | DevOps / Integration with Backend | Docker, deployment, env setup, end-to-end testing |
| Sourav Mondal | Documentation / QA | README, ADR docs, Postman testing, commit hygiene |

---

## Local Setup — Full Stack

### Prerequisites

- Node.js 20+
- Python 3.10+
- Docker (for Redis + MongoDB)
- Cloudinary free account → https://cloudinary.com
- Google Gemini API key → https://aistudio.google.com

---

### Step 1 — Clone

```bash
git clone https://github.com/Rusty-98/CleanStream.git
cd CleanStream
```

---

### Step 2 — Start Redis + MongoDB via Docker

```bash
# Redis
docker run -d -p 6379:6379 --name cleanstream-redis redis:7-alpine

# MongoDB
docker run -d -p 27017:27017 --name cleanstream-mongo mongo:7
```

---

### Step 3 — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/cleanstream
JWT_SECRET=your-strong-secret
JWT_REFRESH_SECRET=your-different-strong-secret
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_ORIGIN=http://localhost:3000
```

```bash
npm run dev
```

Expected output:
```
[DB] MongoDB connected → localhost
[Redis] Connected
[Cloudinary] Configured for cloud: your_cloud_name
╔══════════════════════════════════════╗
║  CleanStream Backend  · Port: 5000   ║
╚══════════════════════════════════════╝
```

---

### Step 4 — ML Worker

```bash
cd ml_worker
pip install -r requirements.txt
cp .env.example .env
```

Fill in `ml_worker/.env`:

```env
REDIS_URL=redis://localhost:6379
MONGO_URI=mongodb://localhost:27017/cleanstream
GEMINI_API_KEY=your_gemini_api_key
CALLBACK_URL=http://localhost:5000/api/moderation/ml-callback
```

```bash
python worker.py
```

---

### Step 5 — Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs at → http://localhost:3000

---

### Step 6 — Verify everything is running

```bash
curl http://localhost:5000/api/health
# → {"status":"ok","timestamp":"..."}
```

Open http://localhost:3000 — register as user or moderator, create a post, watch ML worker process it.

---

## API Reference

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Register — send `role: "moderator"` for moderator account |
| POST | `/login` | None | Login — returns accessToken + sets httpOnly refresh cookie |
| POST | `/refresh` | Cookie | Rotate tokens |
| POST | `/logout` | Bearer | Clear session |
| GET | `/me` | Bearer | Current user info |

### Posts — `/api/posts`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/feed` | Bearer | Approved posts — paginated |
| POST | `/` | Bearer | Create post (multipart/form-data) — returns 202 |
| GET | `/my` | Bearer | Current user's posts — all statuses |
| GET | `/:id` | Bearer | Single post |
| DELETE | `/:id` | Bearer | Delete own post |

### Moderation — `/api/moderation`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Moderator | Dashboard counts + avg processing time |
| GET | `/flagged` | Moderator | Flagged/pending/rejected posts — `?status=rejected` |
| GET | `/:post_id/result` | Moderator | Full ML scores breakdown |
| POST | `/:post_id/approve` | Moderator | Approve post |
| POST | `/:post_id/reject` | Moderator | Reject post |
| POST | `/ml-callback` | Internal | ML worker posts result here |

---

## ML Pipeline

```
Text post received
    │
    ├─▶ Detoxify → toxicity, severe_toxicity, insult, threat, obscene scores
    │       │
    │       └─▶ if any score > 0.5 → flag as toxic_text
    │
    └─▶ Gemini → misinformation check (independent prompt, always runs)
            │
            └─▶ if detected → flag as misinformation

Image post received
    │
    ├─▶ NudeNet → NSFW classification + bounding boxes
    │       │
    │       └─▶ if nsfw_score > 0.5 → flag as nsfw_image
    │
    └─▶ Gemini Vision → secondary NSFW check for edge cases

Final verdict:
    any flag → "flagged" → moderator dashboard
    no flags → "approved" → public feed
```

---

## Database Schema

### users
```
_id, username (unique), email (unique), password_hash (bcrypt),
role (user|moderator), is_active, created_at
```

### posts
```
_id, user_id → users, text, image_url (Cloudinary),
cloudinary_public_id, status (pending|approved|flagged|rejected),
flag_reasons[], moderated_by → users, moderated_at, created_at
```

### moderation_results
```
_id, job_id (UUID), post_id → posts, final_verdict,
flag_reasons[], text_result (Mixed), image_result (Mixed),
misinfo_result (Mixed), processing_ms, processed_at
```

### moderation_jobs
```
_id, job_id (UUID), post_id → posts,
queue_status (queued|processing|done|failed),
enqueued_at, completed_at, retry_count, error
```

---

## Architecture Decision Records (ADR)

### ADR-001: JWT Two-Token Auth over Sessions
Access token (15 min) in Authorization header + refresh token (7 days) in httpOnly cookie. Stateless, XSS-safe, works across separate frontend/backend origins. Rejected Clerk/Auth0 — external dependency, overkill for assessment scope.

### ADR-002: Async Queue (BullMQ) over Sync ML calls
ML inference takes 2–8s per post. Synchronous HTTP call would block the API and timeout on slow images. BullMQ + Redis decouples post creation from processing — 202 returned instantly, ML runs in background. Provides retry logic (3 attempts, exponential backoff) and job history.

### ADR-003: MongoDB over SQL
ML result schema is deeply nested and variable — Detoxify, NudeNet, and Gemini all return different shapes. Mixed type in Mongoose handles this without migrations. Acceptable for a moderation platform where eventual consistency is fine.

### ADR-004: Cloudinary over Local Storage
Local disk is lost on server restart or Docker rebuild. Cloudinary gives persistent CDN URLs accessible by both backend and ML worker directly. `cloudinary_public_id` stored for clean deletion when post is removed.

### ADR-005: Separate `moderation_results` Collection
Keeps `posts` documents lean — ML output can be hundreds of fields per post. Full audit trail preserved separately. Moderators view score breakdown via dedicated endpoint without bloating the feed response.

### ADR-006: Python ML Worker over Node.js ML
Detoxify and NudeNet are Python-only libraries with no Node.js equivalents. Redis queue acts as the language bridge — Node.js publishes jobs, Python consumes them. Decoupled by design — moving to separate deployment only requires changing `REDIS_URL`.

---

## Key Design Decisions

**202 on post creation** — not 201. Signals to the client that processing is async. Frontend polls `/api/posts/my` for status updates.

**mlCallback pattern** — Python worker calls back to Node.js via HTTP after processing. Backend stays stateless — no Node.js BullMQ worker needed. Clean separation.

**Misinformation warning in feed** — approved posts that had misinformation detected still show a warning badge in the feed. Moderator override is transparent to readers — same approach used by Twitter/Meta.

**Role on register** — users select role at registration time for demo purposes. In production this would require admin approval or a secret invite code.

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `MongoDB connection failed` | MongoDB not running | `docker start cleanstream-mongo` |
| `Redis error: ECONNREFUSED` | Redis not running | `docker start cleanstream-redis` |
| `No token provided` | Missing Authorization header | Add `Bearer <token>` |
| `Access token expired` | 15 min token expired | Call `POST /api/auth/refresh` |
| `Access denied. Moderator role required` | Wrong role | Register/login as moderator |
| `Post must contain text, an image, or both` | Empty form | Send at least one field |
| `Only image files allowed` | Wrong file type | jpg, png, gif, webp only, max 5MB |
| CORS error | Origin mismatch | Set `CLIENT_ORIGIN=http://localhost:3000` |
| ML worker not processing | Redis/callback URL wrong | Check `REDIS_URL` and `CALLBACK_URL` in ml_worker `.env` |
