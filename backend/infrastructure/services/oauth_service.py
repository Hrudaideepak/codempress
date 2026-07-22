import os
import time
import jwt
import httpx
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from env_loader import get_api_key

JWT_SECRET = get_api_key("JWT_SECRET")
GOOGLE_CLIENT_ID = get_api_key("GOOGLE_CLIENT_ID")

is_prod = (
    os.environ.get("ENV") == "production" or 
    os.environ.get("PROD") == "true" or 
    os.environ.get("FASTAPI_ENV") == "production"
)

if is_prod:
    if not JWT_SECRET or JWT_SECRET == "codempress_super_secret_jwt_key_2026":
        raise RuntimeError("CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set in production mode!")
    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID == "dummy-google-client-id":
        raise RuntimeError("CRITICAL SECURITY ERROR: GOOGLE_CLIENT_ID environment variable must be set in production mode!")

# Fallback values for development environments only
if not JWT_SECRET:
    JWT_SECRET = "codempress_super_secret_jwt_key_2026"
if not GOOGLE_CLIENT_ID:
    GOOGLE_CLIENT_ID = "dummy-google-client-id"

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
    """FastAPI dependency to verify JWT and return decoded payload."""
    if not credentials:
        # Prevent developer credentials bypass in production environments
        is_prod = (
            os.environ.get("ENV") == "production" or 
            os.environ.get("PROD") == "true" or 
            os.environ.get("FASTAPI_ENV") == "production"
        )
        if is_prod:
            raise HTTPException(status_code=401, detail="Authentication credentials are required")
            
        # Dev fallback user if no auth token provided in non-production environments
        return {"sub": "1", "email": "arjun@example.com", "name": "Arjun Kumar (Dev)"}
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

_client = None

def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=10.0)
    return _client

async def close_auth_client():
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()

async def verify_google_id_token(id_token: str) -> dict:
    """Verifies Google ID Token against Google's tokeninfo endpoint and validates audience claim."""
    client = get_http_client()
    resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google ID Token")
    
    token_info = resp.json()
    
    # Enforce Audience validation checking if configured
    aud = token_info.get("aud")
    if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID != "dummy-google-client-id":
        if aud != GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=400, detail="Token audience claim mismatch")
            
    return {
        "sub": token_info["sub"],
        "email": token_info["email"],
        "name": token_info.get("name", token_info["email"].split("@")[0]),
        "picture": token_info.get("picture", "")
    }
