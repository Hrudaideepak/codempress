-- =====================================================================
-- CODEMPRESS SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Production-ready PostgreSQL schema with RLS security policies, triggers & indexes
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger Function for Updated Timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    google_sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    streak_count INT NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
    last_active_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Topics Table (Seeded curriculum)
CREATE TABLE IF NOT EXISTS public.topics (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    level TEXT CHECK(level IN ('Beginner', 'Intermediate', 'Pro')),
    description TEXT,
    theory_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_subject_title UNIQUE(subject_name, title)
);

-- 5. Questions Table (MCQs)
CREATE TABLE IF NOT EXISTS public.questions (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES public.topics(_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    options_json JSONB NOT NULL,
    correct_answer INT NOT NULL CHECK (correct_answer >= 0),
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES public.topics(_id) ON DELETE CASCADE,
    theory_read BOOLEAN NOT NULL DEFAULT FALSE,
    quizzes_taken INT NOT NULL DEFAULT 0 CHECK (quizzes_taken >= 0),
    quizzes_passed INT NOT NULL DEFAULT 0 CHECK (quizzes_passed >= 0),
    mastery_percent INT NOT NULL DEFAULT 0 CHECK (mastery_percent BETWEEN 0 AND 100),
    last_studied TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_topic UNIQUE(user_id, topic_id)
);

-- 7. Quiz Attempt History Log
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    _id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES public.topics(_id) ON DELETE CASCADE,
    score_percent INT NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
    xp_earned INT NOT NULL CHECK (xp_earned >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Automated Triggers for Updated Timestamps
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_topics_updated_at ON public.topics;
CREATE TRIGGER trg_topics_updated_at
    BEFORE UPDATE ON public.topics
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER trg_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 9. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON public.users(google_sub);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_name, _id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_topic ON public.user_progress(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic ON public.quiz_attempts(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_created ON public.quiz_attempts(user_id, created_at DESC);

-- 10. Grant API Access Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 11. Row Level Security (RLS) Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 11a. Catalog Read Policies (Public & Authenticated)
DROP POLICY IF EXISTS "Allow public read access on topics" ON public.topics;
CREATE POLICY "Allow public read access on topics"
    ON public.topics FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on questions" ON public.questions;
CREATE POLICY "Allow public read access on questions"
    ON public.questions FOR SELECT
    TO anon, authenticated
    USING (true);

-- 11b. Users Table RLS Policies
DROP POLICY IF EXISTS "Allow users to read their own record" ON public.users;
CREATE POLICY "Allow users to read their own record"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        google_sub = (select auth.jwt() ->> 'sub')
        OR _id::text = (select auth.uid()::text)
        OR google_sub = (select auth.uid()::text)
    );

DROP POLICY IF EXISTS "Allow users to update their own record" ON public.users;
CREATE POLICY "Allow users to update their own record"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        google_sub = (select auth.jwt() ->> 'sub')
        OR _id::text = (select auth.uid()::text)
        OR google_sub = (select auth.uid()::text)
    )
    WITH CHECK (
        google_sub = (select auth.jwt() ->> 'sub')
        OR _id::text = (select auth.uid()::text)
        OR google_sub = (select auth.uid()::text)
    );

DROP POLICY IF EXISTS "Allow users to insert their own record" ON public.users;
CREATE POLICY "Allow users to insert their own record"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (
        google_sub = (select auth.jwt() ->> 'sub')
        OR _id::text = (select auth.uid()::text)
        OR google_sub = (select auth.uid()::text)
    );

-- 11c. User Progress RLS Policies
DROP POLICY IF EXISTS "Allow users to read their own progress" ON public.user_progress;
CREATE POLICY "Allow users to read their own progress"
    ON public.user_progress FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT _id FROM public.users
            WHERE google_sub = (select auth.jwt() ->> 'sub')
            OR _id::text = (select auth.uid()::text)
            OR google_sub = (select auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Allow users to insert their own progress" ON public.user_progress;
CREATE POLICY "Allow users to insert their own progress"
    ON public.user_progress FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT _id FROM public.users
            WHERE google_sub = (select auth.jwt() ->> 'sub')
            OR _id::text = (select auth.uid()::text)
            OR google_sub = (select auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Allow users to update their own progress" ON public.user_progress;
CREATE POLICY "Allow users to update their own progress"
    ON public.user_progress FOR UPDATE
    TO authenticated
    USING (
        user_id IN (
            SELECT _id FROM public.users
            WHERE google_sub = (select auth.jwt() ->> 'sub')
            OR _id::text = (select auth.uid()::text)
            OR google_sub = (select auth.uid()::text)
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT _id FROM public.users
            WHERE google_sub = (select auth.jwt() ->> 'sub')
            OR _id::text = (select auth.uid()::text)
            OR google_sub = (select auth.uid()::text)
        )
    );

-- 11d. Quiz Attempts RLS Policies
DROP POLICY IF EXISTS "Allow users to read their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to read their own quiz attempts"
    ON public.quiz_attempts FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT _id FROM public.users
            WHERE google_sub = (select auth.jwt() ->> 'sub')
            OR _id::text = (select auth.uid()::text)
            OR google_sub = (select auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Allow users to insert their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to insert their own quiz attempts"
    ON public.quiz_attempts FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT _id FROM public.users
            WHERE google_sub = (select auth.jwt() ->> 'sub')
            OR _id::text = (select auth.uid()::text)
            OR google_sub = (select auth.uid()::text)
        )
    );

