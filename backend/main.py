from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import os

from app.database import engine, Base
from app.routers import auth, profiles, matching, chat
from app.routers.safety import router as safety_router
from app.routers.admin import router as admin_router

# Create tables
Base.metadata.create_all(bind=engine)

# Rate limiter (200 req/min per IP globally; auth routes override with stricter limits)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="Lovemaxxing API",
    description="AI-powered dating app backend",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://lovemaxxing.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local photo uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
app.include_router(matching.router, prefix="/matching", tags=["matching"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(safety_router, prefix="/safety", tags=["safety"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"message": "Lovemaxxing API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
