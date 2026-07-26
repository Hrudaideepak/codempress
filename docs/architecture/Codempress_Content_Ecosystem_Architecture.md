# Codempress — Content Ecosystem & Platform Architecture Guide

**Version:** 3.0  
**Status:** Production-Ready  
**Integration:** FastAPI Backend | React Frontend | SQLite Database | GitHub Models AI Pipeline

---

## 📍 The Complete Content Ecosystem

### 1. File & Component Structure

```
app/
├── content/                          ← CONTENT GENERATION & SEEDING PIPELINE
│   ├── seed_topics.py                ← Fast SQLite executemany seeder (~50ms)
│   ├── curriculum.py                 ← Master topic taxonomy definitions
│   └── curriculum_cs_fundamentals.py ← CS Fundamentals topics
│
├── database/                         ← SQLITE OFFLINE-FIRST DATABASE
│   ├── schema.sql                    ← Complete SQLite schema
│   └── skillforge.db                 ← Primary database file
│
├── backend/                          ← FASTAPI BACKEND API
│   ├── main.py                       ← FastAPI app entrypoint & middleware
│   ├── database.py                   ← Async SQLite connection pool
│   ├── ai_engine.py                  ← GitHub Models fallback chain
│   └── app/
│       ├── domain/
│       │   ├── knowledge_graph.py    ← 10-level hierarchy & skill-gap engine
│       │   ├── curriculum_sdk.py     ← 53 master skill taxonomies
│       │   └── content_pipeline.py   ← 20-section topic generator & AI hints
│       └── routers/
│           ├── auth_router.py        ← Google OAuth & JWT authentication
│           ├── curriculum_router.py  ← Topics, subjects, theory, quizzes
│           ├── roadmap_router.py     ← 26 roadmaps & knowledge graph endpoints
│           ├── progress_router.py   ← User progress, XP, streak, badges
│           └── ai_router.py          ← Socratic AI mentor, 4-level hints
│
└── frontend/                         ← REACT + VITE SPA FRONTEND
    ├── src/
    │   ├── App.jsx                   ← Main router (/roadmaps, /library, /topic/:id, /forge)
    │   ├── api.js                    ← API client with offline queueing
    │   ├── pages/
    │   │   ├── Landing.jsx           ← Auth gated landing page
    │   │   ├── Library.jsx           ← Subject & topic browser (1,846+ topics)
    │   │   ├── TopicReader.jsx       ← 20-Section Topic Reader & AI Mentor drawer
    │   │   ├── Roadmaps.jsx          ← 26 Career Roadmaps & Skill-Gap analyzer
    │   │   ├── Forge.jsx             ← Interactive code editor & quiz arena
    │   │   └── Profile.jsx           ← User XP, level, badges, streak
    │   ├── components/
    │   │   └── ui/                   ← Premium dark/light design system
    │   └── services/
    │       └── soundService.js       ← Non-blocking Web Audio feedback
    └── vite.config.js                ← Proxy /api -> http://localhost:8000
```

---

## 🌐 Complete Web Platform Navigation & Access

| Page / Feature | Route | Description & Live URL |
| :--- | :--- | :--- |
| **Landing Page** | `/` | Auth gate with Google Login & platform overview ([Vercel Live](https://codempress.vercel.app)) |
| **Topic Library** | `/library` | Subject browser for 1,846+ CS topics ([Vercel Live](https://codempress.vercel.app/library)) |
| **Topic Reader** | `/topic/:id` | 20-Section lesson reader + AI Mentor 4-Level Hint drawer ([Vercel Live](https://codempress.vercel.app/topic/1741)) |
| **Career Roadmaps** | `/roadmaps` | 26 Roadmaps (10 AI-Native, 6 Exclusive, 10 Legacy) + Skill-Gap Engine ([Vercel Live](https://codempress.vercel.app/roadmaps)) |
| **Interactive Forge** | `/forge` | Interactive code playground & MCQ quiz arena ([Vercel Live](https://codempress.vercel.app/forge)) |
| **User Profile** | `/profile` | XP level progression, streak counter, and earned badges ([Vercel Live](https://codempress.vercel.app/profile)) |

---

## 📊 Database Schema & API Routing

### SQLite Schema (`database/schema.sql`)
- `topics`: Master table for 1,846+ topics.
- `topic_content`: Stores 20-section lesson theory as JSON.
- `questions`: MCQ questions per topic.
- `user_progress`: Per-user topic mastery percentage (30% read + 70% quiz).
- `topic_prerequisites`: Edge dependencies for knowledge graph traversal.
- `projects` & `assessments`: Project blueprints and skill check rubrics.
- `misconceptions`: Pre-seeded misconception bank for AI feedback.

### FastAPI Endpoints Summary
- `POST /api/auth/google`: Verifies Google ID token and issues JWT.
- `GET /api/topics/{id}`: Returns topic detail and 20-section lesson theory.
- `POST /api/topics/{id}/generate`: On-demand AI lesson generation via GitHub Models.
- `GET /api/roadmaps`: Returns all 26 roadmaps across 3 categories.
- `POST /api/knowledge-graph/skill-gap`: Evaluates skill gap and returns a 7-day plan.
- `POST /api/ai/hints`: Delivers 4-level progressive hints (Level 1 Nudge ➔ Level 4 Solution).
- `POST /api/ai/misconception`: Analyzes wrong quiz answers with real-world analogies.

---

## 🟢 Production Deployment Status
- **Render Backend**: `https://codempress.onrender.com` (Deploy `dep-d9ircjmk1jcs73f6dukg` 🟢 **LIVE**)
- **Vercel Frontend**: `https://codempress.vercel.app` (🟢 **LIVE**)
