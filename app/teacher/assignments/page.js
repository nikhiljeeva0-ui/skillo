"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import { TeacherHeader } from "../page";

const SUBJECTS = ["Maths", "Science", "English", "Hindi"];
const GRADES = [6, 7, 8, 9, 10, 11, 12];
const Q_TYPES = ["MCQ", "Short Answer", "Long Answer"];

function emptyQuestion() {
  return {
    text: "",
    maxMarks: 10,
    answerKey: "",
    type: "Short Answer",
    options: ["", "", "", ""]
  };
}

export default function AssignmentCreator() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Maths");
  const [grade, setGrade] = useState(9);
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const addQuestion = () => {
    if (questions.length >= 10) return;
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || questions.some(q => !q.text.trim() || !q.answerKey.trim())) {
      alert("Please fill all question fields and answer keys.");
      return;
    }

    setLoading(true);
    const id = `assign_${Date.now()}`;
    const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.maxMarks) || 10), 0);

    const payload = {
      id,
      institution_id: localStorage.getItem("skillo_institution_id") || null,
      teacher_id: localStorage.getItem("skillo_user_id") || "teacher_001",
      title: title.trim(),
      subject: subject.toLowerCase(),
      grade: parseInt(grade),
      questions: questions.map(q => ({
        text: q.text,
        maxMarks: parseInt(q.maxMarks) || 10,
        answerKey: q.answerKey,
        type: q.type,
        options: q.type === "MCQ" ? q.options.filter(o => o.trim()) : []
      })),
      max_marks: totalMarks,
      due_date: dueDate || null,
      created_at: new Date().toISOString()
    };

    try {
      if (supabase) {
        const { error } = await supabase.from("assignments").insert(payload);
        if (error) throw error;
      }
      setSuccess(id);
    } catch (err) {
      console.error(err);
      alert("Failed to create assignment. Try again.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Assignment Created! 🎉</h1>
          <p className="text-[var(--muted)] mb-6">Share this code with students:</p>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
            <p className="text-[var(--accent)] font-mono text-lg break-all mb-4">{success}</p>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-[var(--bg)] font-semibold py-3 rounded-full hover:bg-[var(--accent2)] transition-colors active:scale-95"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Assignment Code</>}
            </button>
          </div>

          <p className="text-sm text-[var(--muted)] mb-6">
            Students can submit at:<br />
            <span className="text-[var(--accent)]">/assignments/{success}</span>
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSuccess(null); setTitle(""); setQuestions([emptyQuestion()]); }}
              className="bg-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] py-3 rounded-full transition-colors"
            >
              Create Another
            </button>
            <button
              onClick={() => window.location.href = "/teacher"}
              className="text-[var(--muted)] hover:text-[var(--text)] py-2 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <TeacherHeader active="assignments" />

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => window.location.href = "/teacher"} className="p-2 bg-[var(--surface)] rounded-full hover:bg-[var(--border)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
          </div>
          <p className="text-[var(--muted)]">Create an assignment with up to 10 questions</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b border-[var(--border)] pb-2">Assignment Details</h2>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1.5">Assignment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 5 — Quadratic Equations"
                required
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1.5">Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, idx) => (
            <div key={idx} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 relative group">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <h3 className="text-lg font-semibold text-[var(--accent)]">Question {idx + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">Type</label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, "type", e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {Q_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">Max Marks</label>
                  <input
                    type="number"
                    value={q.maxMarks}
                    onChange={(e) => updateQuestion(idx, "maxMarks", e.target.value)}
                    min="1"
                    max="100"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">Question Text</label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                  placeholder="Write the question here..."
                  required
                  rows={2}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none placeholder:text-[var(--muted)]"
                />
              </div>

              {q.type === "MCQ" && (
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">Options (4)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <input
                        key={oi}
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(idx, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">Answer Key (correct answer)</label>
                <textarea
                  value={q.answerKey}
                  onChange={(e) => updateQuestion(idx, "answerKey", e.target.value)}
                  placeholder="Write the correct answer here..."
                  required
                  rows={2}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none placeholder:text-[var(--muted)]"
                />
              </div>
            </div>
          ))}

          {/* Add question button */}
          {questions.length < 10 && (
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-2xl text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Question ({questions.length}/10)
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-full hover:bg-[var(--accent2)] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50 text-lg"
          >
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </form>
      </div>
    </div>
  );
}
