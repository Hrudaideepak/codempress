import pytest
import sqlite3
import asyncio
import json
import shutil
from pathlib import Path
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.database import DB_PATH
from backend.auth import create_jwt_token
from backend.app.domain.sandbox_engine import execute_code, stream_code_execution
from backend.app.domain.error_parser import parse_and_sanitize_error
from backend.app.domain.assertion_harness import evaluate_solution

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

# -------------------------------------------------------------------------
# 1. Unit Tests for Sandbox Engine & Error Parser
# -------------------------------------------------------------------------

@pytest.mark.anyio
async def test_python_execution_success():
    code = "print('Hello from Codempress Sandbox')"
    res = await execute_code("python", code)
    assert res["status"] == "success"
    assert res["exit_code"] == 0
    assert "Hello from Codempress Sandbox" in res["stdout"]
    assert res["execution_time_ms"] < 1500.0
    assert res["timed_out"] is False

@pytest.mark.anyio
async def test_python_execution_error():
    code = "x = 1 / 0"
    res = await execute_code("python", code)
    assert res["status"] == "error"
    assert res["exit_code"] != 0
    assert "ZeroDivisionError" in res["stderr"]
    assert res["error_type"] == "ZeroDivisionError"

@pytest.mark.anyio
async def test_python_execution_timeout():
    code = "import time; time.sleep(3.0)"
    res = await execute_code("python", code, timeout=1.0)
    assert res["status"] == "timeout"
    assert res["timed_out"] is True
    assert res["exit_code"] == -1
    assert "timed out" in res["stderr"].lower()

@pytest.mark.anyio
async def test_js_execution_success():
    if not shutil.which("node"):
        pytest.skip("Node.js binary not installed on host environment")
    code = "console.log('JS Sandbox Test');"
    res = await execute_code("javascript", code)
    assert res["status"] == "success"
    assert res["exit_code"] == 0
    assert "JS Sandbox Test" in res["stdout"]

def test_error_parser_python():
    raw_tb = """Traceback (most recent call last):
  File "C:\\Users\\admin\\secret\\tmp_1234.py", line 15, in <module>
    res = process_data(val)
  File "C:\\Users\\admin\\secret\\tmp_1234.py", line 8, in process_data
    return 10 / 0
ZeroDivisionError: division by zero"""
    
    parsed = parse_and_sanitize_error(raw_tb, "python")
    assert parsed["error_type"] == "ZeroDivisionError"
    assert parsed["line_number"] == 8
    assert "C:\\Users\\admin\\secret" not in parsed["sanitized_traceback"]
    assert '<student_code>' in parsed["sanitized_traceback"]

def test_error_parser_js():
    raw_tb = """ReferenceError: foo is not defined
    at Object.<anonymous> (C:\\Users\\admin\\test.js:4:5)
    at Module._compile (node:internal/modules/cjs/loader:1376:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)"""

    parsed = parse_and_sanitize_error(raw_tb, "javascript")
    assert parsed["error_type"] == "ReferenceError"
    assert parsed["line_number"] == 4
    assert "node:internal" not in parsed["sanitized_traceback"]
    assert "C:\\Users\\admin" not in parsed["sanitized_traceback"]

# -------------------------------------------------------------------------
# 2. Integration Tests for API Router Endpoints
# -------------------------------------------------------------------------

@pytest.mark.anyio
async def test_api_sandbox_execute_json():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/sandbox/execute", json={
            "language": "python",
            "code": "a = 5\nb = 10\nprint(f'Sum: {a + b}')"
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "Sum: 15" in data["stdout"]
    assert data["execution_time_ms"] < 1500.0

@pytest.mark.anyio
async def test_api_sandbox_execute_stream():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/sandbox/execute", json={
            "language": "python",
            "code": "print('Stream Line 1')\nprint('Stream Line 2')",
            "stream": True
        })
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]
    body_text = resp.text
    assert "Stream Line 1" in body_text
    assert "status" in body_text

@pytest.mark.anyio
async def test_api_sandbox_evaluate_pass_and_xp():
    token = create_jwt_token(1, "explorer@codempress.app", "Explorer")
    headers = {"Authorization": f"Bearer {token}"}
    
    test_cases = [
        {"id": 1, "input": "2\n3", "expected_output": "5"},
        {"id": 2, "input": "10\n20", "expected_output": "30"}
    ]
    code = "import sys\nlines = sys.stdin.read().split()\nif lines:\n    print(int(lines[0]) + int(lines[1]))"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/sandbox/evaluate", json={
            "topic_id": 1,
            "language": "python",
            "code": code,
            "test_cases": test_cases
        }, headers=headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data["all_passed"] is True
    assert data["passed_count"] == 2
    assert data["total_count"] == 2
    assert data["score_percent"] == 100
    assert data["xp_earned"] > 0
    assert len(data["test_results"]) == 2

@pytest.mark.anyio
async def test_api_sandbox_evaluate_fail_and_traceback():
    test_cases = [
        {"id": 1, "input": "", "expected_output": "42"}
    ]
    code = "raise ValueError('Custom Test Failure')"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/sandbox/evaluate", json={
            "topic_id": 1,
            "language": "python",
            "code": code,
            "test_cases": test_cases
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["all_passed"] is False
    assert data["error_context"] is not None
    assert data["error_context"]["error_type"] == "ValueError"

@pytest.mark.anyio
async def test_api_ai_hints_with_error_traceback():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/ai/hints", json={
            "topic_id": 1,
            "exercise_title": "Variables & Arithmetic",
            "code_snippet": "val = 10 / 0",
            "error_traceback": "File '<student_code>', line 1\nZeroDivisionError: division by zero"
        })

    assert resp.status_code == 200
    data = resp.json()
    assert "hints" in data
    assert len(data["hints"]) == 4
    levels = [h["level"] for h in data["hints"]]
    assert levels == [1, 2, 3, 4]
    # Check that error context appears in guidance hint
    guidance = data["hints"][1]
    assert "ZeroDivisionError" in guidance["hint"] or "ZeroDivisionError" in guidance["content"]
