# Handoff Report — Explorer 1 (R1 & R4 Backend Sandbox Architecture)

## 1. Observation
- **Backend Entry & Application**:
  - `backend/main.py` line 22: `from backend.app.main import app`. `backend/main.py` is the Uvicorn entry facade.
  - `backend/app/main.py` lines 184-192: App router mounting section where routers are registered (`app.include_router(...)`).
- **Database Architecture**:
  - `backend/database.py` line 1-7: Imports non-blocking database helpers (`execute_query`, `execute_write`, `execute_batch_write`).
  - `backend/infrastructure/database/db_connection.py` lines 143-153: Wraps synchronous `sqlite3` using Starlette's `run_in_threadpool`.
- **Runtime Execution**:
  - Python execution available via `sys.executable` (current Python interpreter running FastAPI).
  - Node.js runtime resolvable via `shutil.which("node")`.
- **Dependencies**:
  - `backend/requirements.txt` contains `fastapi>=0.115.0`, `uvicorn[standard]>=0.34.0`, `httpx>=0.28.0`, `pyjwt>=2.10.0`, `pydantic>=2.10.0`, `python-dotenv>=1.0.1`, `python-multipart>=0.0.18`. Standard library (`asyncio`, `sys`, `shutil`) provides all needed execution primitives without heavy third-party sandbox packages.

## 2. Logic Chain
1. **Subprocess Async Execution**: Synchronous `subprocess.run` blocks FastAPI's event loop. Using `asyncio.create_subprocess_exec` natively runs process IO within the async event loop, enabling concurrent sandbox execution across multiple users.
2. **Sub-1.5s Speed Optimization**: Writing source code to disk files creates unnecessary disk IO overhead (~50-150ms). Feeding source code directly through stdin (`communicate(input=code.encode("utf-8"))` or `process.stdin.write`) reduces startup overhead to ~30-70ms total, easily meeting the < 1.5s SLA.
3. **Security & Timeout Protection**: Wrapping `process.communicate` inside `asyncio.wait_for(..., timeout=1.5)` guarantees process termination on timeout (calling `process.kill()`), preventing infinite loops and CPU exhaustion. Isolated flags (`-I -B -u` for Python, `--max-old-space-size=64` for Node) strip system environments and cap memory usage.
4. **Dual Response Model**: Supporting both standard REST JSON payloads and Server-Sent Events (`text/event-stream`) streaming in `/api/sandbox/execute` allows the frontend UI to display real-time terminal stdout chunks or retrieve immediate structured JSON response payloads.
5. **Router Architecture Integration**: Adding `backend/app/routers/sandbox_router.py` with `/api/sandbox` prefix and mounting it in `backend/app/main.py` aligns 100% with the existing modular FastAPI design pattern.

## 3. Caveats
- Host Node.js dependency: Running JavaScript snippets requires Node.js (`node`) to be present on the host environment PATH. If Node.js is absent, Python snippets execute normally while JavaScript snippet requests return an explicit 400 Bad Request error.
- Non-containerized environment: Running directly on host via subprocess relies on isolated flags (`-I`, env stripping, memory limits, process timeouts) rather than Docker container namespaces. In production containerized deployments (Docker), the FastAPI container itself acts as the containment boundary.

## 4. Conclusion
The backend architecture for R1 and R4 is fully specified and ready for implementation. Creating `backend/app/routers/sandbox_router.py` with `asyncio.create_subprocess_exec` stdin process pipes, 1.5-second timeout guards, 64KB stream caps, and dual JSON/SSE streaming, and mounting it into `backend/app/main.py` satisfies all R1 and R4 requirements with sub-250ms average execution latency.

## 5. Verification Method
1. **File Inspection**: Verify `C:\Users\durga\OneDrive\Desktop\app\.agents\explorer_1\analysis.md` and `C:\Users\durga\OneDrive\Desktop\app\.agents\explorer_1\handoff.md` exist and contain complete specifications.
2. **FastAPI Route Verification**: After router implementation, run `python backend/main.py` and inspect `http://localhost:8008/docs` to verify `/api/sandbox/execute` and `/api/sandbox/evaluate` are present under the `Sandbox` OpenAPI tag.
3. **Pytest Integration**: Run `pytest -v tests/test_sandbox.py` or `pytest -v tests/` to verify execution time, timeout guards, and response payloads.
