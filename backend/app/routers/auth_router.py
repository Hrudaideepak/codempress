import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from backend.database import execute_query, execute_write
from backend.auth import verify_google_id_token, create_jwt_token, get_current_user

logger = logging.getLogger("codempress.auth_router")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class GoogleAuthRequest(BaseModel):
    id_token: str

@router.post("/google")
async def auth_google(request: GoogleAuthRequest):
    """Verifies Google ID token and returns a custom HS256 JWT."""
    user_info = await verify_google_id_token(request.id_token)
    
    google_sub = user_info["sub"]
    email = user_info["email"]
    name = user_info["name"]
    picture = user_info["picture"]

    # Upsert User
    existing = await execute_query("SELECT * FROM users WHERE google_sub = ?", (google_sub,))
    if existing:
        user_id = existing[0]["_id"]
        await execute_write("UPDATE users SET name = ?, picture = ?, last_active_date = CURRENT_TIMESTAMP WHERE _id = ?", (name, picture, user_id))
        xp = existing[0]["xp"]
        streak = existing[0]["streak_count"]
    else:
        user_id = await execute_write(
            "INSERT INTO users (google_sub, email, name, picture) VALUES (?, ?, ?, ?)",
            (google_sub, email, name, picture)
        )
        xp = 0
        streak = 1

    token = create_jwt_token(user_id, email, name)
    
    return {
        "token": token,
        "user": {
            "_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "xp": xp,
            "streak_count": streak
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the current logged in user details including fresh statistics."""
    user_id = int(current_user["sub"])
    user_rows = await execute_query("SELECT * FROM users WHERE _id = ?", (user_id,))
    if not user_rows:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = user_rows[0]
    return {
        "_id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "xp": user["xp"],
        "streak_count": user["streak_count"]
    }

@router.post("/dev-login")
async def dev_login():
    """Bypasses OAuth in local development environments and returns a valid JWT token."""
    from backend.infrastructure.services.oauth_service import is_prod
    if is_prod:
        raise HTTPException(status_code=403, detail="Developer bypass is disabled in production!")
    
    # Check if dev user exists in SQLite
    user_rows = await execute_query("SELECT * FROM users WHERE _id = ?", (1,))
    if not user_rows:
        await execute_write(
            "INSERT INTO users (_id, google_sub, email, name, picture, xp, streak_count) "
            "VALUES (1, 'dev-sub-12345', 'arjun@example.com', 'Arjun Kumar (Dev)', '', 100, 3)"
        )
        user_id = 1
        xp = 100
        streak = 3
    else:
        user_id = 1
        xp = user_rows[0]["xp"]
        streak = user_rows[0]["streak_count"]
        
    token = create_jwt_token(user_id, "arjun@example.com", "Arjun Kumar (Dev)")
    
    return {
        "token": token,
        "user": {
            "_id": user_id,
            "email": "arjun@example.com",
            "name": "Arjun Kumar (Dev)",
            "picture": "",
            "xp": xp,
            "streak_count": streak
        }
    }
