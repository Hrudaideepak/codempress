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

## Subagent architecture (Antigravity)

12 subagents spawned dynamically by the Orchestrator, run in parallel with workspace isolation:

| Subagent | Purpose | Key Deliverable |
|----------|---------|-----------------|
| **Orchestrator** | Breaks down goals, delegates, tracks progress | Coordination |
| **UI-UX-Designer** | Screen designs (Galaxy Map, Battle, Code Forge, Library, Profile) | Figma + HTML/CSS |
| **Frontend-Engineer** | Jetpack Compose screens, animations, navigation | Kotlin UI |
| **Backend-Engineer** | FastAPI endpoints, KeylessAI `/generate`, caching | Python API |
| **Database-Architect** | SQLite schema, 10K+ questions seeded, Room integration | DB + seed scripts |
| **AI-Integration-Specialist** | MCQ generation, code explanations, prompt engineering | AI prompts |
| **Content-Curator** | Full curriculum from official docs, difficulty scaling | Knowledge graph |
| **Game-Designer** | XP, streaks, badges, health bars, reward logic | Gamification engine |
| **QA-Tester** | Unit + UI + offline + performance tests | JUnit/Espresso |
| **DevOps-Engineer** | Gradle, GitHub Actions, APK signing, Crashlytics | CI/CD pipeline |
| **Documentation-Writer** | API docs, user guide, developer guide, README | Markdown |
| **Project-Manager** | Sprint plans, task tracking, progress reports | Markdown/JSON |

Workflow: user `/goal` → Orchestrator spawns subagents in parallel → each works independently → Orchestrator merges outputs.

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
