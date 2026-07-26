# Original User Request

## 2026-07-26T13:19:20Z

Build a production-grade In-Browser Code Sandbox and Automated Assessment Engine for Codempress supporting Python and JavaScript execution, real-time output streaming, test case assertion verification, and gamified XP integration.

Working directory: C:\Users\durga\OneDrive\Desktop\app\teamwork_projects\sandbox_assessment_engine
Integrity mode: benchmark

## Requirements

### R1. Multi-Language Interactive Code Sandbox
Provide a high-performance in-browser / backend code execution sandbox supporting Python and JavaScript with real-time console stdout/stderr capture and syntax highlighting.

### R2. Automated Test Assertion Engine & XP Rewards
Implement an assertion verification harness that runs student code against predefined test inputs/outputs, evaluates correctness, displays pass/fail badges, and awards XP.

### R3. Error Diagnostics & Socratic Hint Integration
Connect execution runtime errors (Traceback / SyntaxErrors) to the Socratic AI Hint drawer to offer instant 4-level progressive hints when code fails.

### R4. Complete Full-Stack Production Integration
Mount all backend routers into `backend/app/main.py`, expose `/api/sandbox/execute` and `/api/sandbox/evaluate`, and integrate the sandbox into `TopicReader.jsx` and `Forge.jsx`.

## Acceptance Criteria

### Execution & Verification
- [ ] Sandbox executes Python and JavaScript code snippets in < 1.5 seconds.
- [ ] Real-time stdout console logs and error Tracebacks render cleanly in the UI.
- [ ] Evaluates exercise assertions and awards XP upon passing all test cases.
- [ ] Automated pytest integration suite passes 100% of test cases.
