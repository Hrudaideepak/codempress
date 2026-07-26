import sqlite3
import os
import sys
import time
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
raw_db_path = os.environ.get("DB_PATH") or os.environ.get("DATABASE_PATH")
if raw_db_path:
    DB_PATH = Path(raw_db_path)
    DB_DIR = DB_PATH.parent
else:
    DB_DIR = BASE_DIR / "database"
    DB_PATH = DB_DIR / "skillforge.db"
SCHEMA_PATH = BASE_DIR / "database" / "schema.sql"

# Add root directory and content directory to sys.path
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
content_dir = BASE_DIR / "content"
if str(content_dir) not in sys.path:
    sys.path.insert(0, str(content_dir))

from curriculum_cs_fundamentals import get_full_curriculum

def init_and_seed_db():
    """Creates the SQLite database tables and seeds all 3,405 topics instantly using batch executemany."""
    t0 = time.perf_counter()
    DB_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")

    # Execute schema DDL
    if SCHEMA_PATH.exists():
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        cursor.executescript(schema_sql)
        conn.commit()

    # Load Full Curriculum (34 Subjects, 3,405 Topics)
    full_curriculum = get_full_curriculum()
    total_subjects = len(full_curriculum)

    records = []
    for subject in full_curriculum:
        subject_name = subject["name"]
        for t in subject["topics"]:
            records.append((subject_name, t["title"], t["level"]))

    # High-speed batch insert
    cursor.executemany(
        "INSERT OR IGNORE INTO topics (subject_name, title, level) VALUES (?, ?, ?)",
        records
    )
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM topics")
    db_total = cursor.fetchone()[0]
    conn.close()

    t1 = time.perf_counter()
    print(f"[SUCCESS] Database seeded {db_total} topics across {total_subjects} subjects in {(t1-t0)*1000:.2f} ms.")

if __name__ == "__main__":
    init_and_seed_db()
