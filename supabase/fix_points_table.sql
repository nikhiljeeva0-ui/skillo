-- Update student_points table and implement high-scores view

ALTER TABLE student_points ADD COLUMN IF NOT EXISTS weekly_points INT DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS monthly_points INT DEFAULT 0;

-- Optional: Add better indexing for leaderboard performance
CREATE INDEX IF NOT EXISTS idx_student_points_total ON student_points (total_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_weekly ON student_points (weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_monthly ON student_points (monthly_points DESC);
