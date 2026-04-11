# Lovemaxxing 💘

AI-powered dating app that matches people based on shared interests, humor, and genuine physical attraction — not just swipes.

## Features

- **Interest Matching** — TikTok-style interest categories (humor, content, music, lifestyle) drive 40% of your match score
- **Vibe Alignment** — Humor and energy compatibility (dry humor, adventurous, deep thinker, etc.)
- **AI Face Analysis** — DeepFace detects your facial features; users describe their type; the algorithm cross-matches both sides
- **Lovemaxxing Score** — Proprietary 0-100 score combining all signals
- **Swipe UI** — Gesture-based card swipe with smooth animations
- **Real-time Chat** — WebSocket messaging for matched users
- **PWA** — Installable on mobile (iOS + Android) from the browser

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS · Framer Motion |
| State | Zustand |
| Backend | Python · FastAPI · SQLAlchemy |
| Database | PostgreSQL |
| Face AI | DeepFace |
| Photos | Cloudinary (or local fallback) |
| Auth | JWT (python-jose + bcrypt) |
| Real-time | WebSockets |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL

### Frontend

```bash
cd lovemaxxing
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb lovemaxxing

# Start server
python main.py
```

API runs at [http://localhost:8000](http://localhost:8000)  
Swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs)

## Matching Algorithm

```
Match Score = (Interest Jaccard × 40)
            + (Vibe Jaccard × 20)
            + (My prefs ∩ Their features / My prefs × 30)
            + (Their prefs ∩ My features / Their prefs × 10)
```

- **Interest overlap**: Jaccard similarity between interest sets
- **Vibe alignment**: Jaccard similarity between personality/humor tags
- **Face type compatibility**: Do the candidate's AI-detected features match what you've said you're attracted to?
- **Mutual attraction bonus**: Does the candidate prefer features you have?

## Project Structure

```
lovemaxxing/
├── app/                    # Next.js app router
│   ├── (auth)/            # Login & signup
│   ├── onboarding/        # 5-step onboarding flow
│   ├── discover/          # Swipe interface
│   ├── matches/           # Match list + conversations
│   ├── chat/[id]/         # Individual chat
│   └── profile/           # User profile editor
├── components/            # Shared UI components
├── lib/                   # API client, store, types, constants
├── public/                # Static assets + PWA manifest
└── backend/
    ├── main.py            # FastAPI app entry
    └── app/
        ├── models.py      # SQLAlchemy models
        ├── schemas.py     # Pydantic schemas
        ├── auth.py        # JWT auth
        ├── routers/       # API endpoints
        └── services/      # Face analysis, matching, storage
```

## Deployment

### Frontend → Vercel
```bash
npx vercel
```
Set `NEXT_PUBLIC_API_URL` to your backend URL.

### Backend → Railway / Render
Point to `backend/` directory. Set environment variables from `.env.example`.

## Environment Variables

### Frontend (`.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### Backend (`.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary (optional) |
| `CLOUDINARY_API_KEY` | Cloudinary (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary (optional) |

## License

MIT
