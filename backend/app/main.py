import os
import sys
import time
import uuid
import logging
import traceback
from pathlib import Path
from typing import Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.routers.auth_router import router as auth_router
from backend.app.routers.curriculum_router import router as curriculum_router
from backend.app.routers.generation_router import router as generation_router
from backend.app.routers.quiz_router import router as quiz_router
from backend.app.routers.ai_router import router as ai_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s")
logger = logging.getLogger("codempress.app")

# Telemetry metrics accumulator
_telemetry_metrics: Dict[str, Any] = {
    "start_time": time.time(),
    "total_requests": 0,
    "success_2xx": 0,
    "error_4xx": 0,
    "error_5xx": 0,
    "total_latency_ms": 0.0,
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Codempress API Engine services...")
    try:
        from backend.infrastructure.database.db_connection import ensure_database_seeded
        ensure_database_seeded()
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

# Observability Middleware: Request Correlation ID + Structured Telemetry Logging + Performance Metrics
@app.middleware("http")
async def observability_telemetry_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.perf_counter()
    
    _telemetry_metrics["total_requests"] += 1
    
    try:
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        status = response.status_code
        if 200 <= status < 300:
            _telemetry_metrics["success_2xx"] += 1
        elif 400 <= status < 500:
            _telemetry_metrics["error_4xx"] += 1
        elif status >= 500:
            _telemetry_metrics["error_5xx"] += 1
            
        _telemetry_metrics["total_latency_ms"] += duration_ms
        
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        
        # Structured log entry for request observability
        logger.info(
            f"req_id={req_id} method={request.method} path={request.url.path} status={status} duration_ms={duration_ms:.2f}"
        )
        return response
    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        _telemetry_metrics["error_5xx"] += 1
        _telemetry_metrics["total_latency_ms"] += duration_ms
        
        logger.error(
            f"req_id={req_id} UNHANDLED EXCEPTION method={request.method} path={request.url.path} duration_ms={duration_ms:.2f} error={exc}\n{traceback.format_exc()}"
        )
        res = JSONResponse(
            status_code=500,
            content={
                "detail": "An internal server error occurred. The system has automatically recovered.",
                "request_id": req_id
            }
        )
        res.headers["X-Request-ID"] = req_id
        res.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return res

# Mount Router Modules
app.include_router(auth_router)
app.include_router(curriculum_router)
app.include_router(generation_router)
app.include_router(quiz_router)
app.include_router(ai_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "Codempress API", "version": "1.0.0"}

@app.get("/api/telemetry")
async def get_telemetry():
    """Observability endpoint exposing real-time API latency, request counters, database status, and uptime."""
    uptime_seconds = int(time.time() - _telemetry_metrics["start_time"])
    total_reqs = _telemetry_metrics["total_requests"]
    avg_latency = (_telemetry_metrics["total_latency_ms"] / total_reqs) if total_reqs > 0 else 0.0
    
    db_status = "connected"
    try:
        from backend.database import execute_query
        res = await execute_query("SELECT 1")
        if not res:
            db_status = "degraded"
    except Exception as e:
        db_status = f"disconnected: {e}"

    return {
        "status": "healthy",
        "uptime_seconds": uptime_seconds,
        "database_status": db_status,
        "metrics": {
            "total_requests": total_reqs,
            "success_2xx": _telemetry_metrics["success_2xx"],
            "error_4xx": _telemetry_metrics["error_4xx"],
            "error_5xx": _telemetry_metrics["error_5xx"],
            "avg_latency_ms": round(avg_latency, 2)
        }
    }
