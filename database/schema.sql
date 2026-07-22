-- =====================================================================
-- CODEMPRESS DATABASE SCHEMA (SQLite)
-- All primary keys use AUTOINCREMENT _id
-- =====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    xp INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_active_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Topics Table (Seeded from curriculum.py & curriculum_cs_fundamentals.py)
CREATE TABLE IF NOT EXISTS topics (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    level TEXT CHECK(level IN ('Beginner', 'Intermediate', 'Pro')),
    description TEXT,
    theory_json TEXT, -- Cached Markdown prose + code examples JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_name, title)
);

-- 3. Questions Table (MCQs generated on demand)
CREATE TABLE IF NOT EXISTS questions (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    options_json TEXT NOT NULL, -- JSON array of 4 options
    correct_answer INTEGER NOT NULL, -- 0-indexed (0-3)
    explanation TEXT NOT NULL,
    FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE
);

-- 4. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    theory_read BOOLEAN DEFAULT 0,
    quizzes_taken INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    mastery_percent INTEGER DEFAULT 0, -- 30% theory read + 70% quiz score
    last_studied TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(_id) ON DELETE CASCADE,
    FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE,
    UNIQUE(user_id, topic_id)
);

-- 5. Quiz Attempt History Log
CREATE TABLE IF NOT EXISTS quiz_attempts (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    score_percent INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(_id) ON DELETE CASCADE,
    FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic ON quiz_attempts(user_id, topic_id);
