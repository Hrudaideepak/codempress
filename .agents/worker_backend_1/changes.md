# Summary of Backend Changes (Milestones 1, 2, 3)

## Files Created

1. `backend/app/domain/sandbox_engine.py`
   - Secure subprocess execution engine using `asyncio.create_subprocess_exec`.
   - Supports Python (`sys.executable -I -B -u -`) and JavaScript (`node --no-warnings --max-old-space-size=64 -`).
   - Enforces strict 1.5s timeout guard with `asyncio.wait_for` and `process.kill()` on timeout.
   - Implements stdout/stderr stream cap at 64KB (65,536 bytes) to prevent memory allocation denial-of-service.
   - Provides both standard non-streaming `execute_code` and real-time SSE streaming `stream_code_execution`.

2. `backend/app/domain/error_parser.py`
   - Traceback sanitizer for Python and JavaScript errors.
   - Strips host file system paths (e.g. `C:\...\tmp.py` -> `<student_code>`) and Node.js internal frames (`node:internal/...`).
   - Extracts structured error metadata: `sanitized_traceback`, `error_type` (e.g. `ZeroDivisionError`, `ReferenceError`), `line_number`, and `message`.

3. `backend/app/domain/assertion_harness.py`
   - Test assertion evaluation harness for Python and JavaScript.
   - Supports standard I/O input/output matching as well as custom assertion code wrappers.
   - Computes execution time per test case and output diffs (`expected` vs `actual`).
   - Executes atomic SQLite DB transaction via `execute_batch_write`: updates `users.xp` (+ earned XP), upserts `user_progress.mastery_percent`, and records evaluation logs in `quiz_attempts` in `database/skillforge.db`.

4. `backend/app/routers/sandbox_router.py`
   - Implements API endpoints `POST /api/sandbox/execute` and `POST /api/sandbox/evaluate`.
   - Supports optional JWT authentication (`get_current_user_optional`), defaulting to guest user (`user_id = 1`) if unauthenticated.
   - Supports both JSON response payloads and SSE streaming (`stream: true` or `Accept: text/event-stream`).

5. `tests/test_sandbox.py`
   - Comprehensive test suite validating execution SLA (<1.5s), timeout enforcement, error parser sanitization, assertion evaluation, XP payouts in SQLite, and progressive Socratic AI hints.

## Files Modified

1. `backend/app/domain/models.py`
   - Added Pydantic data schemas: `SandboxExecuteRequest`, `SandboxExecuteResponse`, `TestCase`, `SandboxEvaluateRequest`, `TestCaseResult`, `ErrorContext`, and `SandboxEvaluateResponse`.

2. `backend/app/domain/content_pipeline.py`
   - Updated `generate_progressive_hints` to parse `error_traceback` and `failed_test_case`, generating 4-level progressive hints (Level 1: Nudge, Level 2: Guidance, Level 3: Code Pattern/Syntax, Level 4: Solution) incorporating line numbers and error categories.

3. `backend/app/routers/ai_router.py`
   - Enhanced `HintRequest` model and `POST /api/ai/hints` endpoint to accept `error_traceback`, `failed_test_case`, and `requested_level`.

4. `backend/app/main.py`
   - Imported and mounted `sandbox_router` under prefix `/api/sandbox`.
