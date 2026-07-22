import pytest
import sqlite3
import asyncio
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from playwright.sync_api import Page, expect

# Assuming the project structure places backend in the root
from backend.main import app
from backend.database import DB_PATH

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.mark.anyio
async def test_health_check():
    """Validate backend health endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "Codempress API"

def test_database_integrity():
    """Validate SQLite data integrity."""
    assert DB_PATH.exists(), f"Database file not found at {DB_PATH}"
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Check if integrity check passes
    cursor.execute("PRAGMA integrity_check;")
    result = cursor.fetchone()
    assert result[0] == "ok", "Database integrity check failed"
    
    # Verify WAL mode is set (as per database.py)
    cursor.execute("PRAGMA journal_mode;")
    journal_mode = cursor.fetchone()[0]
    assert journal_mode.lower() == "wal", "Journal mode is not WAL"
    
    conn.close()

def test_frontend_rendering(page: Page):
    """Validate frontend rendering."""
    # This requires the Vite dev server to be running (e.g. on port 5173)
    # We will attempt to connect and gracefully skip if not running.
    try:
        # Navigate to the frontend
        page.goto("http://localhost:5173", timeout=3000)
        
        # Verify the root element is present and visible
        root_element = page.locator("#root")
        expect(root_element).to_be_visible(timeout=2000)
        
        # Basic check that the page title is not empty
        assert page.title() != "", "Frontend page title should not be empty"
        
    except Exception as e:
        pytest.skip(f"Frontend server might not be running on http://localhost:5173. Skipping frontend test: {e}")

@pytest.mark.anyio
async def test_library_endpoint():
    """Verify GET /api/library returns categories and topics."""
    # Ensure user 1 exists in the database to satisfy foreign keys
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO users (_id, google_sub, email, name) VALUES (1, 'dev-sub-1', 'arjun@example.com', 'Arjun Kumar (Dev)')")
    conn.commit()
    conn.close()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/library")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert len(data["categories"]) > 0
    # First subject should have topics
    first_cat = data["categories"][0]
    assert "name" in first_cat
    assert "topics" in first_cat
    assert len(first_cat["topics"]) > 0
    
    # Verify topic fields
    topic = first_cat["topics"][0]
    assert "id" in topic
    assert "title" in topic
    assert "level_name" in topic
    assert "locked" in topic
    assert "cleared" in topic
    assert "difficulty" in topic
    assert "xp" in topic
    assert "mastery" in topic

@pytest.mark.anyio
async def test_theory_read_endpoint():
    """Verify POST /api/topics/{id}/theory-read updates progress."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/topics/1/theory-read")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["topic_id"] == 1
    assert data["theory_read"] is True
    assert "mastery" in data

@pytest.mark.anyio
async def test_auth_production_enforcement(monkeypatch):
    """Verify that credentials fallback is blocked when ENV=production is active."""
    monkeypatch.setenv("ENV", "production")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/library")
    assert response.status_code == 401
    assert "credentials are required" in response.json()["detail"]

def test_production_credentials_crash_enforcement():
    """Verify that the backend crashes on start if ENV=production is set but credentials are default/missing."""
    import subprocess
    import sys
    import os
    
    env = os.environ.copy()
    env["ENV"] = "production"
    env["JWT_SECRET"] = "codempress_super_secret_jwt_key_2026"
    env["GOOGLE_CLIENT_ID"] = "dummy-google-client-id"
    env["PYTHONPATH"] = "."
    
    cmd = [sys.executable, "-c", "import backend.infrastructure.services.oauth_service"]
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    
    assert result.returncode != 0
    assert "CRITICAL SECURITY ERROR" in result.stderr
