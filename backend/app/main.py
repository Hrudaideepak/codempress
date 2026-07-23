import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from contextlib import asynccontextmanager

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.routers.auth_router import router as auth_router
from backend.app.routers.curriculum_router import router as curriculum_router
from backend.app.routers.generation_router import router as generation_router
from backend.app.routers.quiz_router import router as quiz_router
from backend.app.routers.ai_router import router as ai_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("codempress.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Codempress API Engine services...")
    try:
        from backend.database import execute_write
        await execute_write("CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);")
        await execute_write("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic ON quiz_attempts(user_id, topic_id);")
        await execute_write("CREATE INDEX IF NOT EXISTS idx_user_progress_user_topic ON user_progress(user_id, topic_id);")
        await execute_write("CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_name, _id);")
        logger.info("Database performance indexing verified.")
    except Exception as e:
        logger.warning(f"Failed to create performance indexes: {e}")
    yield
    # Shutdown
    logger.info("Cleaning up Codempress API Engine resources...")
    from backend.ai_engine import ai_engine
    from backend.auth import close_auth_client
    await ai_engine.close()
    await close_auth_client()

app = FastAPI(
    title="Codempress API Engine",
    description="Backend API for Codempress AI-powered CS Learning Operating System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Setup - Explicitly allow Vercel production frontend & local dev environments
allowed_origins = [
    "https://codempress.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
origins_env = os.environ.get("ALLOWED_ORIGINS")
if origins_env:
    for o in origins_env.split(","):
        stripped = o.strip()
        if stripped and stripped not in allowed_origins:
            allowed_origins.append(stripped)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cross-Origin Opener Policy middleware for Google OAuth popup postMessage support
@app.middleware("http")
async def add_coop_header_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response

# Global crash protection middleware
@app.middleware("http")
async def global_crash_protection_middleware(request: Request, call_next):
    """Catches all unhandled runtime exceptions at the HTTP boundary to prevent server crashes."""
    try:
        return await call_next(request)
    except Exception as exc:
        logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. The system has automatically recovered."}
        )

# Mount Router Modules
app.include_router(auth_router)
app.include_router(curriculum_router)
app.include_router(generation_router)
app.include_router(quiz_router)
app.include_router(ai_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "Codempress API", "version": "1.0.0"}
