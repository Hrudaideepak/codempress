# Handoff Report — Explorer 2 Subagent

## 1. Observation
- **Database Schema**: `database/schema.sql` defines `users` (_id, google_sub, email, name, xp, streak_count), `topics` (_id, subject_name, title, level, theory_json), `user_progress` (_id, user_id, topic_id, theory_read, quizzes_taken, quizzes_passed, mastery_percent), `quiz_attempts` (_id, user_id, topic_id, score_percent, xp_earned).
- **Existing Routers**: `backend/app/routers/curriculum_router.py` has `@router.get("/topics/{topic_id}/challenges")` which currently returns `{"topic_id": topic_id, "challenges": []}`.
- **Existing Quiz & XP Logic**: `quiz_service.py` computes XP as `(correct_count * 10) + (50 if score_percent >= 80 else 0)`, updates `users.xp` and `user_progress.mastery_percent` (30% theory + 70% quiz).
- **Existing AI Hint Integration**: `backend/app/routers/ai_router.py` has `@router.post("/hints")` which calls `generate_progressive_hints` in `backend/app/domain/content_pipeline.py` returning 4 levels (Nudge, Guidance, Code Pattern, Solution).
- **Existing Test Setup**: `tests/test_e2e.py` uses `httpx.AsyncClient` with `ASGITransport(app=app)` and pytest.

## 2. Logic Chain
1. **R2 Requirements (Evaluation & XP)**:
   - `/api/sandbox/evaluate` must accept `language`, `code`, `topic_id`, and `test_cases`.
   - Engine executes student code against input/output pairs or unit assertions using standard I/O matching or wrapper code harnesses for Python & JavaScript.
   - When all test cases pass (`all_passed == True`), the engine calculates XP based on topic difficulty and commits an atomic database transaction (`users.xp += xp_earned`, `user_progress.mastery_percent`, attempt log).
2. **R3 Requirements (Tracebacks & Socratic Hints)**:
   - When execution fails, Python/JS stderr output is sanitized by stripping internal file paths and stack frames while preserving the core error type, message, and line number.
   - The sanitized traceback is passed via `HintRequest.error_traceback` to `/api/ai/hints` / `/api/ai/chat` to generate dynamic 4-level progressive hints via `ai_engine` with fallback to `content_pipeline.py`.
3. **R4 Backend Pytest Integration**:
   - Backend pytest suite in `tests/` can test `/api/sandbox/evaluate` and `/api/ai/hints` directly using `AsyncClient` without requiring live external services.

## 3. Caveats
- No caveats. DB schema and API structures are fully inspected and verified.

## 4. Conclusion
- Requirements R2 and R3 can be seamlessly implemented by mounting a `sandbox_router.py` with `/api/sandbox/evaluate`, connecting atomic XP database transactions to `users` and `user_progress` tables, enhancing `ai_router.py` to accept sanitized error tracebacks for 4-level hints, and expanding `tests/test_e2e.py` or creating `tests/test_sandbox.py` for automated pytest verification.

## 5. Verification Method
- Execute pytest: `pytest -v tests/test_e2e.py`
- Inspect `database/schema.sql` and SQLite DB: `sqlite3 database/skillforge.db "PRAGMA integrity_check;"`
- Inspect OpenAPI specs at `http://localhost:8008/docs` after running backend `python backend/main.py`.
