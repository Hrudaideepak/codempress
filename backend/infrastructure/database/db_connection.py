import sqlite3
import threading
import logging
import time
import sys
from pathlib import Path
from starlette.concurrency import run_in_threadpool

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_DIR = BASE_DIR / "database"
DB_PATH = DB_DIR / "skillforge.db"

# Ensure BASE_DIR and content are in sys.path
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
content_dir = BASE_DIR / "content"
if str(content_dir) not in sys.path:
    sys.path.insert(0, str(content_dir))

logger = logging.getLogger("codempress.database")

# Thread-local storage for database connections
_local = threading.local()

def ensure_database_seeded():
    """Ensure database directory, tables, and curriculum topics exist automatically."""
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        logger.info(f"Database missing at {DB_PATH}. Initializing schema and curriculum topics...")
        DB_DIR.mkdir(parents=True, exist_ok=True)
        try:
            from content.seed_topics import init_and_seed_db
            init_and_seed_db()
            logger.info("Database successfully seeded.")
        except Exception as e:
            logger.error(f"Failed to run init_and_seed_db: {e}. Falling back to schema DDL execution.")
            conn = sqlite3.connect(str(DB_PATH))
            schema_path = DB_DIR / "schema.sql"
            if schema_path.exists():
                conn.executescript(schema_path.read_text(encoding="utf-8"))
            conn.commit()
            conn.close()

def get_db_connection() -> sqlite3.Connection:
    """Returns a thread-local SQLite connection, creating and seeding it if needed."""
    ensure_database_seeded()
    
    if not hasattr(_local, "conn") or _local.conn is None:
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=20.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA temp_store=MEMORY;")
        conn.execute("PRAGMA foreign_keys=ON;")  # Enforce foreign key constraints
        _local.conn = conn
        
    return _local.conn

def _sync_execute_query(query: str, params: tuple = ()):
    conn = get_db_connection()
    retries = 3
    delay = 0.1
    for attempt in range(retries):
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.OperationalError as e:
            if "locked" in str(e).lower() and attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            logger.error(f"Database query failed: {query} with params {params}. Error: {e}")
            raise e
        except Exception as e:
            logger.error(f"Database query failed: {query} with params {params}. Error: {e}")
            raise e
        finally:
            cursor.close()

def _sync_execute_write(query: str, params: tuple = ()) -> int:
    conn = get_db_connection()
    retries = 5
    delay = 0.1
    for attempt in range(retries):
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid
        except sqlite3.OperationalError as e:
            conn.rollback()
            if "locked" in str(e).lower() and attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            logger.error(f"Database write failed: {query} with params {params}. Error: {e}")
            raise e
        except Exception as e:
            conn.rollback()
            logger.error(f"Database write failed: {query} with params {params}. Error: {e}")
            raise e
        finally:
            cursor.close()

def _sync_execute_batch_write(queries_and_params: list) -> list:
    """Executes multiple write queries within a single transaction, rolling back all on failure."""
    conn = get_db_connection()
    retries = 5
    delay = 0.1
    for attempt in range(retries):
        cursor = conn.cursor()
        try:
            last_row_ids = []
            for query, params in queries_and_params:
                cursor.execute(query, params)
                last_row_ids.append(cursor.lastrowid)
            conn.commit()
            return last_row_ids
        except sqlite3.OperationalError as e:
            conn.rollback()
            if "locked" in str(e).lower() and attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            logger.error(f"Database batch write failed. Transaction rolled back. Error: {e}")
            raise e
        except Exception as e:
            conn.rollback()
            logger.error(f"Database batch write failed. Transaction rolled back. Error: {e}")
            raise e
        finally:
            cursor.close()

async def execute_query(query: str, params: tuple = ()):
    """Non-blocking async query execution offloaded to ThreadPool."""
    return await run_in_threadpool(_sync_execute_query, query, params)

async def execute_write(query: str, params: tuple = ()) -> int:
    """Non-blocking async write execution offloaded to ThreadPool."""
    return await run_in_threadpool(_sync_execute_write, query, params)

async def execute_batch_write(queries_and_params: list) -> list:
    """Non-blocking async batch write execution offloaded to ThreadPool."""
    return await run_in_threadpool(_sync_execute_batch_write, queries_and_params)
