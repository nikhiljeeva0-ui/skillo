require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  console.log("Seeding Database...");

  // 1. Students
  const students = [
    { user_id: 'stu_001', model_json: { userId: "stu_001", profile: { name: "Aarav Sharma", grade: 9, board: "CBSE" }, sessionStats: { totalSessions: 45, streakDays: 12, lastSeen: new Date().toISOString() }, subjects: { maths: { topics: { Algebra: { status: "mastered" }, Geometry: { status: "shaky" } } } } } },
    { user_id: 'stu_002', model_json: { userId: "stu_002", profile: { name: "Diya Patel", grade: 9, board: "CBSE" }, sessionStats: { totalSessions: 12, streakDays: 2, lastSeen: new Date(Date.now() - 86400000).toISOString() }, subjects: { maths: { topics: { Algebra: { status: "shaky" }, Trigonometry: { status: "mastered" } } } } } },
    { user_id: 'stu_003', model_json: { userId: "stu_003", profile: { name: "Rohan Gupta", grade: 9, board: "CBSE" }, sessionStats: { totalSessions: 67, streakDays: 21, lastSeen: new Date().toISOString() }, subjects: { maths: { topics: { Geometry: { status: "mastered" } } } } } },
    { user_id: 'stu_004', model_json: { userId: "stu_004", profile: { name: "Priya Singh", grade: 9, board: "CBSE" }, sessionStats: { totalSessions: 5, streakDays: 0, lastSeen: new Date(Date.now() - 500000000).toISOString() }, subjects: { maths: { topics: { Calculus: { status: "shaky" } } } } } },
    { user_id: 'stu_005', model_json: { userId: "stu_005", profile: { name: "Vikram Verma", grade: 10, board: "ICSE" }, sessionStats: { totalSessions: 31, streakDays: 7, lastSeen: new Date().toISOString() }, subjects: { maths: { topics: { Probability: { status: "mastered" }, Algebra: { status: "shaky" } } } } } }
  ];

  for (const stu of students) {
    const { error } = await supabase.from('learner_models').upsert(stu);
    if (error) console.error("Error adding student:", error);
  }

  // 2. Assignments
  const assignments = [
    {
      id: "assign_math_1",
      institution_id: "INST_001",
      teacher_id: "teacher_001",
      title: "Mid-Term Algebra Review",
      subject: "maths",
      grade: 9,
      max_marks: 30,
      questions: [{ text: "Solve for x: 2x + 5 = 15", type: "Short Answer", maxMarks: 10, answerKey: "x = 5" }],
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: "assign_sci_1",
      institution_id: "INST_001",
      teacher_id: "teacher_001",
      title: "Physics: Laws of Motion Quiz",
      subject: "science",
      grade: 9,
      max_marks: 20,
      questions: [{ text: "What is Newton's Second Law?", type: "Short Answer", maxMarks: 10, answerKey: "F=ma" }],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  for (const asgn of assignments) {
    const { error } = await supabase.from('assignments').upsert(asgn);
    if (error) console.error("Error adding assignment:", error);
  }

  // 3. Submissions
  const submissions = [
    { id: "sub_m_001", assignment_id: "assign_math_1", user_id: "stu_001", answers: { 0: "x = 5" }, ai_score: 28, status: "graded", ai_feedback: [{ is_correct: true, questionText: "Solve for x..." }], submitted_at: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: "sub_m_002", assignment_id: "assign_math_1", user_id: "stu_002", answers: { 0: "x = 10" }, ai_score: 5, status: "graded", ai_feedback: [{ is_correct: false, questionText: "Solve for x", improvement_tip: "Subtract 5 first!" }], submitted_at: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: "sub_s_001", assignment_id: "assign_sci_1", user_id: "stu_003", answers: { 0: "F=ma" }, ai_score: 20, status: "graded", ai_feedback: [{ is_correct: true }], submitted_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "sub_s_002", assignment_id: "assign_sci_1", user_id: "stu_002", answers: { 0: "Gravity" }, ai_score: 0, status: "graded", ai_feedback: [{ is_correct: false, improvement_tip: "Think about mass and acceleration" }], submitted_at: new Date(Date.now() - 86400000).toISOString() }
  ];

  for (const sub of submissions) {
    const { error } = await supabase.from('submissions').upsert(sub);
    if (error) console.error("Error adding submission:", error);
  }

  // 4. Points
  const points = [
    { user_id: "stu_003", total_points: 4500, weekly_points: 850 },
    { user_id: "stu_001", total_points: 3200, weekly_points: 400 },
    { user_id: "stu_005", total_points: 2100, weekly_points: 310 },
    { user_id: "stu_002", total_points: 1200, weekly_points: 150 },
    { user_id: "stu_004", total_points: 300, weekly_points: 0 }
  ];

  for (const p of points) {
    const { error } = await supabase.from('student_points').upsert(p);
    if (error) console.error("Error adding points:", error);
  }

  console.log("✅ Application fully seeded with realistic active data!");
}

seed();
