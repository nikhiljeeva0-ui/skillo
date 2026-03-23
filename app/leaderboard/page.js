"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/learnerModel";
import { ArrowLeft, Flame, Trophy, Medal, Award, Zap, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const podiumColors = ["from-yellow-500 to-amber-500", "from-gray-400 to-gray-500", "from-amber-700 to-amber-800"];
const podiumIcons = [Trophy, Medal, Award];
const podiumHeights = ["h-28", "h-20", "h-16"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem("skillo_user_id") || "student_001" : "student_001";

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data: pts } = await supabase.from("student_points").select("*").order("total_points", { ascending: false }).limit(20);
        if (pts) {
          const ids = pts.map(p => p.user_id);
          const { data: models } = await supabase.from("learner_models").select("user_id, model_json").in("user_id", ids);
          const nm = {};
          if (models) models.forEach(m => {
            nm[m.user_id] = { name: m.model_json?.profile?.name || m.user_id, grade: m.model_json?.profile?.grade || "?" };
          });
          setStudents(pts.map((p,i) => ({
            rank: i+1, userId: p.user_id,
            name: nm[p.user_id]?.name || p.user_id,
            grade: nm[p.user_id]?.grade || "?",
            points: p.total_points || 0,
            streak: p.streak_days || 0,
            badges: p.badges || []
          })));
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const getBadgeIcons = (s) => {
    const b = [];
    if (s.streak >= 7) b.push({ icon: "🔥", label: "7 Day Streak" });
    if (s.rank <= 3) b.push({ icon: "👑", label: "Top 3" });
    if (s.points >= 100) b.push({ icon: "⚡", label: "Century Club" });
    return b;
  };

  const top3 = students.slice(0, 3);
  const rest = students.slice(3);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 flex justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button onClick={()=>router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>🏆 Leaderboard</h1>
          <div className="w-9" />
        </header>

        {/* Filter */}
        <div className="flex gap-2 justify-center mb-8">
          {["all","week","month"].map(f=>(
            <button key={f} onClick={()=>setTimeFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition btn-tap ${timeFilter===f?'bg-[var(--accent)] text-[var(--bg)]':'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'}`}>
              {f==="all"?"All Time":f==="week"?"This Week":"This Month"}
            </button>
          ))}
        </div>

        {students.length === 0 ? (
          <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <Trophy className="w-10 h-10 mx-auto text-[var(--muted)]/30 mb-3" />
            <p className="text-[var(--muted)]">No scores yet. Be the first!</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-10 px-4 animate-fade-in-up">
                {/* 2nd place */}
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[var(--bg)] font-extrabold text-lg mb-2 shadow-lg" style={{fontFamily:"var(--font-heading)"}}>{top3[1].name.charAt(0)}</div>
                  <p className="text-xs font-semibold truncate">{top3[1].name}</p>
                  <p className="text-[10px] text-[var(--muted)]">{top3[1].points} pts</p>
                  <div className="mt-2 rounded-t-xl bg-gradient-to-t from-gray-500/20 to-gray-500/5 border border-[var(--border)] border-b-0 h-20 flex items-end justify-center pb-2">
                    <span className="text-xl font-extrabold text-gray-400" style={{fontFamily:"var(--font-heading)"}}>2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">👑</div>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-[var(--bg)] font-extrabold text-xl mb-2 shadow-[0_0_24px_rgba(245,166,35,0.3)]" style={{fontFamily:"var(--font-heading)"}}>{top3[0].name.charAt(0)}</div>
                  <p className="text-sm font-bold truncate">{top3[0].name}</p>
                  <p className="text-xs text-[var(--accent)]">{top3[0].points} pts</p>
                  <div className="mt-2 rounded-t-xl bg-gradient-to-t from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 border-b-0 h-28 flex items-end justify-center pb-2">
                    <span className="text-2xl font-extrabold gradient-text" style={{fontFamily:"var(--font-heading)"}}>1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-700 to-amber-800 flex items-center justify-center text-[var(--bg)] font-extrabold text-lg mb-2 shadow-lg" style={{fontFamily:"var(--font-heading)"}}>{top3[2].name.charAt(0)}</div>
                  <p className="text-xs font-semibold truncate">{top3[2].name}</p>
                  <p className="text-[10px] text-[var(--muted)]">{top3[2].points} pts</p>
                  <div className="mt-2 rounded-t-xl bg-gradient-to-t from-amber-800/20 to-amber-800/5 border border-[var(--border)] border-b-0 h-16 flex items-end justify-center pb-2">
                    <span className="text-xl font-extrabold text-amber-700" style={{fontFamily:"var(--font-heading)"}}>3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="space-y-2 animate-fade-in-up stagger-2">
              {(top3.length < 3 ? students : rest).map(s => (
                <div key={s.userId} className={`bg-[var(--surface)] border rounded-xl px-4 py-3 flex items-center gap-3 transition ${s.userId === currentUserId ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5' : 'border-[var(--border)]'}`}>
                  <span className="text-xs font-bold text-[var(--muted)] w-6 text-center">{s.rank}</span>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] text-xs font-bold" style={{fontFamily:"var(--font-heading)"}}>{s.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name} {s.userId === currentUserId && <span className="text-[10px] text-[var(--accent)]">(You)</span>}</p>
                    <p className="text-[10px] text-[var(--muted)]">Class {s.grade}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {s.streak > 0 && <span className="text-[var(--accent)]">🔥{s.streak}</span>}
                    <span className="font-bold">{s.points} <span className="text-[var(--muted)] font-normal">pts</span></span>
                  </div>
                  {getBadgeIcons(s).length > 0 && (
                    <div className="flex gap-0.5">{getBadgeIcons(s).map((b,i)=><span key={i} className="text-sm" title={b.label}>{b.icon}</span>)}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
