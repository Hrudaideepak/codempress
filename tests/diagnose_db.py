import sqlite3
from pathlib import Path

db_path = Path("database/skillforge.db").resolve()
print("Database path:", db_path)
print("File exists:", db_path.exists())
if db_path.exists():
    print("File size:", db_path.stat().st_size, "bytes")
    
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Get tables list
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables in DB:", [r[0] for r in cursor.fetchall()])

# Count topics
cursor.execute("SELECT COUNT(*) FROM topics;")
print("Topics count:", cursor.fetchone()[0])

# Sample topics
cursor.execute("SELECT _id, subject_name, title FROM topics LIMIT 5;")
print("Sample topics:", cursor.fetchall())

# Count users
cursor.execute("SELECT COUNT(*) FROM users;")
print("Users count:", cursor.fetchone()[0])

# Count user progress
cursor.execute("SELECT COUNT(*) FROM user_progress;")
print("User progress count:", cursor.fetchone()[0])

conn.close()
