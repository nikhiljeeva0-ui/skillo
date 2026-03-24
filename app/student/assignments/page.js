"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, CheckCircle, AlertCircle, Filter, Search, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import Loading from "@/components/Loading";

export default function StudentAssignments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const userId = localStorage.getItem("skillo_user_id") || "student_001";

      try {
        // 1. Fetch all assignments
        const { data: allAssignments, error: assignErr } = await supabase
          .from("assignments")
          .select("*")
          .order("created_at", { ascending: false });

        if (assignErr) throw assignErr;

        // 2. Fetch student's submissions to check status
        const { data: submissions, error: subErr } = await supabase
          .from("submissions")
          .select("assignment_id, status, ai_score")
          .eq("user_id", userId);

        if (subErr) throw subErr;

        const subMap = {};
        if (submissions) {
          submissions.forEach(s => {
            subMap[s.assignment_id] = s;
          });
        }

        const processed = (allAssignments || []).map(a => ({
          ...a,
          submission: subMap[a.id] || null,
          status: subMap[a.id] ? "submitted" : "pending"
        }));

        setAssignments(processed);
      } catch (e) {
        console.error("Failed to load assignments", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const subjects = ["all", ...new Set(assignments.map(a => a.subject))];

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                         a.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "all" || a.subject === subjectFilter;
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Group by subject for the "Subject Card" view
  const subjectGroups = {};
  assignments.forEach(a => {
    if (!subjectGroups[a.subject]) {
      subjectGroups[a.subject] = {
        name: a.subject,
        total: 0,
        pending: 0,
        submitted: 0,
        assignments: []
      };
    }
    subjectGroups[a.subject].total++;
    if (a.status === "pending") subjectGroups[a.subject].pending++;
    else subjectGroups[a.subject].submitted++;
    subjectGroups[a.subject].assignments.push(a);
  });

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 flex justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>My Assignments 📚</h1>
            <button onClick={() => router.push("/memory")} className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-wider flex items-center gap-1 mt-1"><Brain className="w-3.5 h-3.5" /> View Brain Map</button>
          </div>
          <div className="w-9" />
        </header>

        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..." 
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-[var(--accent)] outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {subjects.map(s => (
              <button 
                key={s} 
                onClick={() => setSubjectFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${subjectFilter === s ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Highlighted Subject Cards (if no active search/filter) */}
        {search === "" && subjectFilter === "all" && statusFilter === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 animate-fade-in-up">
            {Object.values(subjectGroups).map((group, i) => (
              <div 
                key={group.name} 
                className={`bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 stagger-${i+1}`}
              >
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 blur-2xl bg-[var(--accent)]`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${group.pending > 0 ? 'bg-[var(--red)]/10 text-[var(--red)]' : 'bg-[var(--green)]/10 text-[var(--green)]'}`}>
                    {group.pending > 0 ? `${group.pending} PENDING` : 'ALL DONE'}
                  </span>
                </div>
                <h3 className="text-xl font-bold capitalize mb-1" style={{fontFamily:"var(--font-heading)"}}>{group.name}</h3>
                <p className="text-xs text-[var(--muted)] mb-4">{group.total} assignments total</p>
                <div className="flex items-center gap-1.5 text-[var(--accent)] text-xs font-bold hover:gap-2 transition-all cursor-pointer" onClick={() => setSubjectFilter(group.name)}>
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assignment List */}
        <div className="space-y-4 animate-fade-in-up stagger-2">
          <h2 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            {subjectFilter !== "all" ? `${subjectFilter} Assignments` : "All Assignments"}
          </h2>
          
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <AlertCircle className="w-10 h-10 mx-auto text-[var(--muted)]/30 mb-3" />
              <p className="text-[var(--muted)]">No assignments found</p>
            </div>
          ) : (
            filtered.map((a, i) => (
              <div 
                key={a.id} 
                onClick={() => router.push(`/assignments/${a.id}`)}
                className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between hover:bg-[var(--surface2)] transition-all cursor-pointer group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${a.status === 'submitted' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                    {a.status === 'submitted' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-[var(--accent)] transition-colors">{a.title}</h3>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-[var(--muted)] capitalize">{a.subject}</span>
                      {a.due_date && (
                        <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due {new Date(a.due_date).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {a.submission ? (
                    <div className="text-center">
                      <p className="text-[var(--green)] font-black text-sm">{a.submission.ai_score}/{a.max_marks}</p>
                      <p className="text-[8px] text-[var(--muted)] uppercase font-bold">Graded</p>
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
