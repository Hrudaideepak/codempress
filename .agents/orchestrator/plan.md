# Execution Plan — In-Browser Code Sandbox & Automated Assessment Engine

## Objective
Build a production-grade In-Browser Code Sandbox and Automated Assessment Engine for Codempress supporting Python and JavaScript execution, real-time output streaming, test case assertion verification, error diagnostics with Socratic hints, and gamified XP rewards.

## Key Requirements Breakdown
- **R1: Multi-Language Interactive Code Sandbox**
  - Execute Python and JavaScript code snippets securely in < 1.5 seconds.
  - Stream real-time console stdout/stderr capture.
  - Syntax highlighting in code editor UI.
- **R2: Automated Test Assertion Engine & XP Rewards**
  - Harness running student code against predefined test inputs/outputs & assertions.
  - Evaluate correctness, render pass/fail badges per test case.
  - Award XP upon passing exercise test cases and update DB progress/streaks.
- **R3: Error Diagnostics & Socratic Hint Integration**
  - Parse runtime execution errors (Python Tracebacks / JS Syntax & Range Errors).
  - Feed error diagnostics to Socratic AI Hint drawer for 4-level progressive hints.
- **R4: Complete Full-Stack Production Integration**
  - Expose `/api/sandbox/execute` and `/api/sandbox/evaluate` FastAPI endpoints.
  - Mount sandbox routers into backend `main.py`.
  - Integrate interactive code sandbox into frontend components: `TopicReader.jsx` and `Forge.jsx`.

## Execution Topology & Strategy
Using the **Project Orchestrator Pattern**:
1. **Step 0: Survey & Exploration** — Spawn 3 Explorers in parallel to inspect backend routes, execution capabilities (Python subprocess/Pyodide/Node/exec, security, timeout management), DB schema/tables for XP & progress, frontend components (`TopicReader.jsx`, `Forge.jsx`, code editor/Monaco/Prism integration), and hint drawer connections.
2. **Step 1: Master Architecture & Feature Inventory (PROJECT.md)** — Synthesize explorer findings into `PROJECT.md` at root. Define interface contracts, endpoint specs, DB schemas, and component interfaces.
3. **Step 2: Milestone Dispatches (Explorer → Worker → Reviewer → Challenger → Auditor)**
   - **M1: Backend Sandbox Core (Python + JS execution engine, streaming, security timeouts)**
   - **M2: Assertion Harness & XP Rewards System (Test evaluation, XP payout, progress update)**
   - **M3: Error Diagnostics & Socratic Hint Plumbing (Error parser, progressive hint integration)**
   - **M4: Frontend Integration (Sandbox UI components, syntax highlighter, TopicReader & Forge integration)**
   - **M5: Integration Test Suite (Pytest E2E tests for execute & evaluate APIs, performance < 1.5s verification)**
   - **M6: Adversarial Review & Forensic Integrity Audit (Reviewer, Challenger, teamwork_preview_auditor gate)**

## Gates & Acceptance Criteria
- Execution speed < 1.5s for Python and JS.
- Clean UI rendering of stdout/stderr and tracebacks.
- Assertion harness awards XP on pass.
- Pytest suite 100% passing.
- Forensic Auditor verdict CLEAN.
