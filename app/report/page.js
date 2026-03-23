"use client";

import { useState, useEffect } from "react";
import { Share2, Check, ArrowLeft, Brain, BookOpen, Flame, Star, Lightbulb, TrendingUp, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildReport } from "@/lib/reportBuilder";
import Loading from "@/components/Loading";

function MemorySummary({ model }) {
  if (!model) return null;

  const sessions = model.sessionStats?.totalSessions || 0;
  const streak = model.sessionStats?.streakDays || 0;
  const topics = model.subjects?.maths?.topics || {};
  const mastered = Object.entries(topics).filter(([_,v])=>v.status==='mastered').map(([k])=>k);
  const shaky = Object.entries(topics).filter(([_,v])=>v.status==='shaky').map(([k,v])=>({topic:k,errors:v.commonErrors||[]}));
  const confidenceDates = Object.keys(model.signals?.confidence||{}).sort();
  const firstDate = confidenceDates.length > 0 ? confidenceDates[0] : null;
  const daysSinceStart = firstDate ? Math.floor((new Date() - new Date(firstDate))/(1000*60*60*24)) + 1 : sessions > 0 ? 1 : 0;

  const styles = [];
  if (model.learningStyle?.prefersAnalogy) styles.push("Analogy lover 🎯");
  if (model.learningStyle?.prefersVisual) styles.push("Step-by-step learner 📐");
  if (styles.length === 0) styles.push("Still learning your style 🔍");

  const totalTopics = Object.keys(topics).length;
  const masteryPct = totalTopics > 0 ? Math.round((mastered.length / totalTopics) * 100) : 0;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden mb-6 animate-fade-in-up stagger-1">
      <div className="bg-gradient-to-r from-[var(--accent)]/15 to-[var(--accent2)]/5 px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-extrabold flex items-center gap-2 text-[var(--accent)]" style={{fontFamily:"var(--font-heading)"}}>
          <Brain className="w-5 h-5" /> What Skillo remembers about you
        </h2>
        <p className="text-xs text-[var(--muted)] mt-1">No other AI tutor does this.</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: sessions, label: "Sessions", icon: TrendingUp, color: "text-[var(--accent)]" },
            { val: streak, label: "Streak", icon: Flame, color: "text-[var(--accent2)]" },
            { val: daysSinceStart, label: "Days", icon: Award, color: "text-[var(--green)]" }
          ].map((s,i) => (
            <div key={i} className="bg-[var(--bg)] rounded-xl p-3 text-center border border-[var(--border)]">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>{s.val}</p>
              <p className="text-[10px] text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-[var(--muted)] text-center">
          Skillo has known you for <span className="text-[var(--text)] font-medium">{sessions} sessions</span> over <span className="text-[var(--text)] font-medium">{daysSinceStart} days</span>
        </p>

        {/* Mastery ring */}
        {totalTopics > 0 && (
          <div className="flex items-center justify-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--green)" strokeWidth="2.5"
                  strokeDasharray={`${masteryPct} ${100-masteryPct}`}
                  strokeLinecap="round"
                  className="progress-bar"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-extrabold" style={{fontFamily:"var(--font-heading)"}}>{masteryPct}%</span>
              </div>
            </div>
            <div><p className="text-sm font-semibold">Overall Mastery</p><p className="text-xs text-[var(--muted)]">{mastered.length}/{totalTopics} topics</p></div>
          </div>
        )}

        {/* Mastered */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[var(--green)]" /> Mastered</h3>
          {mastered.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">{mastered.map(t=>(
              <span key={t} className="text-xs bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] px-2.5 py-1 rounded-full">✅ {t}</span>
            ))}</div>
          ) : <p className="text-xs text-[var(--muted)]/50">None yet — keep studying!</p>}
        </div>

        {/* Shaky */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-amber-400" /> Improving</h3>
          {shaky.length > 0 ? (
            <div className="space-y-1.5">{shaky.map(s=>(
              <div key={s.topic} className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2">
                <p className="text-xs font-medium text-amber-400">📚 {s.topic}</p>
                {s.errors.length > 0 && <p className="text-[10px] text-[var(--muted)] mt-0.5">Errors: {s.errors.join(', ')}</p>}
              </div>
            ))}</div>
          ) : <p className="text-xs text-[var(--muted)]/50">All clear! 🎉</p>}
        </div>

        {/* Style */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-[var(--accent)]" /> Learning style</h3>
          <div className="flex flex-wrap gap-1.5">{styles.map((s,i)=>(
            <span key={i} className="text-xs bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] px-3 py-1.5 rounded-full font-medium">{s}</span>
          ))}</div>
        </div>

        <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-xl p-3 text-center">
          <p className="text-[10px] text-[var(--accent)] font-medium">🧠 Skillo remembers your entire learning journey. No other AI tool does this.</p>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState("Generating report...");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [model, setModel] = useState(null);

  useEffect(() => {
    async function fetchReport() {
      const userId = localStorage.getItem("skillo_user_id") || "student_001";
      const localModel = localStorage.getItem("skillo_learner_model");
      if (localModel) { try { setModel(JSON.parse(localModel)); } catch(e) {} }

      try {
        const res = await fetch(`/api/report?userId=${userId}`);
        if (!res.ok) throw new Error("Fetch failed");
        setReport(await res.text());
      } catch (e) {
        if (localModel) { setReport(buildReport(JSON.parse(localModel))); } else { setReport("Could not load report."); setError(true); }
      }
      setLoading(false);
    }
    fetchReport();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4" style={{fontFamily:"var(--font-heading)"}}>Report load nahi hua.</p>
      <button onClick={()=>window.location.reload()} className="bg-[var(--accent)] text-[var(--bg)] px-6 py-2 rounded-xl font-bold btn-tap">Refresh</button>
    </div>
  );

  const name = model?.profile?.name || localStorage.getItem("skillo_name") || "Student";
  const grade = model?.profile?.grade || localStorage.getItem("skillo_grade") || "?";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 flex justify-center">
      <div className="max-w-md w-full">
        <header className="mb-6 flex items-center gap-4">
          <button onClick={()=>router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>Progress Report</h1>
            <p className="text-xs text-[var(--muted)]">{name} • Class {grade}</p>
          </div>
        </header>

        {/* Avatar */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-extrabold text-2xl mb-3 shadow-lg" style={{fontFamily:"var(--font-heading)"}}>{name.charAt(0).toUpperCase()}</div>
          <h2 className="text-lg font-bold" style={{fontFamily:"var(--font-heading)"}}>{name}</h2>
          <p className="text-xs text-[var(--muted)]">Class {grade} • Learning with Skillo for {model?.sessionStats?.totalSessions || 0} sessions</p>
        </div>

        <MemorySummary model={model} />

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xl whitespace-pre-wrap leading-relaxed text-sm text-[var(--muted)] animate-fade-in-up stagger-3">
          {report}
        </div>

        <button
          onClick={handleCopy}
          disabled={report.startsWith("Generating")}
          className="w-full mt-6 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 btn-tap disabled:opacity-50"
        >
          {copied ? <><Check className="w-5 h-5"/>Copied!</> : <><Share2 className="w-5 h-5"/>Copy for WhatsApp 📲</>}
        </button>
      </div>
    </div>
  );
}
