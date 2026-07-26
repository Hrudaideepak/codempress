# R2 & R3 Requirement Analysis: Sandbox Evaluation Engine, Socratic Hint Drawer, and Database Alignment

## Executive Summary
This report provides a comprehensive architectural analysis of requirements **R2 (Automated Test Assertion Engine & XP Rewards)** and **R3 (Error Diagnostics & Socratic Hint Integration)** for Codempress. It details the existing database schema, designs the `/api/sandbox/evaluate` endpoint and assertion harness, specifies the traceback formatting pipeline for 4-level progressive Socratic AI hints, and outlines the pytest test suite structure for backend test automation.

---

## 1. Database Schema & Progress/XP Pipeline Alignment

### 1.1 Existing Database Schema (SQLite)
The Codempress SQLite database (`database/schema.sql` / `database/skillforge.db`) is structured around integer primary keys (`_id`) with AUTOINCREMENT:

1. **`users` Table**:
   - `_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `google_sub` (TEXT UNIQUE NOT NULL)
   - `email` (TEXT NOT NULL)
   - `name` (TEXT NOT NULL)
   - `picture` (TEXT)
   - `xp` (INTEGER DEFAULT 0)
   - `streak_count` (INTEGER DEFAULT 0)
   - `last_active_date` (TEXT)
   - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

2. **`topics` Table**:
   - `_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `subject_name` (TEXT NOT NULL)
   - `title` (TEXT NOT NULL)
   - `level` (TEXT CHECK(level IN ('Beginner', 'Intermediate', 'Pro')))
   - `description` (TEXT)
   - `theory_json` (TEXT - JSON string containing Markdown prose, worked examples, and exercise prompts)
   - UNIQUE(`subject_name`, `title`)

3. **`user_progress` Table**:
   - `_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `user_id` (INTEGER NOT NULL, FK -> `users(_id)`)
   - `topic_id` (INTEGER NOT NULL, FK -> `topics(_id)`)
   - `theory_read` (BOOLEAN DEFAULT 0)
   - `quizzes_taken` (INTEGER DEFAULT 0)
   - `quizzes_passed` (INTEGER DEFAULT 0)
   - `mastery_percent` (INTEGER DEFAULT 0) — Formula: `30% theory_read + 70% quiz/exercise accuracy`
   - `last_studied` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
   - UNIQUE(`user_id`, `topic_id`)

4. **`quiz_attempts` Table**:
   - `_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `user_id` (INTEGER NOT NULL)
   - `topic_id` (INTEGER NOT NULL)
   - `score_percent` (INTEGER NOT NULL)
   - `xp_earned` (INTEGER NOT NULL)
   - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 1.2 Exercise & Sandbox XP Awarding Mechanics
When a user successfully passes all test assertions for a topic's code exercise:
- **XP Calculation**:
  - Base XP: 25 XP per passed test case.
  - Completion Bonus (when `all_passed == True`):
    - Beginner topic: +50 XP (Total ~100 XP)
    - Intermediate topic: +100 XP (Total ~200 XP)
    - Pro topic: +150 XP (Total ~300 XP)
- **Database Atomic Transaction**:
  1. Increment total XP in `users`:
     ```sql
     UPDATE users 
     SET xp = xp + ?, 
         streak_count = streak_count + 1, 
         last_active_date = CURRENT_TIMESTAMP 
     WHERE _id = ?;
     ```
  2. Upsert `user_progress`:
     ```sql
     INSERT INTO user_progress (user_id, topic_id, mastery_percent)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, topic_id) DO UPDATE SET
         mastery_percent = MAX(mastery_percent, ?),
         last_studied = CURRENT_TIMESTAMP;
     ```
  3. Log evaluation attempt:
     ```sql
     INSERT INTO quiz_attempts (user_id, topic_id, score_percent, xp_earned)
     VALUES (?, ?, ?, ?);
     ```

---

## 2. API Design for `/api/sandbox/evaluate` Endpoint & Assertion Engine

### 2.1 Pydantic Request & Response Schemas
To be located in `backend/app/domain/models.py` or `backend/app/routers/sandbox_router.py`:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class TestCase(BaseModel):
    id: Optional[int] = None
    input: Optional[str] = ""            # Standard input string or function argument string
    expected_output: str                 # Expected standard output string or return value representation
    assertion_code: Optional[str] = None # Optional custom assertion code (e.g. "assert solution(2, 3) == 5")
    hidden: Optional[bool] = False       # If True, input/expected_output hidden in UI results

class SandboxEvaluateRequest(BaseModel):
    topic_id: Optional[int] = None
    challenge_id: Optional[str] = None
    language: str                        # "python" or "javascript" / "js"
    code: str                            # Student solution code
    test_cases: List[TestCase] = []

class TestCaseResult(BaseModel):
    test_case_id: int
    passed: bool
    input: Optional[str] = ""
    expected_output: str
    actual_output: str
    error: Optional[str] = None
    hidden: bool = False

class SandboxEvaluateResponse(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    score_percent: int
    xp_earned: int
    total_xp: int
    results: List[TestCaseResult]
    error_traceback: Optional[str] = None
```

### 2.2 Test Assertion Engine Mechanics

#### Standard I/O Matching Mode
- For each test case in `test_cases`:
  1. Pass `test_case.input` to stdin of the execution runner.
  2. Capture `stdout` and `stderr`.
  3. Normalize `actual_output = stdout.strip()`.
  4. Compare `actual_output` against `expected_output.strip()`.
  5. If `returncode == 0` and `actual_output == expected_output.strip()`, mark `passed = True`.

#### Assertion Code Mode (Unit Testing Function Calls)
- **Python Harness Wrapper**:
  ```python
  # Appended to student's python code during evaluation
  import sys
  
  def _run_test_harness():
      try:
          {assertion_code or f"assert str(solution({test_case.input})).strip() == {repr(test_case.expected_output.strip())}"}
          print("__ASSERTION_PASSED__")
      except AssertionError as ae:
          print(f"__ASSERTION_FAILED__: Expected {repr(test_case.expected_output.strip())}", file=sys.stderr)
          sys.exit(1)
      except Exception as exc:
          print(f"__ASSERTION_ERROR__: {exc}", file=sys.stderr)
          sys.exit(1)

  if __name__ == "__main__":
      _run_test_harness()
  ```

- **JavaScript (Node.js) Harness Wrapper**:
  ```javascript
  // Appended to student's javascript code during evaluation
  try {
      ${assertion_code || `if (String(solution(${test_case.input})).trim() !== ${JSON.stringify(test_case.expected_output.strip())}) throw new Error("Expected " + ${JSON.stringify(test_case.expected_output.strip())});`}
      console.log("__ASSERTION_PASSED__");
  } catch (err) {
      console.error("__ASSERTION_FAILED__: " + err.message);
      process.exit(1);
  }
  ```

---

## 3. Error Diagnostics & Socratic AI Hint Integration (4-Level Hints)

### 3.1 Error Traceback Capture & Sanitation
When code execution or test assertion fails with a runtime error or syntax error:
1. **Python Tracebacks**:
   - Raw output from `sys.stderr` contains full stack trace with temporary file paths (e.g. `File "/tmp/tmp_xyz.py", line 4, in <module>`).
   - Sanitation regex: Replace temporary file paths with `<student_code>`, filter internal Python runner stack frames, retain error category (`SyntaxError`, `TypeError`, `ZeroDivisionError`, `NameError`, `IndexError`) and message.
2. **JavaScript Tracebacks**:
   - Raw output from Node.js `stderr` contains internal callstacks (e.g. `at Module._compile (node:internal/modules/cjs/loader:1376:14)`).
   - Sanitation regex: Remove `node:internal` frames, retain main error line (`ReferenceError: x is not defined at line 3`).

### 3.2 Socratic AI Hint Drawer Integration
Modify `HintRequest` in `backend/app/routers/ai_router.py`:

```python
class HintRequest(BaseModel):
    topic_id: int
    exercise_title: Optional[str] = "Interactive Exercise"
    code_snippet: Optional[str] = ""
    error_traceback: Optional[str] = None  # Sanitized runtime traceback
    requested_level: Optional[int] = None # 1, 2, 3, or 4
```

#### 4-Level Progressive Hint Structure
When `error_traceback` is provided:
- **Level 1: Architectural Nudge (0 XP)**: Conceptual hint about the topic without revealing code or error line.
- **Level 2: Specific Technique Guidance (5 XP)**: Points directly to the line and error category (e.g., "Line 3 throws `ZeroDivisionError` because the divisor evaluates to 0 before the check").
- **Level 3: Direct Code Pattern (10 XP)**: Provides structural code template or guard clause pattern.
- **Level 4: Complete Solution & Explanation (15 XP)**: Full annotated solution explaining the fix.

#### Multi-Provider AI Fallback Pipeline
In `ai_router.py`:
1. Attempt dynamic LLM generation using `ai_engine.generate_completion()` with `SOCRATIC_SYSTEM_PROMPT`.
2. If all AI providers hit rate limits (429) or are offline, fallback gracefully to `content_pipeline.generate_progressive_hints()` populated with the sanitized traceback error details.

---

## 4. Backend Pytest Automation Structure

### 4.1 Existing Test Suite Setup
- Location: `tests/test_e2e.py`
- Configuration: `pytest.ini` (`asyncio_mode = auto`, `testpaths = tests`)
- Async HTTP Test Client: `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test")`

### 4.2 Required Test Cases for R2 & R3
Implement in `tests/test_sandbox.py` or `tests/test_e2e.py`:

1. `test_evaluate_python_code_all_pass()`:
   - Send `POST /api/sandbox/evaluate` with valid Python solution for `sum(a, b)` against 2 test cases.
   - Assert `200 OK`, `all_passed == True`, `passed_count == 2`, `xp_earned > 0`.
2. `test_evaluate_python_code_partial_fail()`:
   - Send `POST /api/sandbox/evaluate` with buggy Python code.
   - Assert `all_passed == False`, inspect `results[i].passed` badges.
3. `test_evaluate_javascript_code_pass()`:
   - Send `POST /api/sandbox/evaluate` with JS solution.
   - Assert `all_passed == True`.
4. `test_evaluate_xp_persisted_to_database()`:
   - Evaluate passing code with authenticated JWT.
   - Query `/api/progress/me` or SQLite `users` table directly to verify `xp` increased.
5. `test_socratic_hints_with_error_traceback()`:
   - Post `HintRequest` with Python `ZeroDivisionError` traceback to `/api/ai/hints`.
   - Assert 4 progressive hints returned with level numbers and XP costs.

---

## 5. Verification Method

To verify these specifications independently:
1. **Pytest Run**:
   ```bash
   pytest -v tests/test_e2e.py
   ```
2. **Database Integrity**:
   ```bash
   sqlite3 database/skillforge.db "PRAGMA integrity_check;"
   ```
3. **Endpoint Validation**:
   Inspect mounted routes in `backend/app/main.py` using FastAPI OpenAPI spec (`http://localhost:8008/docs`).
