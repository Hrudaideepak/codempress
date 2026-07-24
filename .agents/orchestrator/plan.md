# Codempress Master Execution Plan

## Objectives & Scope
Deliver the gamified Computer Science learning platform according to `ORIGINAL_REQUEST.md` and `AGENTS.md`.

## Requirements Mapping
- **R1: Addictive Gamified Learning Engine** — Curriculum map, unlock gating, streaks, XP multipliers, level badges (Explorer to Legend), interactive theory, MCQs, code challenge verification.
- **R2: High-Impact Visual UI/UX & Micro-Interactions** — Glassmorphism, glowing cues, confetti particle celebrations, sound feedback toggle, smooth animated transitions, skeleton loaders, zero layout shift.
- **R3: Resilient Offline-First Sync Architecture** — SQLite & localStorage persistence, offline event queue (quiz, theory read, progress), background auto-sync on network reconnect.
- **R4: Automated AI Content Generation & Fallback Pipeline** — GitHub Models fallback chain, cooldown management, on-demand caching.

## Milestones & Tasks

### Milestone 1: Exploration & Codebase Audit
- **Task 1.1**: Dispatch `teamwork_preview_explorer` to analyze existing backend, frontend, database, AI generation endpoints, and test suites.
- **Output**: Comprehensive baseline audit report in `.agents/explorer_1/analysis.md`.

### Milestone 2: Core Gamification Engine & Curriculum Gating (R1)
- **Task 2.1**: Verify and complete backend curriculum, unlock gating, streak calculation, XP awards, and level badges (Explorer → Legend).
- **Task 2.2**: Ensure frontend curriculum map renders interactive nodes, unlock status, XP progress bar, streak counters, and code challenge submission.
- **Verification**: Unit tests for progress & quiz grading.

### Milestone 3: High-Impact Visual UI/UX & Micro-Interactions (R2)
- **Task 3.1**: Enhance frontend UI/UX with glassmorphism, dynamic visual glows, confetti celebration on quiz/challenge success, sound toggle control, skeleton loaders, and zero layout shift.
- **Task 3.2**: Verify responsive layout across desktop, tablet, and mobile viewports.

### Milestone 4: Resilient Offline-First Sync Architecture (R3)
- **Task 4.1**: Implement/verify client-side IndexedDB/localStorage queue for offline quiz submissions, theory read events, and progress updates.
- **Task 4.2**: Verify background auto-sync worker on `online` network event with automatic retry and idempotency.

### Milestone 5: Automated AI Content Generation & Fallback Pipeline (R4)
- **Task 5.1**: Ensure server-side GitHub Models pipeline uses fallback chain (`openai/gpt-4o-mini`, `microsoft/phi-4-mini-instruct`, `microsoft/phi-4`, `openai/gpt-4o`, `microsoft/phi-4-reasoning`), respects cooldowns, and caches content in SQLite.
- **Task 5.2**: Test generation API (`POST /api/topics/{id}/generate`) and AI health check (`GET /api/ai/status`).

### Milestone 6: System Test Suite, Build Verification & Forensic Audit
- **Task 6.1**: Execute `python -m pytest` test suite and `npm run build` frontend build check.
- **Task 6.2**: Run Forensic Auditor (`teamwork_preview_auditor`) to verify zero integrity violations.
- **Task 6.3**: Write victory handoff report to `.agents/orchestrator/handoff.md` and inform Sentinel.
