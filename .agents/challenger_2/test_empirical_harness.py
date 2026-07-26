import pytest
import sqlite3
import asyncio
import shutil
import os
from pathlib import Path
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.database import DB_PATH, execute_query, execute_write, execute_batch_write
from backend.app.domain.assertion_harness import evaluate_solution
from backend.app.domain.sandbox_engine import execute_code
from backend.app.domain.content_pipeline import generate_progressive_hints

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

# =========================================================================
# 1. TEST CASE EVALUATION BOUNDARY CONDITIONS
# =========================================================================

@pytest.mark.anyio
async def test_boundary_empty_test_cases():
    """Verify evaluation behavior when test_cases list is empty."""
    res = await evaluate_solution("python", "print('hello')", [], user_id=1, topic_id=1)
    assert res["total_count"] == 1
    assert res["passed_count"] == 1
    assert res["all_passed"] is True
    # Default test case awarded N*25 + 50 = 75 XP
    assert res["xp_earned"] == 75

@pytest.mark.anyio
async def test_boundary_empty_test_cases_failing_code():
    """Verify evaluation when test_cases is empty but student code crashes."""
    res = await evaluate_solution("python", "x = 1 / 0", [], user_id=1, topic_id=1)
    assert res["total_count"] == 1
    assert res["passed_count"] == 0
    assert res["all_passed"] is False
    assert res["xp_earned"] == 0
    assert res["error_context"] is not None

@pytest.mark.anyio
async def test_boundary_all_passing():
    """Verify N passing test cases award 25*N + 50 XP and mastery 100."""
    test_cases = [
        {"id": 1, "input": "1\n2", "expected_output": "3"},
        {"id": 2, "input": "5\n5", "expected_output": "10"}
    ]
    code = "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)"
    res = await evaluate_solution("python", code, test_cases, user_id=1, topic_id=1)
    assert res["all_passed"] is True
    assert res["passed_count"] == 2
    assert res["total_count"] == 2
    assert res["score_percent"] == 100
    assert res["xp_earned"] == 2 * 25 + 50  # 100 XP

@pytest.mark.anyio
async def test_boundary_partial_failing():
    """Verify partial passing test cases award 25*passed XP and mastery min(70, score)."""
    test_cases = [
        {"id": 1, "input": "1\n2", "expected_output": "3"},
        {"id": 2, "input": "5\n5", "expected_output": "999"}
    ]
    code = "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)"
    res = await evaluate_solution("python", code, test_cases, user_id=1, topic_id=1)
    assert res["all_passed"] is False
    assert res["passed_count"] == 1
    assert res["total_count"] == 2
    assert res["score_percent"] == 50
    assert res["xp_earned"] == 25  # 1 * 25 + 0

@pytest.mark.anyio
async def test_boundary_all_failing():
    """Verify 0 passing test cases award 0 XP."""
    test_cases = [
        {"id": 1, "input": "1\n2", "expected_output": "999"},
        {"id": 2, "input": "5\n5", "expected_output": "888"}
    ]
    code = "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)"
    res = await evaluate_solution("python", code, test_cases, user_id=1, topic_id=1)
    assert res["all_passed"] is False
    assert res["passed_count"] == 0
    assert res["score_percent"] == 0
    assert res["xp_earned"] == 0


# =========================================================================
# 2. MALICIOUS USER CODE ATTEMPTING TO CHEAT ASSERTIONS
# =========================================================================

@pytest.mark.anyio
async def test_cheat_print_passed_and_exit_early():
    """MALICIOUS: Code prints __ASSERTION_PASSED__ and calls sys.exit(0)."""
    test_cases = [
        {"id": 1, "input": "", "expected_output": "42", "assertion_code": "assert add(2, 3) == 5"}
    ]
    # Code defines wrong add function or no add, but prints marker and exits 0
    code = (
        "import sys\n"
        "print('__ASSERTION_PASSED__')\n"
        "sys.exit(0)\n"
    )
    res = await evaluate_solution("python", code, test_cases, user_id=1, topic_id=1)
    # MUST NOT PASS!
    assert res["all_passed"] is False, "VULNERABILITY DETECTED: Code bypassed assertion using sys.exit(0) + __ASSERTION_PASSED__"

@pytest.mark.anyio
async def test_cheat_override_sys_exit():
    """MALICIOUS: Code overrides sys.exit to prevent assertion failure from stopping process."""
    test_cases = [
        {"id": 1, "input": "", "expected_output": "42", "assertion_code": "assert 1 == 2"}
    ]
    code = (
        "import sys\n"
        "sys.exit = lambda code=0: None\n"
        "print('__ASSERTION_PASSED__')\n"
    )
    res = await evaluate_solution("python", code, test_cases, user_id=1, topic_id=1)
    assert res["all_passed"] is False, "VULNERABILITY DETECTED: Code bypassed assertion by overriding sys.exit"

@pytest.mark.anyio
async def test_cheat_js_print_passed_and_exit_early():
    """MALICIOUS JS: Code prints __ASSERTION_PASSED__ and calls process.exit(0)."""
    if not shutil.which("node"):
        pytest.skip("Node.js binary not installed")
    test_cases = [
        {"id": 1, "input": "", "expected_output": "42", "assertion_code": "if (add(2,3) !== 5) throw new Error('Failed');"}
    ]
    code = (
        "console.log('__ASSERTION_PASSED__');\n"
        "process.exit(0);\n"
    )
    res = await evaluate_solution("javascript", code, test_cases, user_id=1, topic_id=1)
    assert res["all_passed"] is False, "VULNERABILITY DETECTED: JS code bypassed assertion using process.exit(0)"

@pytest.mark.anyio
async def test_cheat_hidden_test_case_stderr_leak():
    """MALICIOUS: Student leaks hidden input via stderr."""
    test_cases = [
        {"id": 1, "input": "SECRET_INPUT_123", "expected_output": "SECRET_INPUT_123", "is_hidden": True}
    ]
    code = "import sys\nval = sys.stdin.read().strip()\nprint('wrong_output')\nprint(f'LEAK:{val}', file=sys.stderr)"
    res = await evaluate_solution("python", code, test_cases, user_id=1, topic_id=1)
    
    # Check if hidden input leaks through stderr in results
    result_stderr = res["test_results"][0]["stderr"]
    assert "SECRET_INPUT_123" not in result_stderr, "VULNERABILITY DETECTED: Hidden test case input leaked in stderr"


# =========================================================================
# 3. DATABASE ATOMIC TRANSACTION CONSISTENCY
# =========================================================================

@pytest.mark.anyio
async def test_db_batch_write_atomicity():
    """Verify batch write rolls back completely if one query in batch fails."""
    # Read initial XP of user 1
    user_rows = await execute_query("SELECT xp FROM users WHERE _id = 1")
    initial_xp = user_rows[0]["xp"] if user_rows else 0

    queries_and_params = [
        ("UPDATE users SET xp = xp + 100 WHERE _id = 1;", ()),
        ("INSERT INTO non_existent_table_xyz (col) VALUES (1);", ())  # Invalid table -> fails
    ]

    with pytest.raises(Exception):
        await execute_batch_write(queries_and_params)

    # Verify XP was NOT incremented due to rollback
    user_rows_after = await execute_query("SELECT xp FROM users WHERE _id = 1")
    final_xp = user_rows_after[0]["xp"] if user_rows_after else 0
    assert final_xp == initial_xp, "TRANSACTION ATOMICITY FAILURE: Partial update persisted despite batch error!"


# =========================================================================
# 4. SOCRATIC AI PROGRESSIVE HINT GENERATION STRUCTURE
# =========================================================================

def test_progressive_hints_structure():
    """Verify 4-level progressive hints structure, costs, and titles."""
    hints = generate_progressive_hints("Variables", "Add Numbers")
    assert len(hints) == 4
    
    levels = [h["level"] for h in hints]
    costs = [h["xp_cost"] for h in hints]
    types = [h["type"] for h in hints]

    assert levels == [1, 2, 3, 4]
    assert costs == [0, 5, 10, 15]
    assert types == ["nudge", "guidance", "code_pattern", "solution"]

def test_progressive_hints_error_adaptation():
    """Verify runtime traceback dynamically updates hint guidance & pattern."""
    tb = "File '<student_code>', line 5\nZeroDivisionError: division by zero"
    hints = generate_progressive_hints("Math", "Divide", error_traceback=tb)
    
    level2 = hints[1]
    level3 = hints[2]

    assert "ZeroDivisionError" in level2["hint"] or "ZeroDivisionError" in level2["content"]
    assert "line 5" in level2["hint"] or "line 5" in level2["content"]
    assert "divisor != 0" in level3["code_snippet"]
