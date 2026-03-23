"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, User, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/learnerModel"; // assuming standard initialization here

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return setError("Please enter an ID");
    
    setLoading(true);
    setError("");

    try {
      // Super fast teacher bypass for demo
      if (userId.toLowerCase() === "teacher" || userId.toLowerCase() === "admin") {
        localStorage.setItem("skillo_role", "teacher");
        localStorage.setItem("skillo_user_id", "teacher_001");
        router.push("/teacher");
        return;
      }

      // Check backend strictly for the student ID
      if (supabase) {
        const { data, error: sbError } = await supabase
          .from("learner_models")
          .select("user_id, model_json")
          .eq("user_id", userId.trim())
          .single();

        if (sbError || !data) {
          throw new Error("Student ID not found in database.");
        }

        // Successfully located the connected learner
        localStorage.setItem("skillo_role", "student");
        localStorage.setItem("skillo_user_id", data.user_id);
        
        // Restore name to local storage if available for instant display
        if (data.model_json?.profile?.name) {
             localStorage.setItem("skillo_name", data.model_json.profile.name);
        }

        router.push("/chat");
      } else {
        throw new Error("Database connection unavailable.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid credentials. Try stu_001 or teacher.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col p-4 md:p-8 animate-fade-in relative z-0">
      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--bg)] to-[var(--surface2)] -z-10 blur-3xl opacity-50 pointer-events-none"></div>
      
      {/* Navigation Header */}
      <nav className="max-w-6xl w-full mx-auto flex items-center mb-12">
        <button onClick={() => router.push("/")} className="p-3 bg-[var(--surface)]/50 backdrop-blur-md border border-[var(--border)] rounded-full hover:bg-[var(--surface2)] transition-all card-hover btn-tap">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </nav>

      {/* Login Box */}
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center pb-20">
        <div className="text-center mb-10 animate-fade-in-up stagger-1">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-black text-3xl mb-6 shadow-[0_0_40px_rgba(245,166,35,0.4)]" style={{fontFamily:"var(--font-heading)"}}>S</div>
          <h1 className="text-3xl font-extrabold mb-3" style={{fontFamily:"var(--font-heading)"}}>Welcome back</h1>
          <p className="text-[var(--muted)]">Sign in to your Skillo profile to continue learning or teaching.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up stagger-2">
          {error && (
            <div className="mb-6 bg-[var(--red)]/10 border border-[var(--red)]/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--muted)] mb-2 tracking-wide uppercase">Login ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]/60" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. stu_001 OR teacher"
                  className="w-full bg-[var(--bg)] border-2 border-[var(--border)] focus:border-[var(--accent)] rounded-2xl pl-12 pr-4 py-4 text-base text-[var(--text)] transition-colors outline-none shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-[var(--muted)] tracking-wide uppercase">Password</label>
                <a href="#" className="text-sm font-semibold text-[var(--accent)] hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--bg)] border-2 border-[var(--border)] focus:border-[var(--accent)] rounded-2xl pl-12 pr-4 py-4 text-base text-[var(--text)] transition-colors outline-none shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-6 py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_#b37318] hover:shadow-[0_4px_0_0_#b37318] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-50 disabled:translate-y-[6px] disabled:shadow-none"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Fetching Code...</>
              ) : (
                "Sign Into Skillo →"
              )}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center text-sm">
            <p className="text-[var(--muted)] mb-3">Testing Database Seed Login:</p>
            <div className="flex justify-center gap-2 flex-wrap text-xs font-mono">
              <span className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-[var(--text)]">stu_001</span>
              <span className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-[var(--text)]">stu_002</span>
              <span className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-[var(--text)]">teacher</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
