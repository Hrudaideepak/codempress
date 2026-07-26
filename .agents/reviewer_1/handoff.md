# Handoff Report — Sandbox Assessment Engine Review

## 1. Observation

### Codebase Inspection & Verification
- **Sandbox Subprocess Engine (`backend/app/domain/sandbox_engine.py`)**:
  - Python execution: Invokes `sys.executable` with `-I` (isolated mode), `-B` (no bytecode compilation), `-u` (unbuffered stdout/stderr), and `-` (stdin code stream).
  - JavaScript execution: Invokes `node` with `--no-warnings` and `--max-old-space-size=64`.
  - Environment Isolation: `env = {"PATH": os.environ.get("PATH", "")}` is explicitly passed to `asyncio.create_subprocess_exec`, ensuring sensitive host environment variables (`GITHUB_TOKEN`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`) are stripped from student code processes.
  - SLA Timeout Handling: Uses `asyncio.wait_for(..., timeout=timeout)` defaulting to `1.5s`. On `TimeoutError`, it executes `process.kill()` followed by `await process.wait()` to prevent zombie process leaks.
  - Stream Limits: Output length cap enforced at `64KB` (`MAX_OUTPUT_BYTES = 64 * 1024`).

- **Test Assertion Harness (`backend/app/domain/assertion_harness.py`)**:
  - Python assertion wrapping (lines 62-75):
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
  - Output comparison (line 96): `passed = (res["exit_code"] == 0) and (actual_output == expected_output)`.
  - User verification call (line 30): `await ensure_user_exists(user_id)`.
  - Atomic database transactions (lines 139-175): Uses `execute_batch_write` for atomic SQLite transaction updating `users.xp`, `user_progress.mastery_percent`, and `quiz_attempts`.

- **Traceback Sanitizer (`backend/app/domain/error_parser.py`)**:
  - Python sanitization: Replaces `File "path/to/file.py", line X` with `File "<student_code>", line X`. Extracts `error_type`, `line_number`, and message.
  - JS sanitization: Strips `node:internal` frames, replaces Windows (`C:\...\file.js`) and Unix (`/path/to/file.js`) host file paths with `<student_code>`.

- **API & Security Routers (`sandbox_router.py`, `ai_router.py`, `main.py`)**:
  - Routers mounted cleanly in `backend/app/main.py`.
  - Supports JWT authentication via `get_current_user_optional` with guest fallback to `user_id = 1`.

---

## 2. Logic Chain

1. **Subprocess Security & Execution SLA**: The design correctly uses `-I -B -u` for Python and `--max-old-space-size=64` for Node.js. Passing `env={"PATH": ...}` prevents process environment variable leakage. The 1.5s `asyncio.wait_for` combined with `process.kill()` and `await process.wait()` guarantees bounded execution without process leaks.
2. **Indentation Bug in Python Assertion Harness (Critical Finding)**:
   - Line 67 of `assertion_harness.py` inserts `{assertion_code.strip()}` with `8` leading spaces.
   - If `assertion_code` is a multi-line string (e.g. `assert add(2, 3) == 5\nassert add(10, 20) == 30`), string interpolation indents line 1 by 8 spaces, but lines 2+ remain at 0 indentation.
   - In Python, this breaks out of the `try:` block and causes an `IndentationError: unexpected indent` at line 68 (`        print('__ASSERTION_PASSED__')`). Any multi-line assertion code will fail immediately.
3. **Windows Line Ending Discrepancy in IO Assertion (Major Finding)**:
   - On Windows environments, Python subprocesses output `\r\n` line endings.
   - `actual_output == expected_output` compares `"line1\r\nline2"` against `"line1\nline2"`, causing valid multi-line outputs to evaluate to `passed = False`. Normalizing `\r\n` to `\n` in both `actual_output` and `expected_output` is necessary.
4. **User ID Re-assignment Omission (Minor Finding)**:
   - `ensure_user_exists(user_id)` returns a validated `user_id` (defaulting `user_id = 1` if `None` or `<= 0`).
   - `evaluate_solution` calls `await ensure_user_exists(user_id)` without capturing the returned `user_id`. If `user_id=None` is passed, `user_id` remains `None` during batch SQL execution.
5. **SSE Stream Generator Buffering (Minor Finding)**:
   - `stream_code_execution` in `sandbox_engine.py` awaits `asyncio.gather` on read tasks until completion before yielding chunks. While output is correctly sent with header `text/event-stream`, events are emitted post-execution rather than streaming live chunk-by-chunk.

---

## 3. Caveats

- Tests were verified via code inspection and static analysis. `run_command` execution for `pytest` was blocked due to local user permission timeout.
- Node.js execution requires `node` binary installed in host `PATH`; if missing, the sandbox gracefully returns an `EnvironmentError` payload.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

The overall architecture, security isolation, error sanitization, and atomic SQLite transaction design are solid. However, code changes are required to fix the critical Python multi-line assertion indentation bug and Windows CRLF normalization.

### Required Changes:

1. **[Critical] Fix Python Assertion Code Indentation (`backend/app/domain/assertion_harness.py`)**:
   Format each line of `assertion_code` with 8 spaces before inserting into `wrapped_code`:
   ```python
   indented_assertion = "\n".join("        " + l for l in assertion_code.strip().splitlines())
   ```

2. **[Major] Normalize Newlines in IO Matching (`backend/app/domain/assertion_harness.py`)**:
   Normalize `\r\n` to `\n` on `actual_output` and `expected_output`:
   ```python
   actual_output = res["stdout"].replace("\r\n", "\n").strip()
   expected_output = expected_output.replace("\r\n", "\n").strip()
   ```

3. **[Minor] Assign Return Value of `ensure_user_exists` (`backend/app/domain/assertion_harness.py`)**:
   ```python
   user_id = await ensure_user_exists(user_id)
   ```

---

## 5. Verification Method

To verify the requested fixes after implementation:

1. **Multi-line Python Assertion Test**:
   Execute `evaluate_solution("python", "def add(a, b): return a + b", [{"assertion_code": "assert add(2, 3) == 5\nassert add(10, 20) == 30"}])`. Must return `all_passed=True` without `IndentationError`.

2. **Windows Newline Normalization Test**:
   Execute `evaluate_solution("python", "print('hello\\nworld')", [{"expected_output": "hello\nworld"}])`. Must return `all_passed=True`.

3. **Pytest Integration Suite**:
   Run `pytest tests/test_sandbox.py` to ensure all execution, assertion, error parser, and API tests pass.
