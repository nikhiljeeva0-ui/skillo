"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X as XIcon, Send, Camera, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import Loading from "@/components/Loading";

export default function AssignmentSubmit() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id;

  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAssignment() {
      if (!supabase || !assignmentId) {
        setError("Invalid assignment link");
        setLoading(false);
        return;
      }
      try {
        const { data, error: fetchErr } = await supabase
          .from("assignments")
          .select("*")
          .eq("id", assignmentId)
          .single();

        if (fetchErr || !data) {
          setError("Assignment not found. Check the code and try again.");
          setLoading(false);
          return;
        }

        setAssignment(data);
        setAnswers(new Array(data.questions.length).fill(""));
      } catch (e) {
        setError("Could not load assignment.");
      }
      setLoading(false);
    }
    fetchAssignment();
  }, [assignmentId]);

  const updateAnswer = (idx, value) => {
    const updated = [...answers];
    updated[idx] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (answers.every(a => !a.trim())) {
      alert("Please answer at least one question.");
      return;
    }

    setSubmitting(true);
    try {
      const userId = localStorage.getItem("skillo_user_id") || "student_001";
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          userId,
          answers
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Grading failed");
      }

      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
      alert("Grading failed. Please try again. " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-xl mb-4">❌ {error}</p>
        <button onClick={() => router.push("/chat")} className="bg-[var(--accent)] text-[var(--bg)] px-8 py-3 rounded-full font-bold hover:bg-[var(--accent2)] transition-colors">
          Go to Chat
        </button>
      </div>
    );
  }

  // Results view
  if (results) {
    const percentage = Math.round((results.totalScore / results.totalMax) * 100);
    const isPerfect = percentage === 100;

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-full hover:bg-[var(--border)] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold tracking-tight">Grading Results</h1>
            </div>
            <p className="text-[var(--muted)]">{assignment.title}</p>
          </header>

          {/* Score Card */}
          <div className={`rounded-2xl p-8 text-center mb-8 border ${isPerfect ? 'bg-emerald-500/10 border-emerald-500/30' : percentage >= 60 ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="text-5xl font-bold mb-2">
              {results.totalScore} / {results.totalMax}
            </div>
            <div className={`text-lg font-medium ${isPerfect ? 'text-emerald-400' : percentage >= 60 ? 'text-[var(--accent)]' : 'text-red-400'}`}>
              {percentage}% {isPerfect ? "🏆 Perfect Score!" : percentage >= 80 ? "🌟 Great Job!" : percentage >= 60 ? "👍 Good Effort!" : "📚 Keep Practicing!"}
            </div>
          </div>

          {/* Per-question results */}
          <div className="space-y-4">
            {results.results.map((r, i) => (
              <div key={i} className={`bg-[var(--surface)] rounded-2xl p-6 border ${r.is_correct ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${r.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {r.is_correct ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text)] mb-1">Q{i + 1}: {r.questionText}</p>
                    <p className={`text-sm font-semibold ${r.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.is_correct ? `✅ Sahi hai! ${r.marks_awarded} marks` : `❌ ${r.marks_awarded}/${r.maxMarks} marks`}
                    </p>
                  </div>
                </div>

                {!r.is_correct && (
                  <div className="ml-10 space-y-2 text-sm">
                    <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                      <p className="text-[var(--muted)]">Tumhara answer:</p>
                      <p className="text-[var(--text)]">{r.studentAnswer || "(empty)"}</p>
                    </div>
                    <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                      <p className="text-[var(--muted)]">Sahi answer:</p>
                      <p className="text-emerald-300">{r.correctAnswer}</p>
                    </div>
                    <div className="bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)]">
                      <p className="text-[var(--muted)] mb-1">Explanation:</p>
                      <p className="text-[var(--text)]">{r.explanation}</p>
                    </div>
                    <div className="bg-[var(--accent)]/5 rounded-xl p-3 border border-[var(--accent)]/20">
                      <p className="text-[var(--accent)] text-xs font-medium mb-1">💡 Improvement Tip:</p>
                      <p className="text-[var(--text)]">{r.improvement_tip}</p>
                    </div>
                  </div>
                )}

                {r.is_correct && r.feedback && (
                  <div className="ml-10 text-sm bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                    <p className="text-emerald-300">{r.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button onClick={() => router.push("/chat")} className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-full hover:bg-[var(--accent2)] transition-colors active:scale-[0.98]">
              Continue Learning →
            </button>
            <button onClick={() => router.push("/leaderboard")} className="w-full bg-[var(--border)] text-[var(--text)] font-medium py-3 rounded-full hover:bg-[var(--border)] transition-colors">
              🏆 View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Submit view
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-full hover:bg-[var(--border)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-full text-[var(--accent)]">
              📚 {assignment.subject}
            </span>
            <span className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-full text-[var(--muted)]">
              Class {assignment.grade}
            </span>
            {assignment.due_date && (
              <span className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-full text-[var(--muted)]">
                📅 Due: {new Date(assignment.due_date).toLocaleDateString('en-IN')}
              </span>
            )}
            <span className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-full text-[var(--muted)]">
              Total: {assignment.max_marks} marks
            </span>
          </div>
        </header>

        <div className="space-y-6">
          {assignment.questions.map((q, idx) => (
            <div key={idx} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-[var(--accent)]">Question {idx + 1}</h3>
                <span className="text-xs text-[var(--muted)] bg-[var(--bg)] px-2 py-1 rounded-full">
                  {q.maxMarks} marks
                </span>
              </div>
              <p className="text-[var(--text)] mb-4 leading-relaxed">{q.text}</p>

              {q.type === "MCQ" && q.options && q.options.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        answers[idx] === opt
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--border)] hover:border-[var(--border)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${idx}`}
                        value={opt}
                        checked={answers[idx] === opt}
                        onChange={() => updateAnswer(idx, opt)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[idx] === opt ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                      }`}>
                        {answers[idx] === opt && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />}
                      </div>
                      <span className="text-[var(--text)] text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : q.type === "Long Answer" ? (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-2">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-[var(--surface2)] border border-[var(--border)] py-2.5 rounded-xl text-xs font-semibold hover:border-[var(--accent)] transition-all btn-tap"><Camera className="w-4 h-4" /> Camera Scan</button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-[var(--surface2)] border border-[var(--border)] py-2.5 rounded-xl text-xs font-semibold hover:border-[var(--accent)] transition-all btn-tap"><ImageIcon className="w-4 h-4" /> Upload Image</button>
                  </div>
                  <textarea
                    value={answers[idx] || ""}
                    onChange={(e) => updateAnswer(idx, e.target.value)}
                    placeholder="Write your answer here or scan above..."
                    rows={4}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none placeholder:text-[var(--muted)]"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answers[idx] || ""}
                    onChange={(e) => updateAnswer(idx, e.target.value)}
                    placeholder="Type your answer..."
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
                  />
                  <button className="p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition-colors btn-tap" title="Scan with AI"><Camera className="w-5 h-5 text-[var(--muted)]" /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-8 mb-8 bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-full hover:bg-[var(--accent2)] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>AI checking your answers... ⏳</>
          ) : (
            <><Send className="w-5 h-5" /> Submit Assignment</>
          )}
        </button>
      </div>
    </div>
  );
}
