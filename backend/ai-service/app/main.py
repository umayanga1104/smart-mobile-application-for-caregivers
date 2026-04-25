# app/main.py

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routers import chat, tips
from app.models.schemas import HealthResponse

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Rate Limiter ──
limiter = Limiter(key_func=get_remote_address)


# ── Lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"🚀 CareCompanion AI starting | Model: {settings.LLM_MODEL}")
    yield
    logger.info("👋 CareCompanion AI shutting down")


# ── App ──
app = FastAPI(
    title="CareCompanion AI — Caregiver Support Microservice",
    description=(
        "An empathetic AI chat companion and tips generator "
        "built for caregivers. Powered by LLaMA 3.3 70B via Groq."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware ──
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # Lock this down for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "You're sending messages too fast. "
                       "Take a breath — I'll be right here when you're ready 💛"
        },
    )


# ── Routes ──
app.include_router(chat.router, prefix="/api/v1")
app.include_router(tips.router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        service="CareCompanion AI",
        llm_provider="Groq",
        llm_model=settings.LLM_MODEL,
    )