from backend.infrastructure.database.db_connection import (
    DB_PATH,
    get_db_connection,
    execute_query,
    execute_write,
    execute_batch_write
)

async def ensure_user_exists(user_id: int) -> int:
    """Ensures user record exists in users database table to prevent foreign key constraint failures."""
    if not user_id or user_id <= 0:
        user_id = 1
    try:
        rows = await execute_query("SELECT _id FROM users WHERE _id = ?", (user_id,))
        if not rows:
            try:
                await execute_write(
                    "INSERT INTO users (_id, google_sub, email, name) VALUES (?, ?, ?, ?)",
                    (user_id, f"sub_{user_id}", f"user_{user_id}@codempress.app", "Explorer")
                )
            except Exception:
                new_id = await execute_write(
                    "INSERT INTO users (google_sub, email, name) VALUES (?, ?, ?)",
                    (f"anon_{user_id}", f"user_{user_id}@codempress.app", "Explorer")
                )
                return new_id
    except Exception:
        pass
    return user_id
