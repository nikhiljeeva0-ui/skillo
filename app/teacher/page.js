"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, AlertTriangle, FileText, MessageSquare, X } from "lucide-react";
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
    <div className="flex gap-4 text-[14px] mb-8 pb-4 border-b border-[#2a2824] items-center">
      <a href="/teacher" className={active === 'students' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-gray-300'}>Students</a>
      <span className="text-gray-600">|</span>
      <a href="/teacher/reports" className={active === 'reports' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-gray-300'}>Reports</a>
      <span className="text-gray-600">|</span>
      <button onClick={handleShare} className="text-gray-400 hover:text-gray-300 text-left">Share App</button>
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
        <TeacherHeader active="students" />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-gray-400 mt-2">Live Student Progress Tracking</p>
        </header>

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
