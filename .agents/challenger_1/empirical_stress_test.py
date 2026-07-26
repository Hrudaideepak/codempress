import sys
import os
import time
import asyncio
import unittest
from unittest.mock import patch

# Ensure app root is on sys.path
sys.path.insert(0, r"C:\Users\durga\OneDrive\Desktop\app")

from backend.app.domain.sandbox_engine import execute_code, stream_code_execution, MAX_OUTPUT_BYTES
from backend.app.domain.error_parser import parse_and_sanitize_error
from backend.app.domain.assertion_harness import evaluate_solution

async def run_all_tests():
    print("=" * 70)
    print("EMPIRICAL STRESS TESTS — CODE SANDBOX & ASSERTION ENGINE")
    print("=" * 70)

    results = []

    # ---------------------------------------------------------------------
    # Test 1A: Python Infinite Loop Attack
    # ---------------------------------------------------------------------
    print("\n[Test 1A] Python Infinite Loop Attack (`while True: pass`)")
    start = time.perf_counter()
    res = await execute_code("python", "while True:\n    pass", timeout=1.5)
    elapsed = time.perf_counter() - start
    
    t1a_pass = (
        res["timed_out"] is True and
        res["exit_code"] == -1 and
        res["status"] == "timeout" and
        1.4 <= elapsed <= 1.7
    )
    print(f"  Elapsed wall-clock time: {elapsed:.3f}s (SLA <= 1.5s (+0.2s margin))")
    print(f"  Status: {res['status']}, Timed out: {res['timed_out']}, Exit code: {res['exit_code']}")
    print(f"  Stderr: {res['stderr']}")
    print(f"  Result: {'PASS' if t1a_pass else 'FAIL'}")
    results.append(("1A: Python Infinite Loop", t1a_pass, f"Elapsed: {elapsed:.3f}s"))

    # ---------------------------------------------------------------------
    # Test 1B: JS Infinite Loop Attack
    # ---------------------------------------------------------------------
    print("\n[Test 1B] JS Infinite Loop Attack (`while(true){}`)")
    start = time.perf_counter()
    res = await execute_code("javascript", "while(true){}", timeout=1.5)
    elapsed = time.perf_counter() - start
    
    t1b_pass = (
        res["timed_out"] is True and
        res["exit_code"] == -1 and
        res["status"] == "timeout" and
        1.4 <= elapsed <= 1.7
    )
    print(f"  Elapsed wall-clock time: {elapsed:.3f}s")
    print(f"  Status: {res['status']}, Timed out: {res['timed_out']}, Exit code: {res['exit_code']}")
    print(f"  Stderr: {res['stderr']}")
    print(f"  Result: {'PASS' if t1b_pass else 'FAIL'}")
    results.append(("1B: JS Infinite Loop", t1b_pass, f"Elapsed: {elapsed:.3f}s"))

    # ---------------------------------------------------------------------
    # Test 2A: Output Flooding Attack (Python 1MB String)
    # ---------------------------------------------------------------------
    print("\n[Test 2A] Output Flooding Attack (Python 1,000,000 chars)")
    flood_code = "print('x' * 1000000)"
    start = time.perf_counter()
    res = await execute_code("python", flood_code)
    elapsed = time.perf_counter() - start
    
    out_len = len(res["stdout"].encode("utf-8"))
    t2a_pass = (
        res["status"] == "success" and
        out_len <= (64 * 1024 + 100) and  # 64KB + notice header
        "[Output truncated at 64KB limit]" in res["stdout"]
    )
    print(f"  Execution time: {elapsed:.3f}s")
    print(f"  Stdout byte length: {out_len} bytes (cap is 65536 bytes + truncation text)")
    print(f"  Contains truncation warning: {'[Output truncated at 64KB limit]' in res['stdout']}")
    print(f"  Result: {'PASS' if t2a_pass else 'FAIL'}")
    results.append(("2A: Python Output Flooding (1MB)", t2a_pass, f"Size: {out_len} bytes"))

    # ---------------------------------------------------------------------
    # Test 2B: Output Flooding Attack (JS 1MB String)
    # ---------------------------------------------------------------------
    print("\n[Test 2B] Output Flooding Attack (JS 1,000,000 chars)")
    flood_code_js = "console.log('x'.repeat(1000000));"
    start = time.perf_counter()
    res = await execute_code("javascript", flood_code_js)
    elapsed = time.perf_counter() - start
    
    out_len_js = len(res["stdout"].encode("utf-8"))
    t2b_pass = (
        res["status"] == "success" and
        out_len_js <= (64 * 1024 + 100) and
        "[Output truncated at 64KB limit]" in res["stdout"]
    )
    print(f"  Execution time: {elapsed:.3f}s")
    print(f"  Stdout byte length: {out_len_js} bytes")
    print(f"  Contains truncation warning: {'[Output truncated at 64KB limit]' in res['stdout']}")
    print(f"  Result: {'PASS' if t2b_pass else 'FAIL'}")
    results.append(("2B: JS Output Flooding (1MB)", t2b_pass, f"Size: {out_len_js} bytes"))

    # ---------------------------------------------------------------------
    # Test 3: Traceback Path Sanitization & Runtime Error Stress
    # ---------------------------------------------------------------------
    print("\n[Test 3] Syntax & Runtime Error Sanitization")
    test_errors = [
        ("DivisionByZero", "x = 1 / 0", "python"),
        ("SyntaxError", "def foo(:", "python"),
        ("ImportError", "import module_that_does_not_exist_999", "python"),
        ("NestedExceptions", "try:\n    1/0\nexcept Exception as e:\n    raise RuntimeError('Nested failure') from e", "python"),
        ("JS ReferenceError", "nonExistentFunction();", "javascript"),
        ("JS SyntaxError", "function foo( {", "javascript")
    ]

    t3_all_pass = True
    for name, code, lang in test_errors:
        res = await execute_code(lang, code)
        tb = res.get("sanitized_traceback") or res.get("stderr") or ""
        
        # Check that no host paths remain in traceback
        has_windows_path = "C:\\" in tb or "c:\\" in tb or "Users\\" in tb
        has_unix_path = "/home/" in tb or "/tmp/" in tb
        has_clean_ref = ("<student_code>" in tb) or ("SyntaxError" in tb) or ("ReferenceError" in tb) or ("EnvironmentError" in tb)
        
        passed = not has_windows_path and not has_unix_path and has_clean_ref
        if not passed:
            t3_all_pass = False
        
        print(f"  Subtest {name} ({lang}):")
        print(f"    Error type: {res.get('error_type')}")
        print(f"    Sanitized Traceback snippet: {tb[:120].replace(os.linesep, ' ')}...")
        print(f"    No host paths leaked: {not has_windows_path and not has_unix_path}")
        print(f"    Subtest result: {'PASS' if passed else 'FAIL'}")

    results.append(("3: Syntax & Runtime Error Sanitization", t3_all_pass, "All tracebacks sanitized cleanly"))

    # ---------------------------------------------------------------------
    # Test 4: Missing Node Binary Graceful Handling
    # ---------------------------------------------------------------------
    print("\n[Test 4] Missing Binary Handling (Node.js absent)")
    with patch("shutil.which", return_value=None):
        res = await execute_code("javascript", "console.log('hello');")
        t4_pass = (
            res["status"] == "error" and
            res["exit_code"] == 1 and
            res["error_type"] == "EnvironmentError" and
            "Node.js runtime is not available" in res["stderr"]
        )
        print(f"  Status: {res['status']}, Exit code: {res['exit_code']}, Error type: {res['error_type']}")
        print(f"  Stderr: {res['stderr']}")
        print(f"  Result: {'PASS' if t4_pass else 'FAIL'}")
        results.append(("4: Missing Node Binary", t4_pass, res['stderr']))

    # ---------------------------------------------------------------------
    # SUMMARY REPORT
    # ---------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("STRESS TEST SUMMARY")
    print("=" * 70)
    all_ok = True
    for title, passed, detail in results:
        status_str = "PASS" if passed else "FAIL"
        if not passed:
            all_ok = False
        print(f"  [{status_str}] {title} — {detail}")
    
    print("-" * 70)
    print(f"FINAL VERDICT: {'APPROVE' if all_ok else 'REQUEST_CHANGES'}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
