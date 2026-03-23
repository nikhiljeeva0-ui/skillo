"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/learnerModel";
import { FileText, Copy, X } from "lucide-react";
import { TeacherHeader } from "../page";

export default function TeacherReports() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [activeStudentName, setActiveStudentName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from("learner_models").select("model_json");
      if (data) {
        setStudents(data.map(d => ({
          id: d.model_json.userId || "student_001",
          name: d.model_json.profile?.name || "Unknown",
          grade: d.model_json.profile?.grade || "?"
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleGenerate = async (id, name) => {
    setActiveStudentName(name);
    setReportContent("Generating report...");
    setCopied(false);
    setModalOpen(true);
    
    try {
      const res = await fetch(`/api/report?userId=${id}`);
      if (!res.ok) throw new Error("Failed to generate report");
      const text = await res.text();
      setReportContent(text);
    } catch (e) {
      setReportContent("Error generating report. Please check the network.");
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
      <div className="max-w-5xl mx-auto relative">
        <TeacherHeader active="reports" />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">All Student Reports</h1>
        </header>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin"></div></div>
        ) : students.length === 0 ? (
          <div className="text-center p-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <h2 className="text-xl font-medium mb-2">No students yet.</h2>
            <p className="text-[var(--muted)]">Share the app link with students to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {students.map(s => (
              <div key={s.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  <p className="text-sm text-[var(--muted)]">Class {s.grade}</p>
                </div>
                <button 
                  onClick={() => handleGenerate(s.id, s.name)}
                  className="bg-[var(--border)] hover:bg-[var(--border)] text-[var(--accent)] px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4"/> Generate Report
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface2)]">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent)]" />
                {activeStudentName}&apos;s Report
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[var(--muted)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-[var(--bg)] whitespace-pre-wrap leading-relaxed">
              {reportContent}
            </div>
            {reportContent !== "Generating report..." && !reportContent.startsWith("Error") && (
              <div className="p-4 border-t border-[var(--border)] bg-[var(--surface2)]">
                <button 
                  onClick={copyReport}
                  className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {copied ? "Copied to Clipboard!" : <><Copy className="w-4 h-4"/> Copy for WhatsApp</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
