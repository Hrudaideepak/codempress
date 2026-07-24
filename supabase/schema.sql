-- =====================================================================
-- CODEMPRESS SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Production-ready PostgreSQL schema with RLS security policies & indexes
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    google_sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    xp INT DEFAULT 0,
    streak_count INT DEFAULT 0,
    last_active_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Topics Table (Seeded curriculum)
CREATE TABLE IF NOT EXISTS public.topics (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    level TEXT CHECK(level IN ('Beginner', 'Intermediate', 'Pro')),
    description TEXT,
    theory_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_subject_title UNIQUE(subject_name, title)
);

-- 4. Questions Table (MCQs)
CREATE TABLE IF NOT EXISTS public.questions (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES public.topics(_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    options_json JSONB NOT NULL,
    correct_answer INT NOT NULL,
    explanation TEXT NOT NULL
);

-- 5. User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES public.topics(_id) ON DELETE CASCADE,
    theory_read BOOLEAN DEFAULT FALSE,
    quizzes_taken INT DEFAULT 0,
    quizzes_passed INT DEFAULT 0,
    mastery_percent INT DEFAULT 0,
    last_studied TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_topic UNIQUE(user_id, topic_id)
);

-- 6. Quiz Attempt History Log
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES public.topics(_id) ON DELETE CASCADE,
    score_percent INT NOT NULL,
    xp_earned INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic ON public.quiz_attempts(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_topic ON public.user_progress(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics(subject_name, _id);

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Read policies for public/authenticated catalog tables
CREATE POLICY "Public catalog topic access" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public catalog question access" ON public.questions FOR SELECT USING (true);

-- User data access policies
CREATE POLICY "User progress access" ON public.user_progress FOR ALL TO authenticated USING (true);
CREATE POLICY "Quiz attempts access" ON public.quiz_attempts FOR ALL TO authenticated USING (true);
CREATE POLICY "Users table access" ON public.users FOR ALL TO authenticated USING (true);
