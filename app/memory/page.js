"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, Star, Clock, Zap, Target, BookOpen, AlertCircle, TrendingUp, ArrowLeft } from "lucide-react";
import { getLearnerModel } from "@/lib/learnerModel";
import Loading from "@/components/Loading";

export default function MemoryMap() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState(null);

  useEffect(() => {
    async function load() {
      const userId = localStorage.getItem("skillo_user_id") || "student_001";
      const data = await getLearnerModel(userId);
      setModel(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Loading />;
  if (!model) return null;

  const topics = Object.entries(model.subjects?.maths?.topics || {});
  const mastered = topics.filter(([_, t]) => t.status === "mastered");
  const shaky = topics.filter(([_, t]) => t.status === "shaky");
  const reviewDates = Object.entries(model.spacedRepetition || {});

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 flex justify-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <button onClick={() => router.push("/chat")} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black flex items-center gap-2 justify-center" style={{fontFamily:"var(--font-heading)"}}>
              <Brain className="w-8 h-8 text-[var(--accent)]" /> 
              My Brain Map
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1 uppercase tracking-widest font-bold">What Skillo knows about you</p>
          </div>
          <div className="w-9" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Personality Card */}
          <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--accent)]/10 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-bold text-[var(--muted)] mb-4 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--accent)]" /> Learning DNA
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Analogy preference</span>
                <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-lg font-bold">HIGH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Vocabulary Level</span>
                <span className="text-xs bg-[var(--blue)]/10 text-[var(--blue)] px-2 py-1 rounded-lg font-bold capitalize">{model.learningStyle.vocabularyLevel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Visual Learner</span>
                <span className={`text-xs px-2 py-1 rounded-lg font-bold ${model.learningStyle.prefersVisual ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--muted)]/10 text-[var(--muted)]'}`}>
                  {model.learningStyle.prefersVisual ? 'YES' : 'REFINING...'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--blue)]/10 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-bold text-[var(--muted)] mb-4 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--blue)]" /> Journey Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-2xl font-black text-[var(--accent)]">{model.sessionStats.streakDays}d</p>
                <p className="text-[10px] text-[var(--muted)] font-bold uppercase">Streak</p>
              </div>
              <div className="text-center bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-2xl font-black text-[var(--blue)]">{model.sessionStats.totalSessions}</p>
                <p className="text-[10px] text-[var(--muted)] font-bold uppercase">Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Mastery Map */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 mb-8 shadow-2xl">
          <h3 className="text-sm font-bold text-[var(--muted)] mb-6 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--green)]" /> Conceptual Mastery
          </h3>
          
          {topics.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-8 h-8 mx-auto text-[var(--muted)]/20 mb-3" />
              <p className="text-sm text-[var(--muted)]">Start chatting to map your brain!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mastered */}
              {mastered.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--green)] mb-3 flex items-center gap-1.5 uppercase">
                    <Star className="w-3 h-3 fill-[var(--green)]" /> Mastered Concepts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mastered.map(([name]) => (
                      <span key={name} className="px-3 py-1.5 bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 rounded-xl text-xs font-bold capitalize">
                        {name.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shaky */}
              {shaky.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--accent)] mb-3 flex items-center gap-1.5 uppercase">
                    <AlertCircle className="w-3 h-3" /> Needs Focus
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shaky.map(([name, data]) => (
                      <div key={name} className="p-3 bg-[var(--bg)] border border-[var(--accent)]/30 rounded-2xl">
                        <p className="text-xs font-bold capitalize mb-1">{name.replace(/_/g, ' ')}</p>
                        {data.commonErrors?.length > 0 && (
                          <div className="space-y-1">
                            {data.commonErrors.map((err, i) => (
                              <p key={i} className="text-[9px] text-[var(--muted)] leading-tight">• {err}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spaced Repetition Schedule */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-[var(--muted)] mb-4 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--blue)]" /> Spaced Review Schedule
          </h3>
          {reviewDates.length === 0 ? (
            <p className="text-xs text-[var(--muted)] text-center py-4">No reviews scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {reviewDates.map(([topic, date]) => {
                const diff = Math.ceil((new Date(date) - new Date()) / (1000*60*60*24));
                return (
                  <div key={topic} className="flex justify-between items-center p-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
                    <span className="text-xs font-bold capitalize">{topic.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${diff <= 0 ? 'bg-[var(--red)] text-white animate-pulse' : 'bg-[var(--surface2)] text-[var(--muted)]'}`}>
                      {diff <= 0 ? 'REVIEW NOW' : `In ${diff} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Startup Tip */}
        <div className="mt-10 mb-20 p-6 bg-[var(--accent)]/10 border border-dashed border-[var(--accent)]/30 rounded-3xl text-center">
          <p className="text-sm italic text-[var(--muted)] leading-relaxed">
            "Unlike other AI, Skillo doesn't just forget. Every interaction makes your Brain Map stronger. This is the core of our multi-billion dollar vision: <span className="text-[var(--text)] font-bold">True Personalized Education for every child.</span>"
          </p>
        </div>
      </div>
    </div>
  );
}
