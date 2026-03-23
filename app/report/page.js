"use client";

import { useState, useEffect } from "react";
import { Share2, Check, ArrowLeft, Brain, BookOpen, Flame, Star, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildReport } from "@/lib/reportBuilder";
import Loading from "@/components/Loading";

function MemorySummary({ model }) {
  if (!model) return null;

  const sessions = model.sessionStats?.totalSessions || 0;
  const streak = model.sessionStats?.streakDays || 0;
  const lastSeen = model.sessionStats?.lastSeen;
  const topics = model.subjects?.maths?.topics || {};

  const mastered = Object.entries(topics)
    .filter(([_, v]) => v.status === 'mastered')
    .map(([k]) => k);

  const shaky = Object.entries(topics)
    .filter(([_, v]) => v.status === 'shaky')
    .map(([k, v]) => ({ topic: k, errors: v.commonErrors || [] }));

  // Calculate days since first session
  const confidenceDates = Object.keys(model.signals?.confidence || {}).sort();
  const firstDate = confidenceDates.length > 0 ? confidenceDates[0] : null;
  const daysSinceStart = firstDate ?
    Math.floor((new Date() - new Date(firstDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // Learning style
  const styles = [];
  if (model.learningStyle?.prefersAnalogy) styles.push("Analogy lover 🎯");
  if (model.learningStyle?.prefersVisual) styles.push("Step-by-step learner 📐");
  if (styles.length === 0) styles.push("Still learning your style 🔍");

  return (
    <div className="bg-[#181714] border border-[#2a2824] rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#c9a84c]/20 to-[#c9a84c]/5 px-6 py-4 border-b border-[#2a2824]">
        <h2 className="text-lg font-bold flex items-center gap-2 text-[#c9a84c]">
          <Brain className="w-5 h-5" /> Memory Summary
        </h2>
        <p className="text-xs text-gray-400 mt-1">What Skillo remembers about you — no other AI has this.</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0f0e0d] rounded-xl p-3 text-center border border-[#2a2824]">
            <p className="text-2xl font-bold text-[#c9a84c]">{sessions}</p>
            <p className="text-xs text-gray-500 mt-0.5">Sessions</p>
          </div>
          <div className="bg-[#0f0e0d] rounded-xl p-3 text-center border border-[#2a2824]">
            <p className="text-2xl font-bold text-orange-400">{streak}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-0.5"><Flame className="w-3 h-3" /> Streak</p>
          </div>
          <div className="bg-[#0f0e0d] rounded-xl p-3 text-center border border-[#2a2824]">
            <p className="text-2xl font-bold text-emerald-400">{daysSinceStart}</p>
            <p className="text-xs text-gray-500 mt-0.5">Days</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center">
          Skillo has known you for <span className="text-[#e8e2d9] font-medium">{sessions} sessions</span> over <span className="text-[#e8e2d9] font-medium">{daysSinceStart} days</span>
        </p>

        {/* Mastered topics */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-emerald-400" /> Topics Skillo remembers you mastered
          </h3>
          {mastered.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {mastered.map(t => (
                <span key={t} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                  ✅ {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">None yet — keep studying!</p>
          )}
        </div>

        {/* Shaky topics */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-4 h-4 text-amber-400" /> Topics Skillo is helping you improve
          </h3>
          {shaky.length > 0 ? (
            <div className="space-y-2">
              {shaky.map(s => (
                <div key={s.topic} className="bg-[#0f0e0d] border border-[#2a2824] rounded-xl p-3">
                  <p className="text-sm font-medium text-amber-400 mb-1">📚 {s.topic}</p>
                  {s.errors.length > 0 && (
                    <p className="text-xs text-gray-500">Common mistakes: {s.errors.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">None yet — all clear!</p>
          )}
        </div>

        {/* Learning style */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-4 h-4 text-[#c9a84c]" /> Your learning style
          </h3>
          <div className="flex flex-wrap gap-2">
            {styles.map((s, i) => (
              <span key={i} className="text-xs bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] px-3 py-1.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Differentiator */}
        <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-xl p-4 text-center">
          <p className="text-xs text-[#c9a84c] font-medium">
            🧠 Skillo remembers your entire learning journey.<br/>
            No other AI tool does this.
          </p>
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

      // Always load model for memory summary
      const localModel = localStorage.getItem("skillo_learner_model");
      if (localModel) {
        try { setModel(JSON.parse(localModel)); } catch(e) {}
      }

      try {
        const res = await fetch(`/api/report?userId=${userId}`);
        if (!res.ok) throw new Error("Fetch failed");
        const text = await res.text();
        setReport(text);
      } catch (e) {
        console.warn("Offline or API failed, falling back to local storage...");
        if (localModel) {
          const parsed = JSON.parse(localModel);
          setReport(buildReport(parsed));
        } else {
          setReport("Could not load report. Please connect to the internet.");
          setError(true);
        }
      }
      setLoading(false);
    }
    
    fetchReport();
  }, []);

  const handleCopy = () => {
    const fullText = report + (model ? `\n\n--- Memory Summary ---\nSessions: ${model.sessionStats?.totalSessions || 0}\nStreak: ${model.sessionStats?.streakDays || 0} days` : '');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4">Report load nahi hua. Refresh karo.</p>
      <button onClick={() => window.location.reload()} className="bg-[#c9a84c] text-[#0f0e0d] px-6 py-2 rounded-full font-bold">Refresh</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] p-4 md:p-8 flex justify-center">
      <div className="max-w-md w-full">
        <header className="mb-6 flex items-center gap-4 border-b border-[#2a2824] pb-4">
          <button onClick={() => router.push("/chat")} className="p-2 bg-[#181714] rounded-full hover:bg-[#2a2824] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Parent Report</h1>
        </header>

        {/* Memory Summary Section */}
        <MemorySummary model={model} />

        <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6 shadow-xl relative whitespace-pre-wrap leading-relaxed">
          {report}
        </div>

        <button 
          onClick={handleCopy}
          disabled={report.startsWith("Generating")}
          className="w-full mt-6 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          {copied ? <><Check className="w-5 h-5"/> Copied to Clipboard!</> : <><Share2 className="w-5 h-5"/> Copy to share on WhatsApp</>}
        </button>
      </div>
    </div>
  );
}
