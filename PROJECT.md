# Project: Sandbox Assessment Engine

## Architecture
Codempress In-Browser Code Sandbox and Automated Assessment Engine architecture:
- **Backend Sandbox Engine** (`backend/app/routers/sandbox_router.py` mounted in `backend/app/main.py`):
  - Execution runtime via `asyncio.create_subprocess_exec` using Python (`sys.executable -I -B -u`) and JavaScript (`node --max-old-space-size=64`).
  - Strict 1.5-second execution timeout guard using `asyncio.wait_for` + process kill.
  - Stdin code piping with stdout/stderr stream cap (64KB) preventing memory leaks.
- **Automated Test Assertion & XP Payout Engine**:
  - Evaluation harness running user code against test cases (input/output pairs and custom assertion wrappers).
  - Atomic database transactions updating `users.xp`, `user_progress.mastery_percent`, and attempt tracking in SQLite (`database/skillforge.db`).
- **Error Sanitizer & Socratic AI Hint Integration**:
  - Runtime error parser converting raw Python tracebacks and JS errors into clean, structured diagnostics.
  - Integrates with `/api/ai/hints` in `ai_router.py` to generate 4-level progressive Socratic hints (Nudge → Guidance → Syntax → Solution).
- **Frontend Interactive Sandbox & UI Integration**:
  - `frontend/src/api.js`: `executeSandbox` and `evaluateSandbox` API handlers.
  - `InteractiveCodeSandbox.jsx`: Reusable component with code editor, language selector (Python/JS), live stdout/stderr console, test assertion results, and XP confetti celebration.
  - Full-stack mounting into `TopicReader.jsx` and `Forge.jsx`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Python Code Execution | Secure, isolated sub-1.5s Python code snippet execution via subprocess stdin | M1 | R1 |
| 2 | JavaScript Code Execution | Secure Node.js JS code snippet execution with memory cap | M1 | R1 |
| 3 | Console stdout/stderr Capture | Real-time console capture splitting stdout and formatted stderr tracebacks | M1 | R1 |
| 4 | Sandbox FastAPI Routes | Endpoints `/api/sandbox/execute` and `/api/sandbox/evaluate` mounted in `backend/app/main.py` | M1 & M2 | R4 |
| 5 | Test Assertion Harness | Runs code against test inputs/outputs & assertion functions | M2 | R2 |
| 6 | Pass/Fail Badges & Diff UI | Structured test results showing pass/fail status and output diffs | M2 | R2 |
| 7 | Gamified XP Reward Payout | Atomic DB transaction awarding XP and updating mastery on passing tests | M2 | R2 |
| 8 | Traceback Error Sanitizer | Strips host paths from Python/JS tracebacks while preserving line numbers & error types | M3 | R3 |
| 9 | 4-Level Progressive Socratic Hints | Connects execution errors to Socratic AI hints drawer (Nudge → Guidance → Syntax → Solution) | M3 | R3 |
| 10 | Frontend Sandbox API Integration | `executeSandbox` and `evaluateSandbox` handlers added to `frontend/src/api.js` | M4 | R4 |
| 11 | `InteractiveCodeSandbox.jsx` UI | Full sandbox UI component with editor, controls, output console, assertion badges, XP feedback | M4 | R1 & R2 |
| 12 | `TopicReader.jsx` & `Forge.jsx` Integration | Replaces static code blocks / client-only runners with production sandbox integration | M4 | R4 |
| 13 | E2E Pytest Integration Suite | Pytest suite (`tests/test_sandbox.py`) verifying 100% of endpoints, timeouts, XP, and speed (<1.5s) | M5 | Acceptance Criteria |
| 14 | Stress Testing & Forensic Audit | Verification via Reviewers, Challengers, and Forensic Auditor gate | M6 | Quality Gate |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Multi-Language Sandbox Engine | Create `backend/app/routers/sandbox_router.py`, implement Python & JS subprocess execution with 1.5s timeout & stdout/stderr capture, mount in `backend/app/main.py` | None | PLANNED |
| M2 | Test Assertion Engine & XP Rewards | Implement `/api/sandbox/evaluate` endpoint, test assertion execution harness, atomic XP reward DB transaction, and user progress updates | M1 | PLANNED |
| M3 | Error Diagnostics & Socratic AI Hint Integration | Implement traceback sanitizer, hook runtime execution errors into `/api/ai/hints` router for 4-level progressive Socratic hints | M1, M2 | PLANNED |
| M4 | Frontend UI & Full-Stack Integration | Add API endpoints in `frontend/src/api.js`, build `InteractiveCodeSandbox.jsx` component, integrate into `TopicReader.jsx` and `Forge.jsx` with XP celebration & Socratic hint drawer | M1, M2, M3 | PLANNED |
| M5 | E2E Pytest Integration Suite | Build `tests/test_sandbox.py` covering execution, test assertion, error handling, XP payout, and <1.5s execution SLA | M1-M4 | PLANNED |
| M6 | Review, Stress Test & Forensic Integrity Audit | Execute Reviewer audit, Challenger stress test harness (infinite loops, security, edge cases), and Forensic Auditor integrity verification | M1-M5 | PLANNED |

## Interface Contracts

### POST `/api/sandbox/execute`
- Request Payload:
```json
{
  "language": "python" | "javascript",
  "code": "string",
  "stdin": "string (optional)"
}
```
- Response Payload:
```json
{
  "stdout": "string",
  "stderr": "string",
  "exit_code": 0,
  "execution_time_ms": 120.5,
  "timed_out": false,
  "error_type": null | "SyntaxError" | "NameError" | "TimeoutError" | etc.
}
```

### POST `/api/sandbox/evaluate`
- Request Payload:
```json
{
  "language": "python" | "javascript",
  "code": "string",
  "topic_id": 1,
  "test_cases": [
    {
      "id": "tc1",
      "input": "string or dict",
      "expected_output": "string or dict",
      "is_hidden": false
    }
  ]
}
```
- Response Payload:
```json
{
  "all_passed": true | false,
  "xp_earned": 50,
  "test_results": [
    {
      "id": "tc1",
      "passed": true,
      "expected": "42",
      "actual": "42",
      "stderr": "",
      "execution_time_ms": 45.2
    }
  ],
  "error_context": null | {
    "sanitized_traceback": "string",
    "error_type": "string",
    "line_number": 3
  }
}
```

### POST `/api/ai/hints` (Enhanced)
- Request Payload:
```json
{
  "topic_id": 1,
  "user_code": "string",
  "error_traceback": "string (optional)",
  "failed_test_case": "dict (optional)"
}
```
- Response Payload:
```json
{
  "hints": [
    {"level": 1, "title": "Nudge", "content": "..."},
    {"level": 2, "title": "Guidance", "content": "..."},
    {"level": 3, "title": "Code Pattern", "content": "..."},
    {"level": 4, "title": "Solution", "content": "..."}
  ]
}
```

## Code Layout
```
backend/
├── main.py                             # Uvicorn entry facade
├── app/
│   ├── main.py                         # FastAPI app instance and router inclusion
│   ├── routers/
│   │   ├── sandbox_router.py           # NEW: /api/sandbox execution and evaluation router
│   │   ├── ai_router.py                # Enhanced: /api/ai/hints with error traceback support
│   │   └── curriculum_router.py        # Topic and challenge endpoints
│   ├── domain/
│   │   ├── sandbox_engine.py           # NEW: Subprocess execution engine & stdout/stderr stream capture
│   │   ├── assertion_harness.py        # NEW: Test assertion runner & XP transaction logic
│   │   ├── error_parser.py             # NEW: Python & JS error traceback sanitizer
│   │   └── content_pipeline.py         # AI progressive hint generator
│   └── infrastructure/
│       └── database/                   # SQLite database connections
frontend/
├── src/
│   ├── api.js                          # Added sandbox API endpoints (executeSandbox, evaluateSandbox)
│   ├── components/
│   │   ├── InteractiveCodeSandbox.jsx  # NEW: Reusable sandbox component with editor, console, badges & XP
│   │   └── SocraticHintDrawer.jsx      # Progressive 4-level hint drawer component
│   ├── pages/
│   │   ├── TopicReader.jsx             # Embedded interactive code sandbox in theory/lessons
│   │   └── Forge.jsx                   # Interactive coding challenge playground & test evaluator
│   └── styles/
│       └── main.css                    # Sandbox UI styles, badges, terminal formatting
tests/
└── test_sandbox.py                     # NEW: Pytest suite for sandbox execution, assertion, XP & SLA
```
