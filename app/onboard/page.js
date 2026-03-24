"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/learnerModel";

export default function OnboardChat() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const inputRef = useRef(null);

  const [answers, setAnswers] = useState({
    name: "", grade: "", board: "", language: "",
    schoolType: "", instCheck: "", instID: "",
    institution_name: "", goal: ""
  });

  const steps = [
    { id: "name", type: "text", emoji: "👋", title: "नमस्ते! I'm Skillo.", sub: "What's your name?", placeholder: "Your name..." },
    { id: "grade", type: "buttons", emoji: "📚", title: (a) => `Nice to meet you, ${a.name}! 🎉`, sub: "Which class are you in?", options: ["6","7","8","9","10","11","12","College"] },
    { id: "board", type: "buttons", emoji: "🏫", title: "Which board do you follow?", sub: "", options: ["CBSE","ICSE","State Board"] },
    { id: "language", type: "buttons", emoji: "🗣️", title: "Which language do you prefer?", sub: "", options: ["🇮🇳 हिंदी","🇬🇧 English"] },
    { id: "schoolType", type: "buttons", emoji: "🏛️", title: "What type of school?", sub: "", options: ["🏛️ Government School","🏫 Private School"] },
    { id: "goal", type: "buttons", emoji: "🎯", title: "What's your main goal?", sub: "", options: ["📝 Score well in boards","🎯 Crack JEE / NEET","💡 Understand concepts deeply"] },
    { id: "done", type: "end", emoji: "✅", title: (a) => `You're all set, ${a.name}! 🚀`, sub: "Skillo is ready to be your personal tutor." }
  ];

  const totalSteps = steps.length;
  const current = steps[stepIndex];
  const progress = ((stepIndex) / (totalSteps - 1)) * 100;

  useEffect(() => {
    if (current?.type === "text" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [stepIndex, current?.type]);

  const advance = (val) => {
    if (transitioning) return;
    setTransitioning(true);

    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);
    setInputText("");

    setTimeout(() => {
      setStepIndex(prev => prev + 1);
      setTransitioning(false);
    }, 300);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    advance(inputText.trim());
  };

  const finishOnboarding = async () => {
    const userId = "student_001";
    const lang = answers.language.includes("हिंदी") ? "hi" : "en";
    const sch = answers.schoolType.includes("Government") ? "government" : "private";
    const goal = answers.goal.includes("boards") ? "board_exam" : answers.goal.includes("JEE") ? "entrance_exam" : "concept_mastery";

    localStorage.setItem("skillo_user_id", userId);
    localStorage.setItem("skillo_name", answers.name);
    localStorage.setItem("skillo_grade", answers.grade);
    localStorage.setItem("skillo_lang", lang);

    const model = {
      userId,
      profile: { name: answers.name, grade: answers.grade, board: answers.board, language: lang, schoolType: sch, goal },
      subjects: { maths: { curriculumId: "CBSE_G9_MATHS", topics: {} } },
      learningStyle: { prefersAnalogy: true, prefersVisual: false, vocabularyLevel: "basic" },
      signals: { confidence: {} },
      spacedRepetition: {},
      sessionStats: { totalSessions: 0, streakDays: 1, lastSeen: new Date().toISOString() }
    };

    if (supabase) {
      await supabase.from("learner_models").upsert({
        user_id: userId, model_json: model, updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    }

    localStorage.setItem("skillo_learner_model", JSON.stringify(model));
    router.push("/chat");
  };

  const titleText = typeof current?.title === "function" ? current.title(answers) : current?.title;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[var(--border)] z-50">
        <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Step counter */}
      <div className="fixed top-4 right-4 z-50 text-xs text-[var(--muted)] bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border)]">
        {stepIndex + 1} / {totalSteps}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div key={stepIndex} className={`w-full max-w-md text-center transition-all duration-300 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          {/* Emoji */}
          <div className="text-6xl mb-6 animate-scale-in">{current?.emoji}</div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight" style={{fontFamily:"var(--font-heading)"}}>
            {titleText}
          </h1>

          {current?.sub && (
            <p className="text-[var(--muted)] mb-8 text-base">{current.sub}</p>
          )}

          {/* Text input */}
          {current?.type === "text" && (
            <form onSubmit={handleTextSubmit} className="mt-8 space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={current.placeholder}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-lg text-center text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] font-bold py-4 rounded-2xl hover:brightness-110 transition disabled:opacity-30 btn-tap flex items-center justify-center gap-2 text-base"
              >
                Let&apos;s go <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* Buttons */}
          {current?.type === "buttons" && (
            <div className="mt-8 grid grid-cols-2 gap-3">
              {current.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => advance(opt)}
                  className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-4 py-4 rounded-2xl text-sm font-medium hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all btn-tap"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* End state */}
          {current?.type === "end" && (
            <div className="mt-8">
              <button
                onClick={finishOnboarding}
                className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] font-bold py-4 rounded-2xl hover:brightness-110 transition btn-tap flex items-center justify-center gap-2 text-lg shadow-[0_4px_24px_rgba(245,166,35,0.3)]"
              >
                Start Learning <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brand */}
      <div className="text-center pb-6 text-xs text-[var(--muted)]/50">
        Skillo AI Tutor
      </div>
    </div>
  );
}
