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
from backend.app.routers.progress_router import router as progress_router
from backend.app.routers.roadmap_router import router as roadmap_router
from backend.app.routers.custom_roadmap_router import router as custom_roadmap_router
from backend.app.routers.sandbox_router import router as sandbox_router
from backend.app.routers.enrollments_router import router as enrollments_router
from backend.app.routers.mentor_router import router as mentor_router

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
        from backend.database import execute_write
        await execute_write("""
        CREATE TABLE IF NOT EXISTS users (
            _id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_sub TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            picture TEXT,
            xp INTEGER DEFAULT 0,
            streak_count INTEGER DEFAULT 0,
            last_active_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        await execute_write("""
        INSERT OR IGNORE INTO users (_id, google_sub, email, name)
        VALUES (1, 'guest_explorer_1', 'explorer@codempress.app', 'Explorer');
        """)
        await execute_write("""
        CREATE TABLE IF NOT EXISTS user_progress (
            _id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic_id INTEGER NOT NULL,
            theory_read BOOLEAN DEFAULT 0,
            quizzes_taken INTEGER DEFAULT 0,
            quizzes_passed INTEGER DEFAULT 0,
            mastery_percent INTEGER DEFAULT 0,
            last_studied TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(_id) ON DELETE CASCADE,
            FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE,
            UNIQUE(user_id, topic_id)
        );
        """)
        await execute_write("""
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            _id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic_id INTEGER NOT NULL,
            score_percent INTEGER NOT NULL,
            xp_earned INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(_id) ON DELETE CASCADE,
            FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE
        );
        """)
        await execute_write("CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);")
        await execute_write("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic ON quiz_attempts(user_id, topic_id);")
        await execute_write("CREATE INDEX IF NOT EXISTS idx_user_progress_user_topic ON user_progress(user_id, topic_id);")
        await execute_write("CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_name, _id);")
        logger.info("Database performance indexing & table schema verified.")
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

# Universal Bulletproof CORS & Observability Middleware
@app.middleware("http")
async def observability_and_cors_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.perf_counter()
    origin = request.headers.get("origin", "*")
    
    # Preflight OPTIONS request handler - guarantee instant 200 OK with full CORS headers
    if request.method == "OPTIONS":
        res = JSONResponse(status_code=200, content={"status": "ok"})
        res.headers["Access-Control-Allow-Origin"] = origin if origin != "*" else "*"
        res.headers["Access-Control-Allow-Credentials"] = "true"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        res.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Request-ID, Accept, Origin, User-Agent"
        res.headers["Access-Control-Max-Age"] = "86400"
        return res

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
        
        # Inject CORS & Telemetry headers into all normal responses
        response.headers["Access-Control-Allow-Origin"] = origin if origin != "*" else "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Request-ID, Accept, Origin, User-Agent"
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        
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
        res.headers["Access-Control-Allow-Origin"] = origin if origin != "*" else "*"
        res.headers["Access-Control-Allow-Credentials"] = "true"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        res.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Request-ID, Accept, Origin, User-Agent"
        res.headers["X-Request-ID"] = req_id
        res.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return res

# Sliding-Window IP Rate Limiter for API & AI protection
_rate_limit_store: Dict[str, list] = {}

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Allow health checks and telemetry without rate limiting
    path = request.url.path
    if path in ("/health", "/api/health", "/api/telemetry", "/ready", "/api/ready") or request.method == "OPTIONS":
        return await call_next(request)

    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    window = 60.0  # 60 seconds
    
    is_ai = "/api/ai" in path or "/api/mentor" in path
    max_reqs = 30 if is_ai else 180

    timestamps = _rate_limit_store.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < window]
    
    if len(timestamps) >= max_reqs:
        retry_after = int(window - (now - timestamps[0])) if timestamps else 60
        return JSONResponse(
            status_code=429,
            content={
                "detail": f"Rate limit exceeded. Please wait {max(1, retry_after)} seconds before retrying.",
                "retry_after_seconds": max(1, retry_after)
            },
            headers={"Retry-After": str(max(1, retry_after))}
        )
        
    timestamps.append(now)
    _rate_limit_store[client_ip] = timestamps
    return await call_next(request)

# Mount Router Modules
app.include_router(auth_router)
app.include_router(curriculum_router)
app.include_router(generation_router)
app.include_router(quiz_router)
app.include_router(ai_router)
app.include_router(progress_router)
app.include_router(roadmap_router)
app.include_router(custom_roadmap_router)
app.include_router(sandbox_router)
app.include_router(enrollments_router)
app.include_router(mentor_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Codempress API", "version": "1.0.0"}

@app.get("/ready")
@app.get("/api/ready")
async def readiness_check():
    """Kubernetes / Cloud readiness probe verifying database connectivity."""
    try:
        from backend.database import execute_query
        rows = await execute_query("SELECT 1")
        if rows:
            return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not_ready", "error": str(e)})
    return JSONResponse(status_code=503, content={"status": "not_ready", "error": "Database returned empty response"})

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
