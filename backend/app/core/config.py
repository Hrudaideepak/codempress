import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_PATH = BASE_DIR / "database" / "skillforge.db"

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

settings = Settings()
