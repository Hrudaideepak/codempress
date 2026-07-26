"""
Automated Test Assertion & Gamified XP Payout Harness
------------------------------------------------------
Runs student solution code against predefined test cases (IO matching or assertion functions).
Evaluates correctness, computes execution latency and diffs, and executes atomic SQLite DB
transactions to update users.xp, user_progress.mastery_percent, and quiz_attempts logs.
"""

import time
import logging
from typing import Dict, Any, List, Optional

from backend.app.domain.sandbox_engine import execute_code
from backend.app.domain.error_parser import parse_and_sanitize_error
from backend.database import execute_query, execute_batch_write, ensure_user_exists

logger = logging.getLogger("codempress.assertion_harness")

async def evaluate_solution(
    language: str,
    code: str,
    test_cases: List[Dict[str, Any]],
    user_id: int = 1,
    topic_id: int = 1
) -> Dict[str, Any]:
    """
    Evaluates student code against test cases.
    Performs atomic SQLite DB transaction if XP is earned.
    """
    await ensure_user_exists(user_id)

    if not test_cases:
        # Default test case: verify code executes cleanly without runtime error
        test_cases = [{
            "id": 1,
            "input": "",
            "expected_output": "",
            "assertion_code": None,
            "is_hidden": False
        }]

    test_results = []
    passed_count = 0
    total_count = len(test_cases)
    first_error_traceback = None
    first_error_context = None

    norm_lang = (language or "python").lower()

    for idx, tc in enumerate(test_cases, start=1):
        tc_id = tc.get("id") or tc.get("test_case_id") or idx
        tc_input = str(tc.get("input") or "")
        expected_output = str(tc.get("expected_output") or tc.get("expected") or "").strip()
        assertion_code = tc.get("assertion_code")
        is_hidden = bool(tc.get("is_hidden") or tc.get("hidden") or False)

        start_time = time.perf_counter()

        if assertion_code and assertion_code.strip():
            # Build wrapper with assertion code
            if norm_lang in ("python", "py"):
                wrapped_code = (
                    f"{code}\n\n"
                    f"import sys\n"
                    f"if __name__ == '__main__':\n"
                    f"    try:\n"
                    f"        {assertion_code.strip()}\n"
                    f"        print('__ASSERTION_PASSED__')\n"
                    f"    except AssertionError as _ae:\n"
                    f"        print(f'__ASSERTION_FAILED__: {{_ae}}', file=sys.stderr)\n"
                    f"        sys.exit(1)\n"
                    f"    except Exception as _exc:\n"
                    f"        print(f'__ASSERTION_ERROR__: {{_exc}}', file=sys.stderr)\n"
                    f"        sys.exit(1)\n"
                )
            else:  # JavaScript
                wrapped_code = (
                    f"{code}\n\n"
                    f"try {{\n"
                    f"    {assertion_code.strip()};\n"
                    f"    console.log('__ASSERTION_PASSED__');\n"
                    f"}} catch (err) {{\n"
                    f"    console.error('__ASSERTION_FAILED__: ' + err.message);\n"
                    f"    process.exit(1);\n"
                    f"}}\n"
                )
            res = await execute_code(norm_lang, wrapped_code, stdin_input=tc_input)
            actual_output = res["stdout"].replace("__ASSERTION_PASSED__", "").strip()
            passed = (res["exit_code"] == 0) and ("__ASSERTION_PASSED__" in res["stdout"])
        else:
            # IO matching mode
            res = await execute_code(norm_lang, code, stdin_input=tc_input)
            actual_output = res["stdout"].strip()
            # If expected_output is empty, clean execution is considered pass
            if expected_output:
                passed = (res["exit_code"] == 0) and (actual_output == expected_output)
            else:
                passed = (res["exit_code"] == 0)

        exec_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        if passed:
            passed_count += 1
        elif not first_error_traceback and res.get("stderr"):
            err_parsed = parse_and_sanitize_error(res["stderr"], norm_lang)
            first_error_traceback = err_parsed["sanitized_traceback"]
            first_error_context = {
                "sanitized_traceback": err_parsed["sanitized_traceback"],
                "error_type": err_parsed["error_type"] or "AssertionError",
                "line_number": err_parsed["line_number"],
                "message": err_parsed["message"] or f"Expected '{expected_output}', got '{actual_output}'"
            }

        test_results.append({
            "id": tc_id,
            "test_case_id": tc_id,
            "passed": passed,
            "input": "<hidden>" if is_hidden else tc_input,
            "expected": "<hidden>" if is_hidden else expected_output,
            "actual": "<hidden>" if is_hidden else actual_output,
            "expected_output": "<hidden>" if is_hidden else expected_output,
            "actual_output": "<hidden>" if is_hidden else actual_output,
            "stderr": res.get("stderr", ""),
            "execution_time_ms": exec_time_ms,
            "hidden": is_hidden
        })

    all_passed = (passed_count == total_count) and (total_count > 0)
    score_percent = int((passed_count / total_count) * 100) if total_count > 0 else 0

    # XP Calculation: 25 XP per test passed + 50 XP bonus for completing all test cases
    base_xp = passed_count * 25
    completion_bonus = 50 if all_passed else 0
    xp_earned = base_xp + completion_bonus

    total_xp = 0
    try:
        # Atomic SQLite DB transaction for progress & XP updates
        batch_queries = []
        if xp_earned > 0:
            batch_queries.append((
                """
                UPDATE users
                SET xp = xp + ?,
                    streak_count = CASE WHEN last_active_date IS NULL OR date(last_active_date) < date('now') THEN streak_count + 1 ELSE streak_count END,
                    last_active_date = CURRENT_TIMESTAMP
                WHERE _id = ?;
                """,
                (xp_earned, user_id)
            ))

        if topic_id and topic_id > 0:
            mastery_val = 100 if all_passed else min(70, score_percent)
            batch_queries.append((
                """
                INSERT INTO user_progress (user_id, topic_id, mastery_percent, last_studied)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, topic_id) DO UPDATE SET
                    mastery_percent = MAX(mastery_percent, excluded.mastery_percent),
                    last_studied = CURRENT_TIMESTAMP;
                """,
                (user_id, topic_id, mastery_val)
            ))

        batch_queries.append((
            """
            INSERT INTO quiz_attempts (user_id, topic_id, score_percent, xp_earned, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
            """,
            (user_id, topic_id or 1, score_percent, xp_earned)
        ))

        if batch_queries:
            await execute_batch_write(batch_queries)

        user_rows = await execute_query("SELECT xp FROM users WHERE _id = ?", (user_id,))
        if user_rows:
            total_xp = user_rows[0]["xp"]

    except Exception as exc:
        logger.error(f"Error persisting evaluation XP transaction: {exc}")
        # Fetch current XP fallback
        user_rows = await execute_query("SELECT xp FROM users WHERE _id = ?", (user_id,))
        if user_rows:
            total_xp = user_rows[0]["xp"]

    return {
        "all_passed": all_passed,
        "passed_count": passed_count,
        "total_count": total_count,
        "score_percent": score_percent,
        "xp_earned": xp_earned,
        "total_xp": total_xp,
        "test_results": test_results,
        "results": test_results,  # Alias for frontend compatibility
        "error_context": first_error_context,
        "error_traceback": first_error_traceback
    }
