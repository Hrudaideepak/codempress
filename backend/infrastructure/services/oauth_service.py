import os
import time
import jwt
import httpx
import logging
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from env_loader import get_api_key

logger = logging.getLogger("codempress.oauth")

DEFAULT_GOOGLE_CLIENT_ID = "679239699589-urpbqdd50nvop2hgkeuc508q850glfj1.apps.googleusercontent.com"
DEFAULT_JWT_SECRET = "codempress_super_secret_jwt_key_2026_production_secure"

JWT_SECRET = get_api_key("JWT_SECRET") or os.environ.get("JWT_SECRET", DEFAULT_JWT_SECRET)
GOOGLE_CLIENT_ID = get_api_key("GOOGLE_CLIENT_ID") or os.environ.get("GOOGLE_CLIENT_ID", DEFAULT_GOOGLE_CLIENT_ID)

ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

def create_jwt_token(user_id: int, email: str, name: str) -> str:
    """Generates a custom HS256 JWT valid for 7 days."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "iat": int(time.time()),
        "exp": int(time.time()) + (7 * 24 * 3600) # 7 Days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """FastAPI dependency to verify JWT and return decoded payload (strict auth required)."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication credentials are required")
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Security(security)) -> Optional[dict]:
    """FastAPI dependency that returns decoded user payload if valid JWT provided, else None."""
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

_client = None

def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=15.0)
    return _client

async def close_auth_client():
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()

async def verify_google_id_token(id_token: str) -> dict:
    """Verifies Google ID Token against Google's tokeninfo endpoint."""
    client = get_http_client()
    try:
        resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
    except Exception as exc:
        logger.error(f"Failed to connect to Google OAuth verification endpoint: {exc}")
        raise HTTPException(status_code=502, detail="Google authentication verification service unavailable")

    if resp.status_code != 200:
        logger.warning(f"Google token verification failed with status {resp.status_code}: {resp.text}")
        raise HTTPException(status_code=400, detail="Invalid Google ID Token")
    
    token_info = resp.json()
    if "email" not in token_info or "sub" not in token_info:
        raise HTTPException(status_code=400, detail="Malformed Google ID Token payload")

    return {
        "sub": token_info["sub"],
        "email": token_info["email"],
        "name": token_info.get("name", token_info["email"].split("@")[0]),
        "picture": token_info.get("picture", "")
    }
