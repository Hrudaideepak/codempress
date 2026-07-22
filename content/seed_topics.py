import sqlite3
import os
import sys
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "database"
DB_PATH = DB_DIR / "skillforge.db"
SCHEMA_PATH = DB_DIR / "schema.sql"

# Add root directory to sys.path to import curriculum modules
sys.path.insert(0, str(BASE_DIR))
from curriculum import CURRICULUM
from curriculum_cs_fundamentals import get_full_curriculum

def init_and_seed_db():
    """Creates the SQLite database tables and seeds all 3,405 topics from curriculum files."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode = WAL;")

    # Execute schema DDL
    print(f"Reading schema DDL from {SCHEMA_PATH}...")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cursor.executescript(schema_sql)
    conn.commit()
    print("Database tables initialized successfully.")

    # Load Full Curriculum (34 Subjects, 3,405 Topics)
    full_curriculum = get_full_curriculum()
    total_subjects = len(full_curriculum)
    print(f"\nSeeding {total_subjects} subjects into 'topics' table...")

    inserted_count = 0
    skipped_count = 0

    for subject in full_curriculum:
        subject_name = subject["name"]
        topics = subject["topics"]

        for t in topics:
            title = t["title"]
            level = t["level"]

            try:
                cursor.execute(
                    "INSERT INTO topics (subject_name, title, level) VALUES (?, ?, ?)",
                    (subject_name, title, level)
                )
                inserted_count += 1
            except sqlite3.IntegrityError:
                # Already exists
                skipped_count += 1

    conn.commit()
    
    # Get total count in DB
    cursor.execute("SELECT COUNT(*) FROM topics")
    db_total = cursor.fetchone()[0]
    conn.close()

    print("\n" + "="*60)
    print("[SUCCESS] DB SEEDING COMPLETE!")
    print(f"  - Topics Inserted : {inserted_count}")
    print(f"  - Topics Skipped  : {skipped_count}")
    print(f"  - Total DB Topics : {db_total} across {total_subjects} subjects")
    print(f"  - Database File   : {DB_PATH}")
    print("="*60)

if __name__ == "__main__":
    init_and_seed_db()
