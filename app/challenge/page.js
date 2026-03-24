"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/learnerModel";
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const localChallenges = [
  { subject: "maths", question: "What is the sum of angles in a triangle?", correct_answer: "180", explanation: "The sum of interior angles of any triangle is always 180°. This is a fundamental property of Euclidean geometry.", points: 10 },
  { subject: "maths", question: "If x + 5 = 12, what is x?", correct_answer: "7", explanation: "Subtract 5 from both sides: x = 12 - 5 = 7.", points: 10 },
  { subject: "science", question: "What is the chemical formula for water?", correct_answer: "H2O", explanation: "Water is made up of 2 hydrogen atoms and 1 oxygen atom, hence H₂O.", points: 10 },
  { subject: "maths", question: "What is 15% of 200?", correct_answer: "30", explanation: "15% of 200 = (15/100) × 200 = 30.", points: 10 },
  { subject: "maths", question: "What is the square root of 144?", correct_answer: "12", explanation: "12 × 12 = 144, so √144 = 12.", points: 10 },
  { subject: "science", question: "Which gas do plants absorb from the atmosphere?", correct_answer: "Carbon dioxide", explanation: "Plants absorb CO₂ (carbon dioxide) during photosynthesis and release oxygen.", points: 10 },
  { subject: "maths", question: "Simplify: 3x + 2x", correct_answer: "5x", explanation: "Since both terms have the same variable x, add the coefficients: 3 + 2 = 5, so 3x + 2x = 5x.", points: 10 },
  { subject: "maths", question: "What is the area of a rectangle with length 8cm and breadth 5cm?", correct_answer: "40", explanation: "Area of rectangle = length × breadth = 8 × 5 = 40 cm².", points: 10 },
  { subject: "science", question: "What is the SI unit of force?", correct_answer: "Newton", explanation: "The SI unit of force is the Newton (N), named after Sir Isaac Newton.", points: 10 },
  { subject: "maths", question: "What is the value of π (pi) rounded to 2 decimal places?", correct_answer: "3.14", explanation: "π (pi) is approximately 3.14159... Rounded to 2 decimal places, it is 3.14.", points: 10 },
  { subject: "maths", question: "If a triangle has sides 3, 4, and 5, what type of triangle is it?", correct_answer: "Right triangle", explanation: "Since 3² + 4² = 9 + 16 = 25 = 5², it satisfies the Pythagorean theorem, making it a right-angled triangle.", points: 10 },
  { subject: "science", question: "What is the powerhouse of the cell?", correct_answer: "Mitochondria", explanation: "Mitochondria are called the powerhouse of the cell because they generate most of the cell's ATP (energy).", points: 10 },
  { subject: "maths", question: "What is the next prime number after 7?", correct_answer: "11", explanation: "After 7, the numbers 8, 9, and 10 are all composite. 11 is only divisible by 1 and itself, so it's prime.", points: 10 },
  { subject: "maths", question: "What is the LCM of 4 and 6?", correct_answer: "12", explanation: "Multiples of 4: 4, 8, 12... Multiples of 6: 6, 12... The least common multiple is 12.", points: 10 },
];

export default function ChallengePage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef(null);


  useEffect(() => {
    async function load() {
      let challengeData = null;
      if (supabase) {
        try {
          const today = new Date().toISOString().split('T')[0];
          let { data } = await supabase.from("daily_challenges").select("*").eq("date", today).limit(1);
          if (!data?.length) { const r = await supabase.from("daily_challenges").select("*").order("date",{ascending:false}).limit(1); data = r.data; }
          if (data?.length) challengeData = data[0];
        } catch(e) { console.error(e); }
      }

      // Fallback to local challenges if DB is empty
      if (!challengeData) {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000*60*60*24));
        challengeData = localChallenges[dayOfYear % localChallenges.length];
      }

      setChallenge(challengeData);

      const userId = localStorage.getItem("skillo_user_id") || "student_001";
      if (supabase) {
        try {
          const { data: pts } = await supabase.from("student_points").select("*").eq("user_id", userId).single();
          if (pts) { setPoints(pts.total_points || 0); setStreak(pts.streak_days || 0); }
        } catch(e) { console.error(e); }
      }

      // Also check localStorage for points
      const localPts = localStorage.getItem("skillo_challenge_points");
      const localStrk = localStorage.getItem("skillo_challenge_streak");
      if (localPts) setPoints(p => p || parseInt(localPts));
      if (localStrk) setStreak(s => s || parseInt(localStrk));

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading && challenge && !submitted) { timerRef.current = setInterval(() => setSeconds(s => s+1), 1000); }
    return () => clearInterval(timerRef.current);
  }, [loading, challenge, submitted]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    clearInterval(timerRef.current);
    setSubmitted(true);

    const userAns = answer.trim().toLowerCase().replace(/[^a-z0-9°]/g, '');
    const correctAns = challenge.correct_answer.trim().toLowerCase().replace(/[^a-z0-9°]/g, '');
    const isCorrect = userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns);
    setCorrect(isCorrect);

    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    const earned = isCorrect ? (challenge.points || 10) : 0;
    const userId = localStorage.getItem("skillo_user_id") || "student_001";

    // Try Supabase first
    let saved = false;
    if (supabase) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase.from("student_points").select("*").eq("user_id", userId).single();

        if (existing) {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
          const yDate = yesterday.toISOString().split('T')[0];
          let newStreak = existing.streak_days || 0;
          if (existing.last_challenge === yDate) newStreak++;
          else if (existing.last_challenge !== today) newStreak = 1;

          await supabase.from("student_points").update({
            total_points: (existing.total_points||0) + earned,
            weekly_points: (existing.weekly_points||0) + earned,
            monthly_points: (existing.monthly_points||0) + earned,
            streak_days: newStreak,
            last_challenge: today
          }).eq("user_id", userId);
          setPoints((existing.total_points||0) + earned);
          setStreak(newStreak);
          saved = true;
        } else {
          await supabase.from("student_points").insert({ user_id: userId, total_points: earned, weekly_points: earned, monthly_points: earned, streak_days: 1, last_challenge: new Date().toISOString().split('T')[0], badges: [] });
          setPoints(earned); setStreak(1);
          saved = true;
        }
      } catch(e) { console.error(e); }
    }

    // Fallback to localStorage
    if (!saved) {
      const prevPts = parseInt(localStorage.getItem("skillo_challenge_points") || "0");
      const prevStrk = parseInt(localStorage.getItem("skillo_challenge_streak") || "0");
      const newPts = prevPts + earned;
      const newStrk = prevStrk + 1;
      localStorage.setItem("skillo_challenge_points", newPts.toString());
      localStorage.setItem("skillo_challenge_streak", newStrk.toString());
      setPoints(newPts);
      setStreak(newStrk);
    }
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // Calculate time until next challenge (midnight)
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0,0,0,0);
    const diff = midnight - now;
    const h = Math.floor(diff/(1000*60*60));
    const m = Math.floor((diff%(1000*60*60))/(1000*60));
    return `${h}h ${m}m`;
  };

  if (loading) return <Loading />;
  if (!challenge) return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4 text-center">
      <div className="text-5xl mb-4">🎯</div>
      <p className="text-xl font-bold mb-2" style={{fontFamily:"var(--font-heading)"}}>No challenge today</p>
      <p className="text-sm text-[var(--muted)] mb-6">Check back tomorrow!</p>
      <button onClick={()=>router.push("/chat")} className="bg-[var(--accent)] text-[var(--bg)] px-6 py-2.5 rounded-xl font-bold btn-tap">Back to Chat</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 flex justify-center">
      {/* Confetti */}
      {showConfetti && [...Array(20)].map((_,i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${Math.random()*100}%`,
          background: ['#f5a623','#22c55e','#3b82f6','#ef4444','#e8834a'][i%5],
          animationDelay: `${Math.random()*0.5}s`,
          borderRadius: Math.random()>0.5?'50%':'2px',
          width: `${6+Math.random()*6}px`,
          height: `${6+Math.random()*6}px`
        }} />
      ))}

      <div className="max-w-md w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button onClick={()=>router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>Daily Challenge 🎯</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 rounded-lg font-semibold border border-[var(--accent)]/20">🔥 {streak}</span>
            <span className="text-xs bg-[var(--accent2)]/10 text-[var(--accent2)] px-2.5 py-1 rounded-lg font-semibold border border-[var(--accent2)]/20">⭐ {points}</span>
          </div>
        </header>

        {!submitted ? (
          <div className="animate-fade-in-up">
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-6 text-[var(--muted)]">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono font-semibold">{formatTime(seconds)}</span>
            </div>

            {/* Question card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 mb-6 shadow-xl">
              <span className="text-xs bg-[var(--blue)]/10 text-[var(--blue)] px-2.5 py-1 rounded-full font-medium capitalize border border-[var(--blue)]/20">{challenge.subject}</span>
              <p className="text-lg font-semibold mt-5 leading-relaxed" style={{fontFamily:"var(--font-heading)"}}>{challenge.question}</p>
            </div>

            {/* Answer */}
            <div className="space-y-4">
              <input
                type="text"
                value={answer}
                onChange={(e)=>setAnswer(e.target.value)}
                onKeyDown={(e)=>{if(e.key==='Enter')handleSubmit();}}
                placeholder="Type your answer..."
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-base text-[var(--text)] placeholder:text-[var(--muted)]/40"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] font-bold py-4 rounded-2xl text-base hover:brightness-110 transition disabled:opacity-30 btn-tap shadow-[0_4px_20px_rgba(245,166,35,0.2)]"
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className={`animate-fade-in-up ${!correct ? 'animate-shake' : ''}`}>
            {/* Result */}
            <div className={`rounded-2xl p-8 text-center mb-6 border ${correct ? 'bg-[var(--green)]/5 border-[var(--green)]/20' : 'bg-[var(--red)]/5 border-[var(--red)]/20'}`}>
              {correct ? (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto text-[var(--green)] mb-4" />
                  <h2 className="text-2xl font-extrabold text-[var(--green)] mb-2" style={{fontFamily:"var(--font-heading)"}}>🎉 Sahi hai!</h2>
                  <p className="text-[var(--green)] font-semibold">+{challenge.points || 10} points</p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 mx-auto text-[var(--red)] mb-4" />
                  <h2 className="text-2xl font-extrabold text-[var(--red)] mb-2" style={{fontFamily:"var(--font-heading)"}}>❌ Not quite!</h2>
                  <p className="text-sm text-[var(--muted)] mt-2">Correct answer: <span className="text-[var(--text)] font-semibold">{challenge.correct_answer}</span></p>
                </>
              )}
            </div>

            {/* Explanation */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{fontFamily:"var(--font-heading)"}}>💡 Explanation</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{challenge.explanation}</p>
            </div>

            {/* Time + stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-lg font-bold" style={{fontFamily:"var(--font-heading)"}}>{formatTime(seconds)}</p>
                <p className="text-[10px] text-[var(--muted)]">Time</p>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[var(--accent)]" style={{fontFamily:"var(--font-heading)"}}>🔥 {streak}</p>
                <p className="text-[10px] text-[var(--muted)]">Streak</p>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[var(--accent2)]" style={{fontFamily:"var(--font-heading)"}}>⭐ {points}</p>
                <p className="text-[10px] text-[var(--muted)]">Points</p>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center mb-4">
              <p className="text-xs text-[var(--muted)]">Next challenge in <span className="text-[var(--accent)] font-semibold">{getTimeUntilMidnight()}</span></p>
            </div>

            <button onClick={()=>router.push("/chat")} className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-semibold py-3 rounded-xl hover:bg-[var(--surface2)] transition btn-tap text-sm">
              Back to Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
