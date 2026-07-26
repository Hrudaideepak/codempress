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
CREATE INDEX IF NOT EXISTS idx_topics_subject_name ON topics(subject_name);
CREATE INDEX IF NOT EXISTS idx_topics_level ON topics(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_topic ON user_progress(user_id, topic_id);

-- 6b. User Enrollments Table (Explicit user enrollment in Roadmaps & Subjects)
CREATE TABLE IF NOT EXISTS user_enrollments (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL CHECK(item_type IN ('roadmap', 'subject')),
    item_id TEXT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(_id) ON DELETE CASCADE,
    UNIQUE(user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user ON user_enrollments(user_id);

-- =====================================================================
-- MASTER TOPIC DATABASE (MTD) & CONTENT PRODUCTION SCHEMA
-- =====================================================================

-- 7. Topic Prerequisites Graph
CREATE TABLE IF NOT EXISTS topic_prerequisites (
    topic_id INTEGER NOT NULL,
    prerequisite_topic_id INTEGER NOT NULL,
    dependency_type TEXT CHECK(dependency_type IN ('required', 'recommended', 'related')),
    PRIMARY KEY (topic_id, prerequisite_topic_id),
    FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE,
    FOREIGN KEY(prerequisite_topic_id) REFERENCES topics(_id) ON DELETE CASCADE
);

-- 8. Project Library (Micro, Module, Capstone Projects)
CREATE TABLE IF NOT EXISTS projects (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id_code TEXT UNIQUE NOT NULL, -- P-0001
    title TEXT NOT NULL,
    project_type TEXT CHECK(project_type IN ('micro_project', 'module_project', 'career_capstone', 'path_capstone')),
    difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    estimated_hours INTEGER DEFAULT 4,
    spec_markdown TEXT NOT NULL,
    rubric_json TEXT,
    starter_code TEXT,
    solution_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Assessment Library
CREATE TABLE IF NOT EXISTS assessments (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id_code TEXT UNIQUE NOT NULL, -- A-0001
    topic_id INTEGER NOT NULL,
    assessment_type TEXT CHECK(assessment_type IN ('knowledge_check', 'concept_check', 'skill_check', 'debugging_task', 'design_exercise')),
    questions_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE
);

-- 10. AI Mentor Misconception Database
CREATE TABLE IF NOT EXISTS misconceptions (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    misconception_text TEXT NOT NULL,
    reality_text TEXT NOT NULL,
    analogy TEXT,
    FOREIGN KEY(topic_id) REFERENCES topics(_id) ON DELETE CASCADE
);

