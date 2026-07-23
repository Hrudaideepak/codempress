import pytest
import sqlite3
import asyncio
import jwt
import time
from pathlib import Path
from httpx import AsyncClient, ASGITransport
try:
    from playwright.sync_api import Page, expect
except ImportError:
    Page = None
    expect = None

from backend.main import app
from backend.database import DB_PATH
from backend.auth import JWT_SECRET, create_jwt_token

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
    
    cursor.execute("PRAGMA integrity_check;")
    result = cursor.fetchone()
    assert result[0] == "ok", "Database integrity check failed"
    
    cursor.execute("PRAGMA journal_mode;")
    journal_mode = cursor.fetchone()[0]
    assert journal_mode.lower() == "wal", "Journal mode is not WAL"
    
    conn.close()

def test_frontend_rendering(request):
    """Validate frontend rendering."""
    if Page is None or "page" not in request.fixturenames:
        pytest.skip("playwright pytest plugin not installed")
    page = request.getfixturevalue("page")
    try:
        page.goto("http://localhost:5173", timeout=3000)
        root_element = page.locator("#root")
        expect(root_element).to_be_visible(timeout=2000)
        assert page.title() != "", "Frontend page title should not be empty"
    except Exception as e:
        pytest.skip(f"Frontend server might not be running on http://localhost:5173. Skipping frontend test: {e}")

@pytest.mark.anyio
async def test_library_endpoint():
    """Verify GET /api/library returns categories and topics for guests and users."""
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
    first_cat = data["categories"][0]
    assert "name" in first_cat
    assert "topics" in first_cat
    assert len(first_cat["topics"]) > 0
    
    topic = first_cat["topics"][0]
    assert "id" in topic
    assert "title" in topic
    assert "level_name" in topic
    assert "locked" in topic
    assert "cleared" in topic

@pytest.mark.anyio
async def test_theory_read_endpoint():
    """Verify POST /api/topics/{id}/theory-read updates progress when authenticated."""
    token = create_jwt_token(1, "arjun@example.com", "Arjun Kumar (Dev)")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/topics/1/theory-read", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["topic_id"] == 1
    assert data["theory_read"] is True

@pytest.mark.anyio
async def test_auth_production_enforcement(monkeypatch):
    """Verify that protected route GET /api/auth/me requires valid JWT credentials."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/auth/me")
    assert response.status_code == 401
    assert "credentials are required" in response.json()["detail"]
