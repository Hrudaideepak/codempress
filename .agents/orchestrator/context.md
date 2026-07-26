# Context Summary

## Project Goal
Build a production-grade In-Browser Code Sandbox and Automated Assessment Engine for Codempress.

## Key Requirements & Specs
- **R1: Multi-Language Sandbox**: Python & JS support, real-time console stdout/stderr streaming, syntax highlighting. Execution latency < 1.5 seconds.
- **R2: Test Assertion Engine & XP Rewards**: Harness running code against predefined test inputs/outputs, pass/fail indicators, automatic XP reward payout & SQLite progress updates.
- **R3: Error Diagnostics & Progressive Socratic Hints**: Parse tracebacks/syntax errors into structured error context and hook into 4-level progressive AI hint drawer.
- **R4: Full-Stack Production Integration**: FastAPI backend routes (`/api/sandbox/execute`, `/api/sandbox/evaluate`), frontend integration into `TopicReader.jsx` and `Forge.jsx`.

## Codebase Context (from AGENTS.md)
- `backend/main.py`: FastAPI server serving SQLite database. Auth via Google OAuth/JWT.
- `database/schema.sql`: SQLite schema (`topics`, `questions`, `progress`, `users`, XP, streaks).
- `frontend/`: React + Vite SPA.
- `content/content_generator.py`: KeylessAI content generation.

## Constraints & Rules
- Orchestrator MUST NOT write code directly or execute test commands directly.
- All technical investigation delegated to Explorers; implementation to Workers; verification to Reviewers, Challengers, and Forensic Auditors.
- Forensic Auditor verdict is a binary veto.
