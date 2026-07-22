# 🚀 Codempress — AI-Powered CS Learning Operating System

**Codempress** is the daily command center for Computer Science students that organizes learning, practice, and skill mastery into one continuous daily workflow.

> *"Know exactly what to learn. Every day. Until you're hired."*

---

## ✨ Key Features & Signature Experience

- **🎯 The Today View ("Zero-Decision Daily Plan"):** Tells the student the 3 exact micro-tasks to complete today (1. Learn 15m → 2. Quiz 8 Qs → 3. Spaced Review).
- **📚 34 Subjects & 3,405 Topics:** Full curriculum covering CS Fundamentals (DSA, OS, DBMS, Networks, OOP, C), Web Dev, AI/ML, and Mobile.
- **⚡ Server-Side Multi-Provider AI Engine:** 12 free-tier providers (`Cerebras`, `Groq`, `GitHub Models`, `Gemini`, `OpenRouter`, `NVIDIA NIM`, `SambaNova`, `Cloudflare`, `Mistral`, `Cohere`, `OpenCode`, `HuggingFace`) with zero-downtime automatic 60s cooldown rotation.
- **🤖 Embedded Socratic AI Mentor:** Guides student doubts contextually without giving away direct answers.
- **🎨 Light Command Center Theme:** Styled with `#7C3AED` primary violet, Plus Jakarta Sans + Inter typography, 24px cards, and Lucide React icons.

---

## 🛠️ Architecture & Tech Stack

```text
Frontend (React 18 + Vite) ──► FastAPI Backend (:8008) ──► SQLite (skillforge.db WAL Mode)
                                          │
                                          ▼
                               Multi-Provider AI Engine
                           (12 Free AI Model Providers)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites & Environment Setup
- Python 3.10+
- Node.js 18+

Create a local `.env` file in the project root containing your free provider API keys:
```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1-...
CEREBRAS_API_KEY=csk-...
SAMBANOVA_API_KEY=cb0d...
NVIDIA_API_KEY=nvapi-...
# (Optional) GITHUB_TOKEN is inherited automatically from Windows User System Environment
```

### 2. Seed Database
```bash
python content/seed_topics.py
```
*Seeds all 34 subjects and 3,405 topics into `database/skillforge.db`.*

### 3. Start Backend Server (:8008)
```bash
pip install -r requirements.txt
python backend/main.py
```
*API health available at `http://localhost:8008/health`.*

### 4. Start Frontend UI (:5173)
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🧪 Running Integration Tests
```bash
python .gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/scratch/test_e2e_integration.py
```

---

## 📖 Blueprint Documentation
- 🧬 [Product Identity](file:///C:/Users/durga/.gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/product_identity.md)
- 🗺️ [UX Blueprint v1](file:///C:/Users/durga/.gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/ux_blueprint.md)
- 🎨 [Design System Specification v1.0](file:///C:/Users/durga/.gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/design_system_specification.md)
- 🛠️ [Technical Architecture Specification](file:///C:/Users/durga/.gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/technical_architecture_specification.md)
- ⚙️ [Engineering Blueprint](file:///C:/Users/durga/.gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/engineering_blueprint.md)
- 📖 [Product Bible](file:///C:/Users/durga/.gemini/antigravity-cli/brain/8f75c2fb-681c-42bd-8bb4-3c387ecdac3b/product_bible.md)
