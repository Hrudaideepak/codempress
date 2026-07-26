import sys
import os
import pytest
import sqlite3
import subprocess
import time
from pathlib import Path

# Change working dir to project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
os.chdir(PROJECT_ROOT)
sys.path.insert(0, str(PROJECT_ROOT))

print(f"Working Directory: {os.getcwd()}")

# 1. Run pytest suite programmatically
print("=== Running Pytest Suite ===")
pytest_args = ["tests/test_sandbox.py", "tests/test_e2e.py", "-v"]
pytest_exit_code = pytest.main(pytest_args)
print(f"Pytest Exit Code: {pytest_exit_code}")

# 2. SQLite integrity check
print("=== SQLite Integrity Check ===")
db_path = PROJECT_ROOT / "database" / "skillforge.db"
if db_path.exists():
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("PRAGMA integrity_check;")
    integrity = cursor.fetchone()[0]
    print(f"Integrity check result: {integrity}")
    cursor.execute("PRAGMA journal_mode;")
    journal = cursor.fetchone()[0]
    print(f"Journal mode: {journal}")
    conn.close()
else:
    print(f"DB File not found at {db_path}")

# 3. Frontend Build check
print("=== Frontend Build Check ===")
frontend_dir = PROJECT_ROOT / "frontend"
if (frontend_dir / "package.json").exists():
    npm_path = shutil.which("npm") or "npm"
    res = subprocess.run([npm_path, "run", "build"], cwd=str(frontend_dir), capture_output=True, text=True, shell=True)
    print(f"NPM Build Exit Code: {res.returncode}")
    print("NPM Build stdout:", res.stdout[-500:] if res.stdout else "")
    print("NPM Build stderr:", res.stderr[-500:] if res.stderr else "")
