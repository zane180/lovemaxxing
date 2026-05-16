# Lovemaxxing

**AI-powered dating app that matches people on shared personality, interests, and genuine physical compatibility — not just swipes.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-lovemaxxing.vercel.app-black?style=flat-square&logo=vercel)](https://lovemaxxing.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Claude AI](https://img.shields.io/badge/Claude%20Vision%20API-D97706?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python%203.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)

---

## The Problem

Modern dating apps reduce compatibility to a photo and a swipe. This ignores the signals that actually predict relationship success — shared humor, lifestyle alignment, and genuine mutual physical attraction. Lovemaxxing quantifies all three into a single **Lovemaxxing Score (0–100)** and uses that to rank your discovery feed.

---

## Live Demo

**[lovemaxxing.vercel.app](https://lovemaxxing.vercel.app)**

> Create an account, complete the 5-step onboarding (upload a photo, pick your interests and vibe, describe your type), and see your ranked match feed in real time.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Next.js 14)                   │
│  App Router · Zustand · Framer Motion · Tailwind CSS    │
└───────────────────────┬─────────────────────────────────┘
                        │ REST + WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend                         │
│                                                          │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Auth /JWT │  │  Rate Limiter│  │  Safety Router  │ │
│  │  + Email   │  │  200 req/min │  │  Block · Report │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AI Pipeline                         │   │
│  │                                                  │   │
│  │  Photo Upload → Claude Vision API (Haiku)        │   │
│  │      → Structured JSON feature extraction        │   │
│  │      → Stored as analyzed_features[]             │   │
│  │                                                  │   │
│  │  Matching Engine                                 │   │
│  │      → Filter candidates (gender, age, blocks)   │   │
│  │      → Score each pair (Jaccard + preferences)   │   │
│  │      → Sort descending by Lovemaxxing Score      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │  PostgreSQL       │   │  WebSocket Chat Server   │   │
│  │  SQLAlchemy ORM   │   │  Bidirectional messages  │   │
│  └──────────────────┘   └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## AI Pipeline: Claude Vision → Structured Feature Extraction

When a user uploads their profile photo during onboarding, it goes through a multimodal inference pipeline:

**1. Image → Claude Haiku (Vision)**

The photo is base64-encoded and sent to `claude-haiku-4-5-20251001` with a constrained structured prompt. Claude is instructed to select only from a predefined vocabulary of 40+ facial descriptors (face shape, eye shape, jawline, skin tone, build indicators) and return strict JSON — no freeform text.

```python
# backend/app/services/face_analysis.py
message = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=256,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", ...}},
            {"type": "text", "text": ANALYSIS_PROMPT}   # constrained vocab prompt
        ]
    }]
)
```

**2. Output Validation**

The response is parsed and cross-validated against the same `VALID_FEATURES` list used by the frontend — ensuring zero label drift between what users select as their "type" and what the model outputs for detected features.

**3. Storage**

Extracted features are stored in `users.analyzed_features` (PostgreSQL JSON column) and used at query time by the matching engine — no re-inference on every swipe.

**Why Claude Haiku?** Low latency (~500ms), low cost per inference, and strong structured output compliance. This is a user-blocking onboarding step, so speed matters more than the marginal accuracy gain from a larger model.

---

## Matching Algorithm

The Lovemaxxing Score is computed pairwise at query time for each candidate:

```
Score = (Jaccard(my_interests, their_interests) × 40)
      + (Jaccard(my_vibes, their_vibes)          × 20)
      + (|my_prefs ∩ their_features| / |my_prefs| × 30)
      + (|their_prefs ∩ my_features| / |their_prefs| × 10)
```

| Component | Weight | Signal |
|---|---|---|
| Interest overlap | 40% | Jaccard similarity on TikTok-style interest tags |
| Vibe alignment | 20% | Jaccard similarity on humor/personality tags |
| Face type compatibility | 30% | Fraction of your stated preferences matched by their AI-detected features |
| Mutual attraction | 10% | Bonus if they'd also be attracted to your features |

**Jaccard similarity** was chosen over cosine or Euclidean distance because the feature space is a sparse set of categorical labels — Jaccard penalizes both missing overlap and excess tags, which correctly rewards users who share a precise niche interest over broad, vague ones.

**Candidate filtering** runs before scoring: the SQL query excludes already-swiped users, blocked users (bidirectional), incomplete profiles, and users outside the age range preference. Scoring only runs on the resulting pool (max 50), keeping latency predictable regardless of user base size.

---

## Engineering Challenges

**Constrained LLM output for a closed vocabulary**

The naive approach (ask Claude to describe facial features in freeform) produces inconsistent labels that can't be matched against user preferences. The fix was a prompt engineering technique: inject the full 40-label vocabulary into the system prompt and instruct the model to return only exact label strings in JSON. Labels are then validated server-side against the same constant list imported by the frontend — making label drift a compile-time impossibility.

**Bidirectional blocking in SQL**

A block must exclude the blocked user from *both* parties' discovery feeds, but a naive query only filters on `blocker_id`. The fix uses two subqueries — one for blocks I've made, one for blocks made against me — and excludes both sets in a single query, avoiding a second round-trip.

**WebSocket state across matched users**

Chat requires a persistent connection scoped to a specific `match_id`. FastAPI's native WebSocket support handles the connection lifecycle, but connection state (active connections per match) lives in a Python dict in-process. This works for a single-instance deployment; a Redis pub/sub layer would be needed for horizontal scaling.

**Mobile performance on the swipe UI**

The discover feed ran `requestAnimationFrame` loops for card physics even when the tab was backgrounded, causing battery drain on mobile. The fix pauses all rAF loops when the component unmounts or the page loses visibility, using the `visibilitychange` event and a ref-tracked cancellation flag.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion |
| State | Zustand |
| Backend | Python 3.11 · FastAPI · SQLAlchemy · Uvicorn |
| Database | PostgreSQL |
| AI / Vision | Anthropic Claude Vision API (`claude-haiku-4-5-20251001`) |
| Auth | JWT (python-jose) · bcrypt · Email verification |
| Real-time | WebSockets (FastAPI native) |
| Photo Storage | Cloudinary (production) · local `/uploads` (development) |
| Rate Limiting | slowapi (200 req/min per IP globally) |
| Deployment | Vercel (frontend) · Railway (backend + DB) |

---

## Project Structure

```
lovemaxxing/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login & signup
│   ├── onboarding/             # 5-step onboarding flow
│   ├── discover/               # Swipe interface
│   ├── matches/                # Match list + conversations
│   ├── chat/[id]/              # Individual WebSocket chat
│   └── profile/                # Profile editor
├── components/                 # Shared UI components
├── lib/                        # API client · Zustand store · types · constants
├── public/                     # Static assets · PWA manifest
└── backend/
    ├── main.py                 # FastAPI entry · CORS · rate limiting · migrations
    └── app/
        ├── models.py           # SQLAlchemy models (User, Match, Swipe, Message, Block, Report)
        ├── schemas.py          # Pydantic request/response schemas
        ├── auth.py             # JWT issuance · verification
        ├── routers/            # auth · profiles · matching · chat · safety · admin
        └── services/
            ├── face_analysis.py    # Claude Vision API integration
            ├── matching_engine.py  # Scoring algorithm · candidate filtering
            └── storage.py          # Cloudinary / local photo storage
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Frontend

```bash
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set DATABASE_URL, SECRET_KEY, ANTHROPIC_API_KEY
createdb lovemaxxing
python main.py
```

Frontend → [localhost:3000](http://localhost:3000) · Backend → [localhost:8000](http://localhost:8000) · API docs → [localhost:8000/docs](http://localhost:8000/docs)

### Environment Variables

**Frontend (`.env.local`)**
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

**Backend (`.env`)**
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ANTHROPIC_API_KEY` | Claude Vision API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary (optional) |
| `CLOUDINARY_API_KEY` | Cloudinary (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary (optional) |

---

## What I'd Build Next

- **Embedding-based matching** — encode interest/vibe tags with a sentence transformer and use cosine similarity over the full vector, enabling semantic matches ("hiking" ↔ "outdoors") rather than exact tag overlap
- **Redis pub/sub** — replace the in-process WebSocket connection dict to support horizontal backend scaling
- **A/B testing the scoring weights** — run experiments on the 40/20/30/10 split to optimize for match-to-conversation conversion rate
- **Swipe history analytics** — aggregate left/right swipe patterns to surface implicit preference signals beyond the onboarding selections

---

## License

MIT
