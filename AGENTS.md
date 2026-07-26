# Codempress — AGENTS.md

## Project

Gamified coding education platform. Theory → MCQ quiz → code challenges per topic. SQLite offline-first. KeylessAI for content generation (no API key). Built with Google Antigravity's 12-subagent orchestration.

## Repo layout

```
app/
├── .agents/             # Antigravity agent config (agents.md, skills.md)
├── backend/
│   └── main.py                # FastAPI: library, theory, quiz grading, progress
├── content/
│   └── content_generator.py   # KeylessAI-powered theory + MCQ generation
├── database/
│   └── schema.sql             # SQLite schema (topics, questions, progress, XP, streaks)
├── frontend/            # React + Vite + Three.js SPA (light theme)
└── requirements.txt     # Python deps (fastapi, uvicorn, httpx, pydantic)
```

## Subagent architecture (Antigravity Enterprise Matrix)

The system supports specialized subagent roles spawned dynamically to handle end-to-end production software engineering across 18 enterprise disciplines:

| Subagent Name | Role | Core Responsibility |
|---------------|------|---------------------|
| `cto` | **CTO** | Technical strategy, Build vs Buy, trade-offs, cost, scalability, tech debt |
| `principal_software_architect` | **Principal Software Architect** | High-level architecture, module boundaries, system design, data & event flows |
| `staff_backend_engineer` | **Staff Backend Engineer** | FastAPI, Clean Architecture, DDD, Repository Pattern, DI, API reliability |
| `staff_frontend_engineer` | **Staff Frontend Engineer** | React, Vite, state management, accessibility, component design, optimistic updates |
| `senior_mobile_engineer` | **Senior Mobile Engineer** | Offline-first sync, mobile components (Compose/RN), touch interactions |
| `ai_ml_engineer` | **AI/ML Engineer** | GitHub Models pipeline, prompt architecture, fallback chains, token optimization |
| `devops_engineer` | **DevOps Engineer** | Docker, CI/CD pipelines (GitHub Actions), environment & deployment configs |
| `platform_engineer` | **Platform Engineer** | Internal tooling, developer experience, build automation, local dev scripts |
| `database_architect` | **Database Architect** | SQLite/Postgres schema, indexing, migrations, query optimization, N+1 fixes |
| `security_engineer` | **Security Engineer** | OWASP Top 10, JWT security, OAuth, SQLi/XSS/CSRF prevention, security audits |
| `performance_engineer` | **Performance Engineer** | Big-O optimization, bundle size, memory profiling, rendering & query latency |
| `qa_automation_engineer` | **QA Automation Engineer** | Pytest, unit/integration/E2E test suites, edge case verification |
| `site_reliability_engineer` | **Site Reliability Engineer (SRE)** | Health checks, monitoring, alerting, circuit breakers, disaster recovery |
| `product_manager` | **Product Manager** | Business requirements, user stories, edge cases, feature prioritization |
| `ux_engineer` | **UX Engineer** | Design systems, visual aesthetics, micro-animations, theme management |
| `technical_writer` | **Technical Writer** | System docs, API specifications, READMEs, architecture guides |
| `code_reviewer` | **Code Reviewer** | Code quality audits, refactoring, pattern enforcement, anti-pattern detection |
| `tech_lead` | **Tech Lead** | Execution coordination, task breakdown, multi-subagent orchestration |
| `senior_debugging_engineer` | **Senior Debugging Engineer** | Live production outages, step-by-step trace, empirical root cause analysis, zero-regression fixes |
| `clean_architecture_refactoring_specialist` | **Clean Architecture Specialist** | Refactoring messy monoliths, separating concerns, DIP/SOLID, modular coupling reduction |
| `systems_infrastructure_architect` | **Systems Infrastructure Architect** | High-growth startup infrastructure, component topology, caching strategy, DB scaling |
| `four_agent_panel` | **Four-Agent Panel** | Synchronized Architect -> Engineer -> Reviewer -> Optimizer team execution pipeline |
| `ui_systems_engineer` | **UI Systems Engineer** | Reusable UI component systems, loading/empty/error states, responsive layout, WCAG a11y |

### Registered Skills (`.agents/skills/`)

- `architecture-audit`: Reverse-engineer architecture, technical debt analysis, performance & scalability risks.
- `production-debugging`: Outage investigation, un-truncated log tracing, root cause & edge-case analysis.
- `performance-optimization`: High-traffic profiling, Big-O complexity, query optimization, render latency reduction.
- `clean-architecture-refactoring`: Separation of concerns, SOLID/DIP, modular layer boundaries.
- `infrastructure-design`: High-growth system design, caching topologies, API flows, database schemas.
- `ui-systems`: Reusable UI component architecture, loading/empty/error states, responsive layouts, a11y.
- `security-audit`: OWASP Top 10, JWT/OAuth security, prompt injection, vulnerability remediation.
- `devops-production`: Docker/K8s, GitHub Actions CI/CD, health check monitoring, zero-downtime deployment.

Workflow: Orchestrator / Lead invokes subagents via `invoke_subagent` → each executes autonomously in parallel → results are merged into production-grade code.

Run:
```bash
antigravity --project .
/goal Build the Galaxy Map screen
```

## Key facts

- **No API key needed**: KeylessAI endpoint is hardcoded in `content_generator.py:16`
- **DB naming**: All PKs are `_id` (not `id`), SQLite AUTOINCREMENT
- **Curriculum** is hardcoded in `content_generator.py:18-170` — add topics there
- **Levels**: Explorer(0) → Apprentice(1) → Journeyman(2) → Master(3) → Architect(4) → Legend(5)

## Commands

```bash
# Generate/seed content
pip install httpx
cd content && python content_generator.py

# Run backend API (serves SQLite on :8000)
pip install -r requirements.txt
cd backend && python main.py

# Run frontend (proxies /api -> :8000 on :5173)
cd frontend && npm install && npm run dev

# Build frontend
cd frontend && npm run build

# Run Antigravity
cd .. && antigravity --project .
```

## Content pipeline order

1. `ContentGenerator.seed_categories()` — inserts topics from SKILLFORGE_CURRICULUM
2. `ContentGenerator.generate_all_content()` — calls KeylessAI for theory + MCQs per topic
3. Output goes to `database/skillforge.db` (auto-created)

## Conventions

- All theory content stored as JSON strings in SQLite (theory_examples, theory_best_practices, options fields)
- Theory is markdown with **bold** for key terms
- Code examples include title, code, explanation, and expected output
- MCQs always have 4 options (A-D), with correct_answer as 0-indexed integer
- Mastery is calculated per-topic: `user_progress.mastery_percent` (0-100)

## Gotchas

- `content_generator.py` runs asyncio — `__main__` calls `asyncio.run(main())`
- httpx required but not in a requirements file yet
- DB_PATH is relative `../database/skillforge.db` — run from the `content/` directory
- `.agents/` directory must exist before `antigravity --project .` will work
- Backend `DB_PATH` resolves from `backend/main.py` parent's `../database/skillforge.db` — DB must exist or API returns 503
- Frontend dev server proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.js`)
- Mastery = 30% (theory read) + up to 70% (quiz correct / total questions) — see `backend/main.py:_recalc_mastery`

## AI content generation (GitHub Models, server-side)

- Theory + MCQs are generated **on-demand server-side** via GitHub Models, then cached in SQLite (generated once per topic, reused after). Endpoint: `POST /api/topics/{id}/generate` (JWT-protected, respects unlock gating; returns cached content instantly if already generated).
- **Token**: read ONLY from the `GITHUB_TOKEN` env var (Windows User env var). NEVER hardcoded, NEVER sent to the frontend, NEVER committed. Needs GitHub Models (`models: read`) permission.
- **Endpoint**: `https://models.github.ai/inference/chat/completions` (override via `GITHUB_MODELS_ENDPOINT`). Model IDs are `publisher/model` (e.g. `openai/gpt-4o-mini`).
- **Automatic model failover**: `GITHUB_MODELS` is an ordered fallback chain (default: `openai/gpt-4o-mini,microsoft/phi-4-mini-instruct,microsoft/phi-4,openai/gpt-4o,microsoft/phi-4-reasoning`). On 429/quota/error the generator instantly swaps to the next model — no lag, no user-facing error. A 429'd model is put in cooldown (`MODEL_COOLDOWN_SECONDS`, default 60) and skipped until it resets. Only a bad token (401) is fatal.
- **Health**: `GET /api/ai/status` reports each model's availability + cooldown (no secrets).
- Backend must be started in a shell where `GITHUB_TOKEN` is set: `$env:GITHUB_TOKEN=[Environment]::GetEnvironmentVariable("GITHUB_TOKEN","User")` before `python main.py` (child processes inherit User env vars only if the launching shell has them).
- Puter.js was removed (browser-side, required per-user sign-in). `content/content_generator.py` (Pollinations) is legacy/unused; `content/seed_topics.py` seeds the topic skeleton from `content/curriculum.py`.

## Auth (Google OAuth + custom JWT)

- Frontend uses **Google Identity Services** (GIS) to get a Google ID token, posts it to `POST /api/auth/google`, backend verifies it against Google's JWKS and returns our own **custom JWT** (HS256, 7-day expiry).
- JWT is stored in `localStorage` (`sf_token`) and sent as `Authorization: Bearer <token>` on every request (see `frontend/src/api.js`).
- Protected backend routes use the `get_current_user` dependency; `user_id` = JWT `sub`. Public routes: `/api/library`, `/api/topics/*`, `/api/quiz` GET.
- **Frontend** `VITE_GOOGLE_CLIENT_ID` (`.env`) is the Google Client ID. **Backend** `GOOGLE_CLIENT_ID` env var must match (audience check). `JWT_SECRET` env var overrides the dev default.
- Landing page (`frontend/src/pages/Landing.jsx`) gates the app: no token → Landing with Google button; valid token → Library. Logout clears `localStorage`.
- User records live in the `users` table (google_sub unique). Backend `USER_ID` hardcoded constant removed in favor of JWT `sub`.

## Learned Production Guidelines & Architecture Rules

- **Database DDL Auto-Migrations**: `db_connection.py:ensure_database_seeded()` executes `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN` queries automatically on backend boot to keep SQLite database instances in sync with `database/schema.sql` (e.g. `user_roadmap_progress` requires `last_node_id` & `current_node_id`).
- **Sandbox Execution Standard**: Node.js snippet execution in `sandbox_engine.py` runs via `node -e "<code>"` (never `node -` via stdin) to prevent EOF race conditions and process hangs on Linux & CI runners.
- **Conversational AI Assistant**: The AI Chat endpoint `/api/mentor/chat` operates as a natural conversational AI assistant (ChatGPT/Claude style). It automatically ingests user profile stats, resume intelligence, active roadmaps, and mastered topics count into the system prompt.
- **Zero Horizontal Scroll Mobile Layout**: All frontend views enforce `max-width: 100vw; overflow-x: hidden !important;`. Two-column grid layouts collapse to single-column responsive stacks on viewports `< 768px` using `useIsMobile`.

