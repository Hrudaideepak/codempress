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
    try:
        user_info = await verify_google_id_token(request.id_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google authentication failed: {e}")
        raise HTTPException(status_code=400, detail="Google authentication failed")
    
    google_sub = user_info["sub"]
    email = user_info["email"]
    name = user_info.get("name", email.split("@")[0])
    picture = user_info.get("picture", "")

    # Upsert User based on google_sub or email
    existing = await execute_query("SELECT * FROM users WHERE google_sub = ? OR email = ?", (google_sub, email))
    if existing:
        user_id = existing[0]["_id"]
        await execute_write(
            "UPDATE users SET google_sub = ?, name = ?, picture = ?, last_active_date = CURRENT_TIMESTAMP WHERE _id = ?",
            (google_sub, name, picture, user_id)
        )
        xp = existing[0].get("xp", 0)
        streak = existing[0].get("streak_count", 1)
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
    sub_str = str(current_user.get("sub", "1"))
    user_id = int(sub_str) if sub_str.isdigit() else 1
    
    user_rows = await execute_query("SELECT * FROM users WHERE _id = ?", (user_id,))
    if user_rows:
        user = user_rows[0]
        return {
            "_id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture"),
            "xp": user.get("xp", 0),
            "streak_count": user.get("streak_count", 1)
        }
    
    # Return user details from valid JWT token payload if record isn't in database yet
    return {
        "_id": user_id,
        "email": current_user.get("email", ""),
        "name": current_user.get("name", "Explorer"),
        "picture": None,
        "xp": 0,
        "streak_count": 1
    }
