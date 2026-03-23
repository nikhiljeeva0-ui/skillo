"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, AlertTriangle, FileText, MessageSquare, X, Plus, BarChart3, ClipboardList, Users } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const statusColors = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

export function TeacherHeader({ active }) {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex gap-4 text-[14px] mb-8 pb-4 border-b border-[#2a2824] items-center flex-wrap">
      <a href="/teacher" className={active === 'students' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-gray-300'}>Students</a>
      <span className="text-gray-600">|</span>
      <a href="/teacher/reports" className={active === 'reports' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-gray-300'}>Reports</a>
      <span className="text-gray-600">|</span>
      <a href="/teacher?tab=assignments" className={active === 'assignments' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-gray-300'}>Assignments</a>
      <span className="text-gray-600">|</span>
      <a href="/teacher?tab=analytics" className={active === 'analytics' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-gray-300'}>Analytics</a>
      <span className="text-gray-600">|</span>
      <button onClick={handleShare} className="text-gray-400 hover:text-gray-300 text-left">Share App</button>
    </div>
  );
}

function AssignmentsTab() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    async function fetchAssignments() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data: assignData } = await supabase
          .from("assignments")
          .select("*")
          .order("created_at", { ascending: false });

        if (assignData) {
          // Count submissions for each
          const withCounts = await Promise.all(assignData.map(async (a) => {
            const { count } = await supabase
              .from("submissions")
              .select("*", { count: "exact", head: true })
              .eq("assignment_id", a.id);

            const { data: subs } = await supabase
              .from("submissions")
              .select("ai_score")
              .eq("assignment_id", a.id);

            const avgScore = subs && subs.length > 0
              ? Math.round(subs.reduce((sum, s) => sum + (s.ai_score || 0), 0) / subs.length)
              : 0;

            return { ...a, submissionCount: count || 0, avgScore };
          }));
          setAssignments(withCounts);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchAssignments();
  }, []);

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionsLoading(true);
    try {
      const { data } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignment.id)
        .order("submitted_at", { ascending: false });

      if (data) {
        // Get student names
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: models } = await supabase
          .from("learner_models")
          .select("user_id, model_json")
          .in("user_id", userIds);

        const nameMap = {};
        if (models) models.forEach(m => { nameMap[m.user_id] = m.model_json?.profile?.name || m.user_id; });

        setSubmissions(data.map(s => ({
          ...s,
          studentName: nameMap[s.user_id] || s.user_id
        })));
      }
    } catch (e) {
      console.error(e);
    }
    setSubmissionsLoading(false);
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading assignments...</div>;

  if (selectedAssignment) {
    return (
      <div>
        <button onClick={() => setSelectedAssignment(null)} className="text-[#c9a84c] text-sm mb-4 hover:underline">← Back to assignments</button>
        <h2 className="text-xl font-bold mb-2">{selectedAssignment.title}</h2>
        <p className="text-gray-400 text-sm mb-6">{selectedAssignment.subject} • Class {selectedAssignment.grade} • Avg: {selectedAssignment.avgScore}/{selectedAssignment.max_marks}</p>

        {submissionsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 bg-[#181714] border border-[#2a2824] rounded-2xl">
            <p className="text-gray-400">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-[#181714] border border-[#2a2824] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{sub.studentName}</p>
                  <p className="text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${sub.ai_score >= selectedAssignment.max_marks * 0.6 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sub.ai_score}/{selectedAssignment.max_marks}
                  </p>
                  <p className={`text-xs ${sub.status === 'graded' ? 'text-emerald-400' : 'text-gray-500'}`}>{sub.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Assignments</h2>
        <a href="/teacher/assignments" className="flex items-center gap-1.5 bg-[#c9a84c] text-[#0f0e0d] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#b8973b] transition-colors active:scale-95">
          <Plus className="w-4 h-4" /> Create Assignment
        </a>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-[#181714] border border-[#2a2824] rounded-2xl">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-lg mb-2">No assignments yet</p>
          <p className="text-gray-400 text-sm mb-4">Create your first assignment to get started.</p>
          <a href="/teacher/assignments" className="inline-flex items-center gap-1.5 bg-[#c9a84c] text-[#0f0e0d] px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#b8973b] transition-colors">
            <Plus className="w-4 h-4" /> Create Assignment
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <button
              key={a.id}
              onClick={() => viewSubmissions(a)}
              className="w-full bg-[#181714] border border-[#2a2824] rounded-xl p-5 text-left hover:border-[#3a3834] transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-xs bg-[#2a2824] px-2 py-1 rounded-full text-gray-400">{a.subject}</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>Class {a.grade}</span>
                <span>{a.submissionCount} submissions</span>
                <span>Avg: {a.avgScore}/{a.max_marks}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!supabase) { setLoading(false); return; }
      try {
        // Fetch assignments and submissions
        const { data: assignments } = await supabase.from("assignments").select("*");
        const { data: submissions } = await supabase.from("submissions").select("*");

        if (assignments && submissions) {
          // Per subject average
          const subjectScores = {};
          assignments.forEach(a => {
            const subs = submissions.filter(s => s.assignment_id === a.id);
            if (subs.length > 0) {
              const avg = Math.round(subs.reduce((sum, s) => sum + (s.ai_score || 0), 0) / subs.length);
              if (!subjectScores[a.subject]) subjectScores[a.subject] = [];
              subjectScores[a.subject].push(avg);
            }
          });

          const subjectAvg = Object.entries(subjectScores).map(([subject, scores]) => ({
            subject,
            avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          }));

          // Most missed questions
          const missedQuestions = [];
          submissions.forEach(sub => {
            if (sub.ai_feedback && Array.isArray(sub.ai_feedback)) {
              sub.ai_feedback.forEach(f => {
                if (!f.is_correct) {
                  missedQuestions.push(f.questionText);
                }
              });
            }
          });

          const missedCounts = {};
          missedQuestions.forEach(q => {
            if (q) missedCounts[q] = (missedCounts[q] || 0) + 1;
          });
          const topMissed = Object.entries(missedCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([q, count]) => ({ question: q, count }));

          // Students needing attention (lowest scores)
          const studentScores = {};
          submissions.forEach(sub => {
            if (!studentScores[sub.user_id]) studentScores[sub.user_id] = { total: 0, count: 0 };
            studentScores[sub.user_id].total += sub.ai_score || 0;
            studentScores[sub.user_id].count += 1;
          });

          const { data: models } = await supabase.from("learner_models").select("user_id, model_json");
          const nameMap = {};
          if (models) models.forEach(m => { nameMap[m.user_id] = m.model_json?.profile?.name || m.user_id; });

          const needAttention = Object.entries(studentScores)
            .map(([id, s]) => ({ id, name: nameMap[id] || id, avg: Math.round(s.total / s.count) }))
            .filter(s => s.avg < 50)
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 5);

          // Weekly progress (last 7 days submission count)
          const weeklyData = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const count = submissions.filter(s => s.submitted_at && s.submitted_at.startsWith(dateStr)).length;
            weeklyData.push({ day: dayName, count });
          }

          setAnalyticsData({ subjectAvg, topMissed, needAttention, weeklyData });
        }
      } catch (e) {
        console.error("Analytics error:", e);
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading analytics...</div>;

  if (!analyticsData) return <div className="text-center py-8 text-gray-500">No data yet</div>;

  const maxWeeklyCount = Math.max(...analyticsData.weeklyData.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#c9a84c]" /> Analytics</h2>

      {/* Subject averages */}
      <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-gray-300">Class Average per Subject</h3>
        {analyticsData.subjectAvg.length === 0 ? (
          <p className="text-gray-500 text-sm">No graded submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {analyticsData.subjectAvg.map(s => (
              <div key={s.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300 capitalize">{s.subject}</span>
                  <span className={`font-medium ${s.avg >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{s.avg}%</span>
                </div>
                <div className="h-3 bg-[#0f0e0d] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${s.avg >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${s.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly progress chart */}
      <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-gray-300">Weekly Submissions</h3>
        <div className="flex items-end gap-2 h-32">
          {analyticsData.weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{d.count}</span>
              <div className="w-full rounded-t-md bg-[#c9a84c] transition-all duration-300" style={{ height: `${Math.max((d.count / maxWeeklyCount) * 100, 4)}%`, minHeight: '4px' }} />
              <span className="text-xs text-gray-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most missed questions */}
      <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-gray-300">Most Missed Questions</h3>
        {analyticsData.topMissed.length === 0 ? (
          <p className="text-gray-500 text-sm">No missed questions yet.</p>
        ) : (
          <div className="space-y-2">
            {analyticsData.topMissed.map((q, i) => (
              <div key={i} className="flex items-start gap-3 text-sm p-3 bg-[#0f0e0d] rounded-xl border border-[#2a2824]">
                <span className="text-red-400 font-bold">{q.count}×</span>
                <span className="text-gray-300 line-clamp-2">{q.question}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Students needing attention */}
      <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-gray-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Students Needing Attention
        </h3>
        {analyticsData.needAttention.length === 0 ? (
          <p className="text-gray-500 text-sm">All students are doing well! 🎉</p>
        ) : (
          <div className="space-y-2">
            {analyticsData.needAttention.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-[#0f0e0d] rounded-xl border border-[#2a2824]">
                <span className="text-gray-300">{s.name}</span>
                <span className="text-red-400 font-medium">Avg: {s.avg}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [activeStudentName, setActiveStudentName] = useState("");
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    // Check URL params for tab
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: supaErr } = await supabase
          .from("learner_models")
          .select("model_json");

        if (supaErr) throw supaErr;
        
        if (data) {
          const parsed = data.map(item => {
            const m = item.model_json;
          
          const lastSeenStr = m.sessionStats?.lastSeen;
          let status = "red";
          let daysAgo = 999;
          
          if (lastSeenStr) {
            const lastSeenDate = new Date(lastSeenStr);
            const today = new Date();
            const diffTime = Math.abs(today - lastSeenDate);
            daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysAgo === 0) status = "green";
            else if (daysAgo <= 3) status = "amber";
            else status = "red";
          }

          let lastSeenText = "Never";
          if (daysAgo === 0) lastSeenText = "Today";
          else if (daysAgo === 1) lastSeenText = "Yesterday";
          else if (daysAgo < 999) lastSeenText = `${daysAgo} days ago`;

          const mathTopics = m.subjects?.maths?.topics || {};
          const weakTopics = Object.entries(mathTopics)
            .filter(([_, d]) => d.status === "shaky")
            .map(([topic]) => topic);
            
          const errors = Object.values(mathTopics)
            .filter(d => d.status === "shaky" && d.commonErrors?.length > 0)
            .flatMap(d => d.commonErrors);

          return {
            id: m.userId || "student_001",
            name: m.profile?.name || "Unknown",
            grade: m.profile?.grade || "?",
            streak: m.sessionStats?.streakDays || 0,
            lastSeen: lastSeenText,
            status,
            weak: weakTopics,
            errors: errors.length > 0 ? errors.join(", ") : "None recorded yet.",
          };
        });
        setStudents(parsed);
      }
      } catch (e) {
        console.error(e);
        setError(true);
      }
      setLoading(false);
    }
    fetchStudents();
  }, []);

  const openHistory = (studentId, studentName) => {
    setActiveStudentName(studentName);
    const hist = localStorage.getItem("skillo_chat_history_" + studentId);
    if (hist) {
      try {
        const parsed = JSON.parse(hist);
        setSelectedHistory(parsed.slice(-10)); // Last 10 messages
      } catch(e) {
        setSelectedHistory([]);
      }
    } else {
      setSelectedHistory([]);
    }
    setModalOpen(true);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4">Dashboard load nahi hua. Refresh karo.</p>
      <button onClick={() => window.location.reload()} className="bg-[#c9a84c] text-[#0f0e0d] px-6 py-2 rounded-full font-bold">Refresh</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] p-4 md:p-8">
      <div className="max-w-5xl mx-auto relative">
        <TeacherHeader active={activeTab} />
        
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-gray-400 mt-2">Live Student Progress Tracking</p>
          </div>
          <a href="/teacher/assignments" className="flex items-center gap-1.5 bg-[#c9a84c] text-[#0f0e0d] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#b8973b] transition-colors active:scale-95">
            <Plus className="w-4 h-4" /> Create Assignment
          </a>
        </header>

        {/* Tab content switcher */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "students", icon: Users, label: "Students" },
            { key: "assignments", icon: ClipboardList, label: "Assignments" },
            { key: "analytics", icon: BarChart3, label: "Analytics" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#c9a84c] text-[#0f0e0d]'
                  : 'bg-[#181714] text-gray-400 border border-[#2a2824] hover:border-[#3a3834]'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Assignments Tab */}
        {activeTab === "assignments" && <AssignmentsTab />}

        {/* Analytics Tab */}
        {activeTab === "analytics" && <AnalyticsTab />}

        {/* Students Tab (original) */}
        {activeTab === "students" && (
          <>
            {students.length === 0 ? (
              <div className="text-center p-12 bg-[#181714] border border-[#2a2824] rounded-2xl">
                <h2 className="text-xl font-medium mb-2">No students yet.</h2>
                <p className="text-gray-400">Share the app link with students to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <div key={student.id} className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6 relative overflow-hidden group hover:border-[#3a3834] transition-colors flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          {student.name}
                          <span className={`w-2.5 h-2.5 rounded-full ${statusColors[student.status]} shadow-[0_0_8px_currentColor] opacity-80`} />
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Grade {student.grade}</p>
                      </div>
                      <div className="bg-[#1f1e1a] px-3 py-1 rounded-full text-sm font-medium text-[#c9a84c] flex items-center gap-1">
                        🔥 {student.streak}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                      <Clock className="w-4 h-4" /> Last seen: {student.lastSeen}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#2a2824] mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Shaky Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {student.weak.length > 0 ? student.weak.map(t => (
                            <span key={t} className="text-xs bg-[#2a2824] px-2.5 py-1 rounded-md text-gray-300">
                              {t}
                            </span>
                          )) : <span className="text-sm text-gray-500 font-normal">None</span>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <TrendingUp className="w-4 h-4 text-blue-400" /> Recent Pattern
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {student.errors}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-auto flex flex-col gap-2 pt-2">
                      <button 
                        onClick={() => window.open(`/report?userId=${student.id}`, '_blank')}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2a2824] hover:bg-[#3a3834] rounded-lg text-sm font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4" /> View Report
                      </button>
                      <button 
                        onClick={() => openHistory(student.id, student.name)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1f1e1a] hover:bg-[#2a2824] text-[#c9a84c] rounded-lg text-sm font-medium transition-colors border border-[#3a3834]"
                      >
                        <MessageSquare className="w-4 h-4" /> View Chat History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat History Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181714] border border-[#3a3834] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2a2824] flex justify-between items-center bg-[#1f1e1a]">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c9a84c]" />
                {activeStudentName}&apos;s Recent Chat
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[#0f0e0d]">
              {selectedHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No chat history yet</p>
              ) : (
                selectedHistory.map((m, i) => (
                  <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#c9a84c] text-[#0f0e0d] rounded-tr-sm" : "bg-[#1f1e1a] text-[#e8e2d9] border border-[#2a2824] rounded-tl-sm whitespace-pre-wrap"}`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
