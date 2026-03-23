-- EduCheck Tables for Skillo
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS assignments (
  id              TEXT PRIMARY KEY,
  institution_id  TEXT,
  teacher_id      TEXT,
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL,
  grade           INT,
  questions       JSONB NOT NULL,
  max_marks       INT DEFAULT 100,
  due_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id              TEXT PRIMARY KEY,
  assignment_id   TEXT REFERENCES assignments(id),
  user_id         TEXT,
  answers         JSONB NOT NULL,
  ai_score        INT,
  ai_feedback     JSONB,
  status          TEXT DEFAULT 'pending',
  submitted_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id              TEXT PRIMARY KEY,
  subject         TEXT,
  grade           INT,
  question        TEXT NOT NULL,
  correct_answer  TEXT NOT NULL,
  explanation     TEXT NOT NULL,
  date            DATE DEFAULT CURRENT_DATE,
  points          INT DEFAULT 10
);

CREATE TABLE IF NOT EXISTS student_points (
  user_id         TEXT PRIMARY KEY,
  total_points    INT DEFAULT 0,
  streak_days     INT DEFAULT 0,
  last_challenge  DATE,
  badges          JSONB DEFAULT '[]'
);

-- Seed some daily challenges
INSERT INTO daily_challenges VALUES
('dc_001', 'maths', 9,
 'A triangle has angles 60° and 70°. What is the third angle?',
 '50°',
 'Triangle ke teeno angles ka sum 180° hota hai. 180 - 60 - 70 = 50°',
 CURRENT_DATE, 10),
('dc_002', 'maths', 9,
 'What is the value of x if 2x + 5 = 15?',
 'x = 5',
 '2x = 15 - 5 = 10, isliye x = 10/2 = 5',
 CURRENT_DATE + 1, 10)
ON CONFLICT (id) DO NOTHING;
