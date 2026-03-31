# CleanStream Backend

> AI-powered content moderation platform — REST API backend built with Node.js, Express, MongoDB, Redis, and Cloudinary.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Docker](#docker)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Posts](#posts)
  - [Moderation](#moderation)
- [Data Models](#data-models)
- [Authentication Flow](#authentication-flow)
- [ML Worker Integration](#ml-worker-integration)
- [Security Considerations](#security-considerations)

---

## Overview

CleanStream is an AI-driven content moderation platform. When a user submits a post (text and/or image), the backend:

1. Stores the post with a `pending` status.
2. Uploads any attached image to Cloudinary.
3. Enqueues a BullMQ job to a Redis-backed `moderation` queue.
4. A separate Python ML worker consumes the job, runs multi-layer analysis (toxicity, NSFW detection, misinformation), and calls back to `/api/moderation/ml-callback` with the verdict.
5. Human moderators can review flagged content through a protected dashboard API.

---

## Architecture

```
┌─────────────┐     REST API      ┌──────────────────────┐
│   Frontend  │ ◄────────────────► │  Express Backend     │
└─────────────┘                   │  (this repo)         │
                                  │                      │
                                  │  ┌───────────────┐   │
                                  │  │   MongoDB     │   │
                                  │  └───────────────┘   │
                                  │  ┌───────────────┐   │
                                  │  │   Cloudinary  │   │
                                  │  └───────────────┘   │
                                  │  ┌───────────────┐   │
                                  │  │  Redis/BullMQ │   │
                                  │  └───────┬───────┘   │
                                  └──────────┼───────────┘
                                             │ job queue
                                  ┌──────────▼───────────┐
                                  │  Python ML Worker     │
                                  │  (separate service)   │
                                  │  Detoxify / NudeNet   │
                                  │  Gemini Vision        │
                                  └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Queue | BullMQ 5 + ioredis |
| Media Storage | Cloudinary |
| Auth | JWT (access + refresh token rotation) |
| Validation | express-validator |
| Logging | Morgan |
| Containerisation | Docker (node:20-alpine) |

---

## Project Structure

```
cleanstream-backend/
├── server.js                    # Entry point — connects DB, starts server
├── src/
│   ├── app.js                   # Express app, middleware, route mounting
│   ├── config/
│   │   ├── db.js                # Mongoose connection
│   │   ├── redis.js             # Redis client + BullMQ moderation queue
│   │   └── cloudinary.js        # Cloudinary config + Multer storage
│   ├── models/
│   │   ├── User.js              # users collection
│   │   ├── Post.js              # posts collection
│   │   ├── ModerationJob.js     # moderation_jobs collection (BullMQ audit)
│   │   └── ModerationResult.js  # moderation_results collection (ML audit trail)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── post.controller.js
│   │   └── moderation.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── post.routes.js
│   │   ├── moderation.routes.js
│   │   └── validate.js          # express-validator error handler
│   └── middleware/
│       ├── verifyToken.js       # JWT access token guard
│       └── requireModerator.js  # Role guard (moderator only)
├── uploads/                     # Transient local upload buffer (pre-Cloudinary)
├── Dockerfile
├── .env.example
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)
- Redis (local or managed)
- Cloudinary account

### Local Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd cleanstream-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 3. Start in development mode (nodemon)
npm run dev

# 4. Or start in production mode
npm start
```

The server starts on `http://localhost:5000` by default. Verify with:

```bash
curl http://localhost:5000/api/health
# → { "status": "ok", "timestamp": "..." }
```

### Docker

```bash
# Build image
docker build -t cleanstream-backend .

# Run container (pass env vars via --env-file or -e flags)
docker run -p 5000:5000 --env-file .env cleanstream-backend
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | Secret for signing refresh tokens — must differ from `JWT_SECRET` |
| `JWT_ACCESS_EXPIRES` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRES` | No | Refresh token TTL (default: `7d`) |
| `REDIS_URL` | **Yes** | Redis connection string (e.g. `redis://localhost:6379`) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |
| `CLIENT_ORIGIN` | No | CORS allowed origin (default: `http://localhost:3000`) |

> **Security note:** Use two distinct, high-entropy secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`. Never commit `.env` to version control.

---

## API Reference

All endpoints are prefixed with `/api`. JSON responses follow the shape `{ success: boolean, ... }`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register a new account |
| `POST` | `/api/auth/login` | — | Login; returns access token + sets httpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Cookie | Rotate tokens using the refresh cookie |
| `POST` | `/api/auth/logout` | — | Clear the refresh cookie |
| `GET` | `/api/auth/me` | Bearer | Get current user profile |

**Register / Login request body:**

```json
// POST /api/auth/register
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "user"        // optional — "user" (default) or "moderator"
}

// POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Login response:**

```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": { "id": "...", "username": "alice", "role": "user" }
}
```

---

### Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/posts/feed` | — | Public feed of approved posts (paginated) |
| `POST` | `/api/posts` | Bearer | Create a post (`multipart/form-data`; `text` and/or `image` field required) |
| `GET` | `/api/posts/my` | Bearer | Current user's own posts (all statuses) |
| `GET` | `/api/posts/:id` | Bearer | Get a single post by ID |
| `DELETE` | `/api/posts/:id` | Bearer | Delete own post (also deletes Cloudinary image) |

**Create post (`multipart/form-data`):**

| Field | Type | Notes |
|---|---|---|
| `text` | string | Optional. Max 2000 characters. |
| `image` | file | Optional. JPEG/PNG/GIF/WebP. Max 5 MB. |

At least one of `text` or `image` is required. New posts are created with `status: "pending"` and a BullMQ job is automatically enqueued for ML analysis.

---

### Moderation

All moderation routes (except the ML callback) require **Bearer token + `moderator` role**.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/moderation/ml-callback` | Internal | Callback for the Python ML worker to submit results |
| `GET` | `/api/moderation/stats` | Moderator | Post counts by status + average ML processing time |
| `GET` | `/api/moderation/flagged` | Moderator | Paginated list of flagged/pending posts |
| `GET` | `/api/moderation/:post_id/result` | Moderator | Full ML score breakdown for a post |
| `POST` | `/api/moderation/:post_id/approve` | Moderator | Manually approve a post |
| `POST` | `/api/moderation/:post_id/reject` | Moderator | Manually reject a post |

**Flagged posts query params:**

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `20` | Results per page (max 50) |
| `reason` | — | Filter by flag reason (e.g. `toxic_text`, `nsfw_image`, `misinformation`) |

**Reject post body (optional):**

```json
{
  "reason": "Contains targeted harassment"
}
```

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `username` | String | Unique, 3–30 chars, lowercase |
| `email` | String | Unique, lowercase |
| `password_hash` | String | bcrypt (cost 12), excluded from queries by default |
| `role` | String | `"user"` \| `"moderator"` |
| `is_active` | Boolean | Soft-disable accounts without deletion |

### Post

| Field | Type | Notes |
|---|---|---|
| `user_id` | ObjectId | Ref → User |
| `text` | String | Max 2000 chars |
| `image_url` | String | Full Cloudinary CDN URL |
| `cloudinary_public_id` | String | Used to delete image on post removal |
| `status` | String | `pending` → `approved` / `flagged` / `rejected` |
| `flag_reasons` | [String] | e.g. `["toxic_text", "nsfw_image"]` |
| `moderated_by` | ObjectId | Ref → User (human moderator) |

### ModerationResult

Stores the complete ML pipeline output for every processed post — serves as a full audit trail.

| Field | Type | Notes |
|---|---|---|
| `job_id` | String | UUID matching the BullMQ job |
| `post_id` | ObjectId | One result per post (unique) |
| `final_verdict` | String | `approved` / `flagged` / `rejected` |
| `flag_reasons` | [String] | Mirror of `Post.flag_reasons` at processing time |
| `text_result` | Mixed | Detoxify + Gemini text scores |
| `image_result` | Mixed | NudeNet + Gemini Vision scores |
| `misinfo_result` | Mixed | Misinformation check output |
| `processing_ms` | Number | End-to-end ML pipeline latency |

### ModerationJob

Tracks BullMQ job lifecycle for observability and retry visibility.

| Field | Type | Notes |
|---|---|---|
| `job_id` | String | UUID, matches BullMQ job ID |
| `post_id` | ObjectId | Ref → Post |
| `queue_status` | String | `queued` / `processing` / `done` / `failed` |
| `retry_count` | Number | Incremented on each BullMQ retry |
| `error` | String | Error message if job failed |

---

## Authentication Flow

```
1. POST /api/auth/login
   ← accessToken (15 min, in response body)
   ← refreshToken (7 days, httpOnly cookie)

2. Authenticated requests:
   → Authorization: Bearer <accessToken>

3. On 401 "Access token expired":
   POST /api/auth/refresh   (cookie sent automatically by browser)
   ← new accessToken
   ← new refreshToken (token rotation on every refresh)

4. POST /api/auth/logout
   → clears refreshToken cookie
```

The access token is short-lived (15 min) to limit exposure. The refresh token is stored in an `httpOnly; SameSite=Strict` cookie — inaccessible to JavaScript — which protects against XSS-based token theft. Both tokens are rotated on every refresh call.

---

## ML Worker Integration

The backend communicates with the Python ML worker via BullMQ over Redis.

**Queue name:** `moderation` (hard-coded — the ML worker reads this exact name)

**Job payload** (added to queue on post creation):

```json
{
  "post_id": "<mongodb-object-id>",
  "text": "post text content or null",
  "image_url": "https://res.cloudinary.com/... or null"
}
```

**BullMQ retry policy:** 3 attempts with exponential backoff (2 s → 4 s → 8 s).

**ML callback** (`POST /api/moderation/ml-callback`):

After completing inference, the Python worker posts results back to this endpoint. It is an internal service-to-service call and does not require JWT authentication.

```json
{
  "job_id": "<uuid>",
  "post_id": "<mongodb-object-id>",
  "final_verdict": "approved | flagged | rejected",
  "flag_reasons": ["toxic_text", "nsfw_image"],
  "text_result": { ... },
  "image_result": { ... },
  "misinfo_result": { ... },
  "processing_ms": 1234
}
```

> **Production hardening:** Protect the ML callback endpoint with a shared secret header (e.g. `X-ML-Secret`) validated against an environment variable. Without this, any internal service can submit arbitrary verdicts.

---

## Security Considerations

| Area | Implementation |
|---|---|
| Password storage | bcrypt, cost factor 12; `password_hash` field excluded from all queries by default (`select: false`) |
| JWT secrets | Two separate secrets for access and refresh tokens |
| Refresh token storage | `httpOnly; Secure; SameSite=Strict` cookie — not accessible by JavaScript |
| Token rotation | Both tokens replaced on every `/refresh` call |
| CORS | Restricted to `CLIENT_ORIGIN` only; `credentials: true` for cookie support |
| File uploads | Validated mime type and 5 MB size limit via Multer; stored on Cloudinary, not local disk |
| Input validation | express-validator on all auth inputs; controller-level guards on post content |
| Role enforcement | `requireModerator` middleware gate on all dashboard routes |
