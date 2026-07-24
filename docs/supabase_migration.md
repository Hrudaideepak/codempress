# Supabase Database Integration & Migration Guide for Codempress

## Overview

Codempress uses a production-ready database architecture supporting dual operational modes:
1. **SQLite (Offline-First Local / Embedded)** — Zero setup required for local development.
2. **Supabase (PostgreSQL Cloud / Production)** — Enterprise relational backend with Row-Level Security (RLS), auto-updating triggers, optimized indexes, and REST/GraphQL API generation.

---

## 1. PostgreSQL Schema Architecture (`supabase/schema.sql`)

The Supabase schema converts SQLite entities to high-performance PostgreSQL tables:

### Core Tables & Types
- **`public.users`**: User identity, XP, streak count, and timestamps.
  - Primary Key: `_id BIGINT GENERATED ALWAYS AS IDENTITY`
  - Unique Index: `google_sub`
  - Constraints: `xp >= 0`, `streak_count >= 0`
- **`public.topics`**: Curriculum catalog with embedded JSONB theory.
  - Primary Key: `_id BIGINT GENERATED ALWAYS AS IDENTITY`
  - Unique Constraint: `(subject_name, title)`
- **`public.questions`**: Quiz questions linked per topic with JSONB options.
  - Primary Key: `_id BIGINT GENERATED ALWAYS AS IDENTITY`
  - Foreign Key: `topic_id REFERENCES public.topics(_id) ON DELETE CASCADE`
- **`public.user_progress`**: Per-user topic mastery and reading status.
  - Primary Key: `_id BIGINT GENERATED ALWAYS AS IDENTITY`
  - Foreign Keys: `user_id`, `topic_id`
  - Unique Constraint: `(user_id, topic_id)`
  - Constraints: `mastery_percent BETWEEN 0 AND 100`
- **`public.quiz_attempts`**: Historical audit log of all completed quizzes.
  - Primary Key: `_id BIGINT GENERATED ALWAYS AS IDENTITY`
  - Foreign Keys: `user_id`, `topic_id`

---

## 2. Row Level Security (RLS) & Security Policies

All 5 public tables have **Row Level Security enabled**:

1. **Catalog Tables (`topics`, `questions`)**:
   - `SELECT`: Open to `anon` and `authenticated` roles (`USING (true)`).
   - `INSERT/UPDATE/DELETE`: Restricted to database administrator or `service_role`.

2. **User Data Tables (`users`, `user_progress`, `quiz_attempts`)**:
   - RLS policies filter rows by verifying token claims:
     `google_sub = (select auth.jwt() ->> 'sub') OR _id::text = (select auth.uid()::text)`
   - All `UPDATE` policies enforce both `USING` and `WITH CHECK` clauses to prevent unauthorized ownership reassignment.
   - `auth.uid()` calls are wrapped inside subqueries `(select auth.uid())` for query execution optimization.

---

## 3. Performance Indexes & Triggers

### Performance Indexes
- `idx_users_google_sub` ON `public.users(google_sub)`
- `idx_topics_subject_id` ON `public.topics(subject_name, _id)`
- `idx_questions_topic_id` ON `public.questions(topic_id)`
- `idx_user_progress_user_topic` ON `public.user_progress(user_id, topic_id)`
- `idx_quiz_attempts_user_topic` ON `public.quiz_attempts(user_id, topic_id)`
- `idx_quiz_attempts_user_created` ON `public.quiz_attempts(user_id, created_at DESC)`

### Automated Triggers
- `trg_users_updated_at` (updates `updated_at` timestamp on UPDATE)
- `trg_topics_updated_at` (updates `updated_at` timestamp on UPDATE)
- `trg_user_progress_updated_at` (updates `updated_at` timestamp on UPDATE)

---

## 4. Setup & Deployment Steps

### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://database.new) and create a project.
2. Retrieve your **Project URL**, **Anon Key**, **Service Role Key**, and **Postgres Connection URI**.

### Step 2: Run Database Migration
Execute `supabase/schema.sql` on your Supabase instance:
- **Option A (Supabase Dashboard)**: Paste `supabase/schema.sql` into **SQL Editor** and click **Run**.
- **Option B (Supabase CLI)**:
  ```bash
  supabase db push
  # or execute via psql:
  psql "<POSTGRES_URL>" -f supabase/schema.sql
  ```

### Step 3: Configure Environment Variables

**Backend (`backend/.env` or shell env):**
```env
USE_SUPABASE=true
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
POSTGRES_URL=postgresql://postgres.<project-id>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 4: Verification & Seeding
1. Backend client SDK verification:
   Import `get_supabase_client()` from `backend.infrastructure.database.supabase_client` to test connection.
2. Frontend client verification:
   Import `supabase` or `fetchTopicsFromSupabase()` from `frontend/src/services/supabaseClient.ts`.
3. Verify RLS access using Supabase Dashboard or test JWT requests.
