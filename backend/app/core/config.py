import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
raw_db_path = os.environ.get("DB_PATH") or os.environ.get("DATABASE_PATH")
DB_PATH = Path(raw_db_path) if raw_db_path else BASE_DIR / "database" / "skillforge.db"


import logging

logger = logging.getLogger(__name__)

class Settings(BaseModel):
    ENV: str = os.environ.get("ENV", "development")
    PROD: bool = (
        os.environ.get("ENV") == "production" or 
        os.environ.get("PROD") == "true" or 
        os.environ.get("FASTAPI_ENV") == "production"
    )
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "codempress_super_secret_jwt_key_2026")
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "dummy-google-client-id")
    ALLOWED_ORIGINS: list[str] = [
        o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()
    ]
    # Supabase Database & Service Integration Settings
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", os.environ.get("VITE_SUPABASE_URL", ""))
    SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", os.environ.get("SUPABASE_ANON_KEY", os.environ.get("VITE_SUPABASE_ANON_KEY", "")))
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_SERVICE_KEY", ""))
    POSTGRES_URL: str = os.environ.get("POSTGRES_URL", os.environ.get("SUPABASE_DB_URL", ""))
    USE_SUPABASE: bool = os.environ.get("USE_SUPABASE", "false").lower() in ("true", "1", "yes")

settings = Settings()

if settings.PROD and settings.JWT_SECRET == "codempress_super_secret_jwt_key_2026":
    logger.warning("CRITICAL SECURITY WARNING: Production mode detected but default fallback JWT_SECRET is active! Set JWT_SECRET env var.")

