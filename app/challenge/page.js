"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Flame, Star, Clock } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import Loading from "@/components/Loading";

export default function DailyChallenge() {
  const router = useRouter();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [points, setPoints] = useState({ total: 0, streak: 0 });
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchChallenge() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const grade = parseInt(localStorage.getItem("skillo_grade")) || 9;
        const today = new Date().toISOString().split('T')[0];

        // Try today's challenge
        let { data, error } = await supabase
          .from("daily_challenges")
          .select("*")
          .eq("date", today)
          .lte("grade", grade)
          .order("grade", { ascending: false })
          .limit(1);

        // Fallback: get latest challenge
        if (!data || data.length === 0) {
          const res = await supabase
            .from("daily_challenges")
            .select("*")
            .lte("grade", grade)
            .order("date", { ascending: false })
            .limit(1);
          data = res.data;
        }

        if (data && data.length > 0) {
          setChallenge(data[0]);
        }

        // Fetch current points
        const userId = localStorage.getItem("skillo_user_id") || "student_001";
        const { data: pointsData } = await supabase
          .from("student_points")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (pointsData) {
          setPoints({
            total: pointsData.total_points || 0,
            streak: pointsData.streak_days || 0
          });

          // Check if already submitted today
          if (pointsData.last_challenge === today) {
            setSubmitted(true);
            setResult({ alreadyDone: true });
          }
        }
      } catch (e) {
        console.error("Challenge fetch error:", e);
      }
      setLoading(false);
    }
    fetchChallenge();
  }, []);

  // Timer
  useEffect(() => {
    if (!loading && challenge && !submitted) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, challenge, submitted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!answer.trim() || !challenge) return;
    clearInterval(timerRef.current);
    setChecking(true);

    try {
      const userId = localStorage.getItem("skillo_user_id") || "student_001";

      // Use simple comparison for checking
      const isCorrect = answer.trim().toLowerCase().replace(/[^a-z0-9°]/g, '') ===
        challenge.correct_answer.trim().toLowerCase().replace(/[^a-z0-9°]/g, '');

      const today = new Date().toISOString().split('T')[0];

      if (supabase) {
        if (isCorrect) {
          // Get current points
          const { data: existing } = await supabase
            .from("student_points")
            .select("*")
            .eq("user_id", userId)
            .single();

          let newStreak = 1;
          let newTotal = challenge.points || 10;

          if (existing) {
            newTotal = (existing.total_points || 0) + (challenge.points || 10);
            const lastChallenge = existing.last_challenge;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastChallenge === yesterdayStr) {
              newStreak = (existing.streak_days || 0) + 1;
            } else if (lastChallenge === today) {
              newStreak = existing.streak_days || 1;
            }

            // Check badges
            let badges = existing.badges || [];
            if (newStreak >= 7 && !badges.includes("7_day_streak")) {
              badges = [...badges, "7_day_streak"];
            }

            await supabase.from("student_points").upsert({
              user_id: userId,
              total_points: newTotal,
              streak_days: newStreak,
              last_challenge: today,
              badges
            }, { onConflict: "user_id" });

            setPoints({ total: newTotal, streak: newStreak });
          } else {
            await supabase.from("student_points").insert({
              user_id: userId,
              total_points: newTotal,
              streak_days: 1,
              last_challenge: today,
              badges: []
            });
            setPoints({ total: newTotal, streak: 1 });
          }
        }

        setResult({
          isCorrect,
          pointsEarned: isCorrect ? (challenge.points || 10) : 0,
          timeTaken: timer
        });
      }
    } catch (e) {
      console.error("Submit error:", e);
      alert("Error submitting answer. Try again.");
    }

    setChecking(false);
    setSubmitted(true);
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.push("/chat")} className="p-2 bg-[#181714] rounded-full hover:bg-[#2a2824] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Daily Challenge</h1>
          </div>

          {/* Stats bar */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#181714] border border-[#2a2824] rounded-xl px-4 py-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-xs text-gray-500">Streak</p>
                <p className="font-bold text-lg leading-none">{points.streak} days</p>
              </div>
            </div>
            <div className="flex-1 bg-[#181714] border border-[#2a2824] rounded-xl px-4 py-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#c9a84c]" />
              <div>
                <p className="text-xs text-gray-500">Points</p>
                <p className="font-bold text-lg leading-none">{points.total}</p>
              </div>
            </div>
          </div>
        </header>

        {!challenge ? (
          <div className="text-center py-16 bg-[#181714] border border-[#2a2824] rounded-2xl">
            <p className="text-xl mb-2">No challenge available</p>
            <p className="text-gray-400 text-sm">Check back tomorrow! 📚</p>
          </div>
        ) : submitted && result ? (
          /* Result view */
          <div className="space-y-6">
            {result.alreadyDone ? (
              <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Already Done!</h2>
                <p className="text-gray-400">You already completed today&apos;s challenge. Come back tomorrow!</p>
              </div>
            ) : result.isCorrect ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-emerald-400 mb-2">Sahi hai!</h2>
                <p className="text-[#c9a84c] font-semibold text-lg mb-1">+{result.pointsEarned} points</p>
                <p className="text-gray-400 text-sm">Time: {formatTime(result.timeTaken)}</p>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Galat</h2>
                <div className="mt-4 text-left bg-[#181714] rounded-xl p-4 border border-[#2a2824]">
                  <p className="text-gray-400 text-sm mb-1">Sahi answer:</p>
                  <p className="text-emerald-400 font-medium">{challenge.correct_answer}</p>
                </div>
              </div>
            )}

            {!result.alreadyDone && (
              <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
                <h3 className="font-semibold text-[#c9a84c] mb-2">📝 Explanation</h3>
                <p className="text-gray-300 leading-relaxed">{challenge.explanation}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button onClick={() => router.push("/leaderboard")} className="w-full bg-[#c9a84c] text-[#0f0e0d] font-bold py-4 rounded-full hover:bg-[#b8973b] transition-colors active:scale-[0.98]">
                🏆 View Leaderboard
              </button>
              <button onClick={() => router.push("/chat")} className="w-full bg-[#2a2824] text-[#e8e2d9] font-medium py-3 rounded-full hover:bg-[#3a3834] transition-colors">
                ← Back to Chat
              </button>
            </div>
          </div>
        ) : (
          /* Question view */
          <div className="space-y-6">
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-3 py-1 rounded-full font-medium">
                  {challenge.subject} • Class {challenge.grade}
                </span>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {formatTime(timer)}
                </div>
              </div>

              <h2 className="text-xl font-semibold leading-relaxed mb-2">
                🤔 Question of the Day
              </h2>
              <p className="text-gray-200 text-lg leading-relaxed mt-4">
                {challenge.question}
              </p>

              <div className="mt-2 text-right">
                <span className="text-xs text-[#c9a84c]">+{challenge.points || 10} points</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-[#181714] border border-[#2a2824] rounded-xl px-4 py-4 text-[#e8e2d9] text-lg focus:outline-none focus:border-[#c9a84c] placeholder:text-gray-600"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={checking || !answer.trim()}
              className="w-full bg-[#c9a84c] text-[#0f0e0d] font-bold py-4 rounded-full hover:bg-[#b8973b] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50 text-lg"
            >
              {checking ? "Checking... ⏳" : "Submit Answer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
