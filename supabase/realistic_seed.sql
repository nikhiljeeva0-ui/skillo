-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 SKILLO REALISTIC SEED DATA
-- Run this in your Supabase SQL Editor to populate the dashboards!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Create 10 Realistic Learner Models (Students)
INSERT INTO learner_models (user_id, model_json) VALUES 
('stu_001', '{"userId":"stu_001","profile":{"name":"Aarav Sharma","grade":9,"board":"CBSE"},"sessionStats":{"totalSessions":45,"streakDays":12,"lastSeen":"' || CURRENT_TIMESTAMP - interval '2 hours' || '"},"subjects":{"maths":{"topics":{"Algebra":{"status":"mastered","lastAttempted":"2026-03-20"},"Geometry":{"status":"shaky","commonErrors":["Area vs Perimeter confusion"]}}}}}'),
('stu_002', '{"userId":"stu_002","profile":{"name":"Diya Patel","grade":9,"board":"CBSE"},"sessionStats":{"totalSessions":12,"streakDays":2,"lastSeen":"' || CURRENT_TIMESTAMP - interval '1 day' || '"},"subjects":{"maths":{"topics":{"Algebra":{"status":"shaky","commonErrors":["Sign errors in equations"]},"Trigonometry":{"status":"mastered"}}}}}'),
('stu_003', '{"userId":"stu_003","profile":{"name":"Rohan Gupta","grade":9,"board":"CBSE"},"sessionStats":{"totalSessions":67,"streakDays":21,"lastSeen":"' || CURRENT_TIMESTAMP - interval '5 mins' || '"},"subjects":{"maths":{"topics":{"Geometry":{"status":"mastered"},"Statistics":{"status":"mastered"}}}}}'),
('stu_004', '{"userId":"stu_004","profile":{"name":"Priya Singh","grade":9,"board":"CBSE"},"sessionStats":{"totalSessions":5,"streakDays":0,"lastSeen":"' || CURRENT_TIMESTAMP - interval '6 days' || '"},"subjects":{"maths":{"topics":{"Calculus":{"status":"shaky","commonErrors":["Chain rule forgot"]}}}}}'),
('stu_005', '{"userId":"stu_005","profile":{"name":"Vikram Verma","grade":10,"board":"ICSE"},"sessionStats":{"totalSessions":31,"streakDays":7,"lastSeen":"' || CURRENT_TIMESTAMP - interval '1 hour' || '"},"subjects":{"maths":{"topics":{"Probability":{"status":"mastered"},"Algebra":{"status":"shaky"}}}}}'),
('stu_006', '{"userId":"stu_006","profile":{"name":"Neha Reddy","grade":10,"board":"ICSE"},"sessionStats":{"totalSessions":8,"streakDays":1,"lastSeen":"' || CURRENT_TIMESTAMP - interval '2 days' || '"},"subjects":{"maths":{"topics":{"Trigonometry":{"status":"shaky","commonErrors":["Identity mixups"]}}}}}'),
('stu_007', '{"userId":"stu_007","profile":{"name":"Aditya Kumar","grade":8,"board":"State"},"sessionStats":{"totalSessions":19,"streakDays":5,"lastSeen":"' || CURRENT_TIMESTAMP - interval '14 hours' || '"},"subjects":{"maths":{"topics":{"Fractions":{"status":"mastered"}}}}}'),
('stu_008', '{"userId":"stu_008","profile":{"name":"Ananya Krishnan","grade":9,"board":"CBSE"},"sessionStats":{"totalSessions":55,"streakDays":18,"lastSeen":"' || CURRENT_TIMESTAMP - interval '4 hours' || '"},"subjects":{"maths":{"topics":{"Algebra":{"status":"mastered"},"Geometry":{"status":"mastered"}}}}}');

-- 2. Create 3 Realistic Assignments
INSERT INTO assignments (id, institution_id, teacher_id, title, subject, grade, max_marks, questions, created_at) VALUES 
('assign_math_1', 'INST_001', 'teacher_001', 'Mid-Term Algebra Review', 'maths', 9, 30, '[{"text":"Solve for x: 2x + 5 = 15","type":"Short Answer","maxMarks":10,"answerKey":"x = 5"},{"text":"Explain what a polynomial is.","type":"Long Answer","maxMarks":20,"answerKey":"An expression consisting of variables and coefficients."}]', CURRENT_TIMESTAMP - interval '5 days'),
('assign_sci_1', 'INST_001', 'teacher_001', 'Physics: Laws of Motion Quiz', 'science', 9, 20, '[{"text":"What is Newton''s Second Law?","type":"Short Answer","maxMarks":10,"answerKey":"Force equals mass times acceleration (F=ma)."},{"text":"Unit of Force is?","type":"MCQ","options":["Joule","Newton","Watt","Pascal"],"maxMarks":10,"answerKey":"Newton"}]', CURRENT_TIMESTAMP - interval '2 days'),
('assign_hist_1', 'INST_001', 'teacher_001', 'History: The French Revolution', 'history', 9, 10, '[{"text":"In what year did the French Revolution begin?","type":"MCQ","options":["1789","1492","1914","1812"],"maxMarks":10,"answerKey":"1789"}]', CURRENT_TIMESTAMP - interval '1 hour');

-- 3. Create Realistic Submissions with varied scores and AI Feedback
INSERT INTO submissions (id, assignment_id, user_id, answers, ai_score, status, ai_feedback, submitted_at) VALUES 
-- Math Submissions
('sub_m_001', 'assign_math_1', 'stu_001', '{"0":"x = 5", "1":"Variables and numbers"}', 28, 'graded', '[{"is_correct":true,"questionText":"Solve for x..."}]', CURRENT_TIMESTAMP - interval '4 days'),
('sub_m_002', 'assign_math_1', 'stu_002', '{"0":"x = 10", "1":"I do not know"}', 5, 'graded', '[{"is_correct":false,"questionText":"Solve for x: 2x + 5 = 15","improvement_tip":"Remember to subtract 5 from both sides first!"}]', CURRENT_TIMESTAMP - interval '4 days'),
('sub_m_003', 'assign_math_1', 'stu_003', '{"0":"5", "1":"Expression with vars and coefs"}', 30, 'graded', '[{"is_correct":true}]', CURRENT_TIMESTAMP - interval '3 days'),
('sub_m_004', 'assign_math_1', 'stu_004', '{"0":"x = -5", "1":"Math equation"}', 8, 'graded', '[{"is_correct":false,"questionText":"Solve for x: 2x + 5 = 15","improvement_tip":"Check your sign convention."}]', CURRENT_TIMESTAMP - interval '3 days'),
('sub_m_005', 'assign_math_1', 'stu_008', '{"0":"x=5", "1":"A polynomial is an expression..."}', 30, 'graded', '[{"is_correct":true}]', CURRENT_TIMESTAMP - interval '3 days'),

-- Science Submissions
('sub_s_001', 'assign_sci_1', 'stu_001', '{"0":"F=ma", "1":"Newton"}', 20, 'graded', '[{"is_correct":true}]', CURRENT_TIMESTAMP - interval '1 day'),
('sub_s_002', 'assign_sci_1', 'stu_002', '{"0":"Gravity", "1":"Joule"}', 0, 'graded', '[{"is_correct":false,"questionText":"Unit of Force is?","improvement_tip":"Joule is for Energy. Force is Newton."}]', CURRENT_TIMESTAMP - interval '1 day'),
('sub_s_003', 'assign_sci_1', 'stu_003', '{"0":"F = m*a", "1":"Newton"}', 20, 'graded', '[{"is_correct":true}]', CURRENT_TIMESTAMP - interval '12 hours'),
('sub_s_004', 'assign_sci_1', 'stu_006', '{"0":"Action reaction", "1":"Newton"}', 10, 'graded', '[{"is_correct":false,"questionText":"What is Newton''s Second Law?","improvement_tip":"Action-reaction is the Third Law!"}]', CURRENT_TIMESTAMP - interval '5 hours');

-- 4. Create Leaderboard / Gamification Data
INSERT INTO student_points (user_id, total_points, weekly_points) VALUES 
('stu_003', 4500, 850),
('stu_008', 4100, 720),
('stu_001', 3200, 400),
('stu_007', 2800, 600),
('stu_005', 2100, 310),
('stu_002', 1200, 150),
('stu_006', 950, 50),
('stu_004', 300, 0);

