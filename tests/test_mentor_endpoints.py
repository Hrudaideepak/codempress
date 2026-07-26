import pytest
import sqlite3
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.database import DB_PATH
from backend.auth import create_jwt_token

@pytest.fixture(scope="module", autouse=True)
def setup_test_user():
    """Ensure test user exists in DB."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO users (_id, google_sub, email, name) VALUES (1, 'dev-sub-1', 'arjun@example.com', 'Arjun Kumar (Dev)')")
    conn.commit()
    conn.close()

@pytest.mark.anyio
async def test_cover_letter_unauthenticated():
    """Verify POST /api/mentor/cover-letter returns 401 when unauthenticated."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/cover-letter", json={"job_title": "Backend Engineer", "company": "Acme Inc", "job_description": "Build FastAPI APIs"})
    assert res.status_code == 401

@pytest.mark.anyio
async def test_cover_letter_authenticated():
    """Verify POST /api/mentor/cover-letter generates cover letter for authenticated user."""
    token = create_jwt_token(1, "arjun@example.com", "Arjun Kumar")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "job_title": "Senior Backend Engineer",
        "company": "Acme Tech",
        "job_description": "We are seeking a Senior Backend Engineer proficient in Python, FastAPI, and PostgreSQL."
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/cover-letter", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "cover_letter" in data
    assert len(data["cover_letter"]) > 50
    assert "Acme Tech" in data["cover_letter"] or "Senior Backend Engineer" in data["cover_letter"]

@pytest.mark.anyio
async def test_interview_generate_unauthenticated():
    """Verify POST /api/mentor/interview/generate returns 401 when unauthenticated."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/interview/generate", json={"role": "Backend Engineer", "difficulty": "Senior"})
    assert res.status_code == 401

@pytest.mark.anyio
async def test_interview_generate_authenticated():
    """Verify POST /api/mentor/interview/generate returns 5 questions tailored to the role."""
    token = create_jwt_token(1, "arjun@example.com", "Arjun Kumar")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "role": "Full Stack Engineer",
        "difficulty": "Senior"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/interview/generate", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "questions" in data
    assert len(data["questions"]) >= 5

@pytest.mark.anyio
async def test_interview_evaluate_unauthenticated():
    """Verify POST /api/mentor/interview/evaluate returns 401 when unauthenticated."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/interview/evaluate", json={"question": "Explain async", "user_answer": "Async avoids blocking.", "role": "Backend Developer"})
    assert res.status_code == 401

@pytest.mark.anyio
async def test_interview_evaluate_authenticated():
    """Verify POST /api/mentor/interview/evaluate evaluates answer and returns score, feedback, and improved model answer."""
    token = create_jwt_token(1, "arjun@example.com", "Arjun Kumar")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "question": "How do you handle database migration rollbacks in production?",
        "user_answer": "I use Alembic migrations with explicit down_revision steps and test rollbacks in staging environments before deploying to production.",
        "role": "Senior Backend Engineer"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/interview/evaluate", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "score" in data
    assert "feedback" in data
    assert "improved_answer" in data
    assert isinstance(data["score"], int)
    assert 0 <= data["score"] <= 100
    assert len(data["feedback"]) > 10
    assert len(data["improved_answer"]) > 10


@pytest.mark.anyio
async def test_roadmap_generate_authenticated():
    """Verify POST /api/mentor/roadmap/generate creates a 5-step career roadmap."""
    token = create_jwt_token(1, "arjun@example.com", "Arjun Kumar (Dev)")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"target_role": "AI Agent Architect"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/mentor/roadmap/generate", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "target_role" in data
    assert "steps" in data
    assert len(data["steps"]) == 5
    assert data["steps"][0]["id"] == 1

