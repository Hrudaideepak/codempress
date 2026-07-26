# Handoff Report — Challenger Subagent (`challenger_2`)

## Explicit Verdict: `REQUEST_CHANGES`

---

## 1. Observation

### Boundary Condition Observations
- **`backend/app/domain/assertion_harness.py` lines 32-40**:
  ```python
  if not test_cases:
      test_cases = [{
          "id": 1,
          "input": "",
          "expected_output": "",
          "assertion_code": None,
          "is_hidden": False
      }]
  ```
  When `test_cases` is an empty list `[]`, a fallback test case with `expected_output=""` is generated.
- **`backend/app/domain/assertion_harness.py` lines 132-134**:
  ```python
  base_xp = passed_count * 25
  completion_bonus = 50 if all_passed else 0
  xp_earned = base_xp + completion_bonus
  ```
  For an empty `test_cases` list, any code that executes with exit code `0` passes the fallback test case, resulting in `passed_count=1`, `all_passed=True`, and **75 XP awarded**.

### Cheating Vector Observations
- **`backend/app/domain/assertion_harness.py` lines 61-75 (Python Assertion Wrapper)**:
  ```python
  wrapped_code = (
      f"{code}\n\n"
      f"import sys\n"
      f"if __name__ == '__main__':\n"
      f"    try:\n"
      f"        {assertion_code.strip()}\n"
      f"        print('__ASSERTION_PASSED__')\n"
      ...
  )
  ```
  Student `{code}` is prepended directly before the harness assertion block.
- **`backend/app/domain/assertion_harness.py` lines 88-89**:
  ```python
  actual_output = res["stdout"].replace("__ASSERTION_PASSED__", "").strip()
  passed = (res["exit_code"] == 0) and ("__ASSERTION_PASSED__" in res["stdout"])
  ```

#### Vulnerability 1: Top-level `sys.exit(0)` with hardcoded string (Python & JavaScript)
- Python student submission:
  ```python
  import sys
  print("__ASSERTION_PASSED__")
  sys.exit(0)
  ```
- JavaScript student submission:
  ```javascript
  console.log('__ASSERTION_PASSED__');
  process.exit(0);
  ```
  **Result**: Python/Node executes the student's print statement and terminates immediately with exit status `0`. The assertion code block `{assertion_code}` is NEVER evaluated. The harness receives `exit_code == 0` and `"__ASSERTION_PASSED__"` in stdout, marking the test case as **PASSED**.

#### Vulnerability 2: Monkeypatching `sys.exit` in Python
- Python student submission:
  ```python
  import sys
  sys.exit = lambda code=0: None
  print("__ASSERTION_PASSED__")
  ```
  **Result**: When `AssertionError` is raised in the wrapper and `sys.exit(1)` is executed, the overridden `sys.exit` returns `None`. Python continues to the end of the script and exits cleanly with code `0`. Because stdout contains `"__ASSERTION_PASSED__"`, the harness marks the failing test as **PASSED**.

#### Vulnerability 3: Hidden Test Case Input Leak via `stderr`
- **`backend/app/domain/assertion_harness.py` lines 123**:
  ```python
  "stderr": res.get("stderr", ""),
  ```
  While `input`, `expected`, and `actual` are masked with `"<hidden>"` when `is_hidden=True`, the `stderr` key is **unmasked**.
- Python student submission:
  ```python
  import sys
  print(f"LEAK: {sys.stdin.read()}", file=sys.stderr)
  ```
  **Result**: The returned API JSON response for `/api/sandbox/evaluate` exposes the raw stdin contents of hidden test cases inside the `stderr` string field.

### Database & Socratic AI Observations
- **`backend/infrastructure/database/db_connection.py` lines 114-141 (`_sync_execute_batch_write`)**:
  Executes queries within `conn.cursor()` and finishes with `conn.commit()`. If an exception occurs, `conn.rollback()` is invoked.
- **`backend/app/domain/content_pipeline.py` lines 58-146 (`generate_progressive_hints`)**:
  Generates 4 levels: Nudge (0 XP), Guidance (5 XP), Code Pattern (10 XP), Solution (15 XP). Tracebacks (`ZeroDivisionError`, `IndexError`, etc.) dynamically update Level 2 guidance and Level 3 guard patterns.

---

## 2. Logic Chain

1. **Observation**: `assertion_harness.py` wraps student code by placing `{code}` above `{assertion_code}` and checking if `"__ASSERTION_PASSED__"` exists in stdout alongside `exit_code == 0`.
2. **Step 1**: If student code prints `"__ASSERTION_PASSED__"` and calls `sys.exit(0)`, execution stops before reaching `{assertion_code}`.
3. **Step 2**: The process returns `exit_code = 0` and stdout containing `"__ASSERTION_PASSED__"`.
4. **Step 3**: The assertion harness condition `(res["exit_code"] == 0) and ("__ASSERTION_PASSED__" in res["stdout"])` evaluates to `True`.
5. **Conclusion**: Any user can bypass code challenge assertions and earn XP without solving the problem.
6. **Observation**: `test_results` masks input/output fields for hidden test cases, but does not mask `stderr`.
7. **Step 4**: Student code printing `sys.stdin.read()` to `stderr` causes the hidden test case input to be returned in the API response.
8. **Conclusion**: Hidden test case privacy is violated.

---

## 3. Caveats

- **Host Process Sandbox**: `sandbox_engine.py` uses `asyncio.create_subprocess_exec` with `sys.executable -I -B -u` (isolated mode) and a 1.5s timeout guard. Host-level OS sandboxing (e.g. Docker containerization / seccomp / chroot) is outside the current Python process scope.
- **Node.js Environment**: JavaScript execution relies on `node` being present in PATH. If `node` is absent, JS sandbox returns a clean `EnvironmentError`.

---

## 4. Conclusion

The Sandbox Assessment Engine and Gamified XP infrastructure features strong SQLite database transaction atomicity (`execute_batch_write` with rollback) and well-structured Socratic progressive hint generation.

However, the assertion evaluation harness contains **3 CRITICAL security/cheating flaws** and **1 HIGH data privacy flaw**:
1. **Assertion Bypass via Top-Level Exit**: `sys.exit(0)` / `process.exit(0)` combined with stdout marker injection bypasses assertion verification completely.
2. **Assertion Bypass via `sys.exit` Override**: Monkeypatching `sys.exit` neutralizes assertion error failure codes.
3. **Hidden Test Case Leak**: Unmasked `stderr` in `test_results` leaks hidden test inputs to the client.
4. **XP Farming via Empty Test Cases**: `test_cases=[]` awards 75 XP for any non-crashing code.

**Explicit Verdict**: `REQUEST_CHANGES`.

---

## 5. Verification Method

### How to Reproduce Cheating Vulnerability 1 (Python `sys.exit(0)` bypass):
1. Send `POST /api/sandbox/evaluate`:
   ```json
   {
     "language": "python",
     "code": "import sys\nprint('__ASSERTION_PASSED__')\nsys.exit(0)",
     "topic_id": 1,
     "test_cases": [
       {
         "id": 1,
         "input": "",
         "expected_output": "42",
         "assertion_code": "assert add(2, 3) == 5"
       }
     ]
   }
   ```
2. **Expected Behavior**: Test case MUST FAIL with error (`add` is undefined).
3. **Actual Behavior**: Returns `all_passed: true`, `score_percent: 100`, `xp_earned: 75`.

### How to Reproduce Hidden Test Case Leak:
1. Send `POST /api/sandbox/evaluate` with `is_hidden: true`:
   ```json
   {
     "language": "python",
     "code": "import sys\nprint(f'LEAK:{sys.stdin.read()}', file=sys.stderr)",
     "test_cases": [
       {"id": 1, "input": "SUPER_SECRET_INPUT", "expected_output": "out", "is_hidden": true}
     ]
   }
   ```
2. Inspect `test_results[0].stderr`.
3. **Actual Behavior**: `stderr` contains `"LEAK:SUPER_SECRET_INPUT"`.

---

### Required Remediations for Implementation Team:

1. **Randomized Server Token**: Generate a cryptographically secure random token (e.g. `uuid.uuid4().hex`) per test case evaluation. Only print the token if the assertion block passes.
2. **Isolated Scope Execution**: Execute student code inside a function/isolated namespace so top-level `sys.exit(0)` cannot prevent assertion execution, and catch `SystemExit` to treat early termination as a test failure.
3. **Mask `stderr` on Hidden Test Cases**: Set `"stderr": "<hidden>"` when `is_hidden=True`.
4. **Require Test Cases for XP**: Do not award completion bonus XP if `test_cases` is empty.
