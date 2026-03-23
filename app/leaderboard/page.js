"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Flame, Star, Medal } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import Loading from "@/components/Loading";

const BADGE_MAP = {
  "7_day_streak": { icon: "🔥", label: "7 Day Streak" },
  "top_10": { icon: "⭐", label: "Top 10" },
  "perfect_score": { icon: "🏆", label: "Perfect Score" },
  "fast_learner": { icon: "📚", label: "Fast Learner" }
};

export default function Leaderboard() {
  const router = useRouter();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      const userId = localStorage.getItem("skillo_user_id") || "student_001";
      setCurrentUserId(userId);

      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch top students by points
        const { data: pointsData, error } = await supabase
          .from("student_points")
          .select("*")
          .order("total_points", { ascending: false })
          .limit(10);

        if (error) throw error;

        if (pointsData && pointsData.length > 0) {
          // Fetch names from learner_models
          const userIds = pointsData.map(p => p.user_id);
          const { data: modelsData } = await supabase
            .from("learner_models")
            .select("user_id, model_json")
            .in("user_id", userIds);

          const nameMap = {};
          const gradeMap = {};
          if (modelsData) {
            modelsData.forEach(m => {
              nameMap[m.user_id] = m.model_json?.profile?.name || "Student";
              gradeMap[m.user_id] = m.model_json?.profile?.grade || "?";
            });
          }

          // Check and update top_10 badges
          const top10Ids = pointsData.slice(0, 10).map(p => p.user_id);
          for (const entry of pointsData.slice(0, 10)) {
            const badges = entry.badges || [];
            if (!badges.includes("top_10")) {
              const updatedBadges = [...badges, "top_10"];
              await supabase.from("student_points").update({ badges: updatedBadges })
                .eq("user_id", entry.user_id);
              entry.badges = updatedBadges;
            }
          }

          const formatted = pointsData.map((p, idx) => ({
            rank: idx + 1,
            userId: p.user_id,
            name: nameMap[p.user_id] || p.user_id,
            grade: gradeMap[p.user_id] || "?",
            points: p.total_points || 0,
            streak: p.streak_days || 0,
            badges: p.badges || []
          }));

          setLeaders(formatted);
        }
      } catch (e) {
        console.error("Leaderboard error:", e);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  if (loading) return <Loading />;

  const rankColors = {
    1: "from-[#FFD700] to-[#FFA500]",
    2: "from-[#C0C0C0] to-[#A0A0A0]",
    3: "from-[#CD7F32] to-[#8B4513]"
  };

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.push("/chat")} className="p-2 bg-[#181714] rounded-full hover:bg-[#2a2824] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">🏆 Leaderboard</h1>
          </div>
          <p className="text-gray-400 text-sm">Top students by challenge points</p>
        </header>

        {/* Top 3 podium */}
        {leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-8 px-4">
            {/* 2nd place */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] flex items-center justify-center text-[#0f0e0d] font-bold text-lg mb-2 shadow-lg">
                {leaders[1].name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate">{leaders[1].name.split(' ')[0]}</p>
              <p className="text-xs text-gray-400">{leaders[1].points} pts</p>
              <div className="h-16 bg-gradient-to-t from-[#C0C0C0]/20 to-transparent rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#C0C0C0]">2</span>
              </div>
            </div>

            {/* 1st place */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0f0e0d] font-bold text-xl mb-2 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                {leaders[0].name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-bold truncate text-[#FFD700]">{leaders[0].name.split(' ')[0]}</p>
              <p className="text-xs text-[#c9a84c]">{leaders[0].points} pts</p>
              <div className="h-24 bg-gradient-to-t from-[#FFD700]/20 to-transparent rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-3xl font-bold text-[#FFD700]">1</span>
              </div>
            </div>

            {/* 3rd place */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#CD7F32] to-[#8B4513] flex items-center justify-center text-[#0f0e0d] font-bold text-lg mb-2 shadow-lg">
                {leaders[2].name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate">{leaders[2].name.split(' ')[0]}</p>
              <p className="text-xs text-gray-400">{leaders[2].points} pts</p>
              <div className="h-12 bg-gradient-to-t from-[#CD7F32]/20 to-transparent rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#CD7F32]">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Full list */}
        {leaders.length === 0 ? (
          <div className="text-center py-16 bg-[#181714] border border-[#2a2824] rounded-2xl">
            <Trophy className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-xl mb-2">No leaders yet</p>
            <p className="text-gray-400 text-sm">Complete daily challenges to appear here!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader) => {
              const isMe = leader.userId === currentUserId;
              return (
                <div
                  key={leader.userId}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-colors ${
                    isMe
                      ? 'bg-[#c9a84c]/10 border-2 border-[#c9a84c]/40'
                      : 'bg-[#181714] border border-[#2a2824] hover:border-[#3a3834]'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    leader.rank <= 3
                      ? `bg-gradient-to-br ${rankColors[leader.rank]} text-[#0f0e0d]`
                      : 'bg-[#2a2824] text-gray-400'
                  }`}>
                    {leader.rank}
                  </div>

                  {/* Name & Grade */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isMe ? 'text-[#c9a84c]' : 'text-[#e8e2d9]'}`}>
                      {leader.name.split(' ')[0]} {isMe && <span className="text-xs">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">Class {leader.grade}</p>
                  </div>

                  {/* Streak */}
                  {leader.streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                      <Flame className="w-3 h-3" /> {leader.streak}
                    </div>
                  )}

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${isMe ? 'text-[#c9a84c]' : 'text-[#e8e2d9]'}`}>{leader.points}</p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>

                  {/* Badges */}
                  {leader.badges && leader.badges.length > 0 && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {leader.badges.slice(0, 2).map(b => (
                        <span key={b} className="text-sm" title={BADGE_MAP[b]?.label || b}>
                          {BADGE_MAP[b]?.icon || "🎖️"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button onClick={() => router.push("/challenge")} className="w-full bg-[#c9a84c] text-[#0f0e0d] font-bold py-4 rounded-full hover:bg-[#b8973b] transition-colors active:scale-[0.98]">
            📝 Take Today&apos;s Challenge
          </button>
          <button onClick={() => router.push("/chat")} className="w-full bg-[#2a2824] text-[#e8e2d9] font-medium py-3 rounded-full hover:bg-[#3a3834] transition-colors">
            ← Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
