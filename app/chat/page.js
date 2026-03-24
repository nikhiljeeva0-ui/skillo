"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowUp } from "lucide-react";
import Loading from "@/components/Loading";

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [studentInfo, setStudentInfo] = useState({ name: "", grade: "", streak: 0 });
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  const lastExtractedLen = useRef(1);
  const typingTimer = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const triggerExtraction = async () => {
    const currentMsgs = messagesRef.current;
    if (currentMsgs.length < 2) return;
    try {
      await fetch("/api/extract", {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMsgs, userId: "student_001" })
      });
    } catch (e) { console.error("Extraction failed", e); }
  };

  useEffect(() => {
    if (messages.length > 1 && messages.length - lastExtractedLen.current >= 5) {
      triggerExtraction();
      lastExtractedLen.current = messages.length;
    }
  }, [messages]);

  useEffect(() => {
    const handleUnload = () => triggerExtraction();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    clearTimeout(typingTimer.current);
    if (messages.length > 1) {
      typingTimer.current = setTimeout(() => triggerExtraction(), 2 * 60 * 1000);
    }
    return () => clearTimeout(typingTimer.current);
  }, [input, messages]);

  useEffect(() => {
    const name = localStorage.getItem("skillo_name");
    const grade = localStorage.getItem("skillo_grade");
    const lang = localStorage.getItem("skillo_lang");
    if (!name) { router.push("/onboard"); return; }

    const savedUserId = localStorage.getItem("skillo_user_id") || "student_001";
    const isHi = lang === "हिंदी" || lang === "hi";

    // Memory-aware welcome
    const modelStr = localStorage.getItem("skillo_learner_model");
    let initialMsg = isHi
      ? `नमस्ते ${name}! मैं Skillo हूँ। आज हम क्या पढ़ेंगे? 😊`
      : `Namaste ${name}! I'm Skillo. What shall we study today? 😊`;
    let streak = 0;

    if (modelStr) {
      try {
        const model = JSON.parse(modelStr);
        streak = model.sessionStats?.streakDays || 0;
        const lastSeen = model.sessionStats?.lastSeen;
        const topics = model.subjects?.maths?.topics || {};
        const shakyTopics = Object.entries(topics).filter(([_,v]) => v.status === 'shaky').map(([k]) => k.replace(/_/g, ' '));
        const daysSince = lastSeen ? Math.floor((new Date() - new Date(lastSeen)) / (1000*60*60*24)) : null;

        if (shakyTopics.length > 0) {
          initialMsg = isHi 
            ? `वापस आए ${name}! 🚀 ${shakyTopics[0]} में थोड़ी और practice चाहिए थी। क्या आज उसे clear करें?` 
            : `Welcome back ${name}! 🚀 You were a bit shaky on ${shakyTopics[0]} last time. Shall we clear that up today?`;
        } else if (streak >= 3) {
          initialMsg = isHi 
            ? `गजब ${name}! 🔥 ${streak} दिन की streak! आज क्या नया सीखना है?` 
            : `Amazing ${name}! 🔥 ${streak} day streak! What new concept shall we tackle today?`;
        }

        const { getTopicsForToday } = require("@/lib/spacedRepetition");
        const reviewTopics = getTopicsForToday(model);
        if (reviewTopics.length > 0) {
          const revList = reviewTopics.map(t => t.replace(/_/g, ' ')).join(", ");
          initialMsg += isHi
            ? `\n\n📚 और हाँ, Skillo ने आज इन topics का review schedule किया है: ${revList}`
            : `\n\n📚 Also, I've scheduled these for review today: ${revList}`;
        }
      } catch(e) { console.error("Memory error:", e); }
    }

    setStudentInfo({ name, grade, userId: savedUserId, streak });
    setMessages([{ role: "assistant", content: initialMsg, time: new Date() }]);
    setPageLoading(false);
  }, [router]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    const userId = studentInfo.userId || "student_001";
    const newMessages = [...messages, { role: "user", content: userMsg, time: new Date() }];
    setMessages(newMessages);
    localStorage.setItem(`skillo_chat_history_${userId}`, JSON.stringify(newMessages));
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), userId })
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || "API error"); }
      const text = await response.text();
      const botMessages = [...newMessages, { role: "assistant", content: text, time: new Date() }];
      setMessages(botMessages);
      localStorage.setItem(`skillo_chat_history_${userId}`, JSON.stringify(botMessages));
    } catch (error) {
      console.error(error);
      const isRateLimit = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("Too Many");
      const friendlyMsg = isRateLimit
        ? "Skillo is resting for a moment 😴 Too many questions at once! Try again in a minute."
        : "Oops! Something went wrong. Let me try again.";
      const errMessages = [...newMessages, { role: "assistant", content: `⚠️ ${friendlyMsg}`, time: new Date(), isError: true }];
      setMessages(errMessages);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };

  const formatTime = (d) => { if (!d) return ''; const t = new Date(d); return t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); };

  // Suggested topics for empty chat
  const suggestedTopics = ["Quadratic Equations", "Triangle Properties", "Probability Basics", "Real Numbers"];

  if (pageLoading) return <Loading />;


  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--bg)] max-w-2xl mx-auto border-x border-[var(--border)] relative overflow-hidden">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-extrabold text-lg shadow-lg" style={{fontFamily:"var(--font-heading)"}}>S</div>
          <div>
            <h1 className="text-base font-bold" style={{fontFamily:"var(--font-heading)"}}>Skillo</h1>
            <p className="text-[10px] text-[var(--green)] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></span>Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {studentInfo.streak > 0 && (
            <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-1 rounded-lg text-[10px] font-bold text-[var(--accent)] hidden sm:flex items-center gap-1">🔥 {studentInfo.streak}</div>
          )}
          <button onClick={() => router.push("/memory")} className="group flex items-center gap-1.5 bg-[var(--surface2)] px-3 py-1.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <Brain className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-[var(--muted)] group-hover:text-[var(--text)] uppercase tracking-wider">Brain Map</span>
          </button>
          <button onClick={() => window.open("/report","_blank")} className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"><TrendingUp className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-[140px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className="flex flex-col gap-1">
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--accent)]/12 border border-[var(--accent)]/20 text-[var(--text)] rounded-tr-sm"
                  : m.isError
                    ? "bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] rounded-tl-sm"
                    : "bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] rounded-tl-sm whitespace-pre-wrap"
              }`}>{m.content}</div>
              <span className={`text-[10px] text-[var(--muted)]/50 ${m.role === "user" ? "text-right" : "text-left"} px-1`}>{formatTime(m.time)}</span>
            </div>
          </div>
        ))}

        {/* Suggested topics for new student */}
        {messages.length === 1 && (
          <div className="animate-fade-in-up stagger-2">
            <p className="text-xs text-[var(--muted)] mb-2 ml-1">Try asking about:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map(t => (
                <button key={t} onClick={() => setInput(t)} className="text-xs bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/20 transition btn-tap">
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-[var(--accent)]" style={{ animation: 'bounce-dot 1s infinite', animationDelay: `${i*150}ms` }}></span>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 w-full bg-[var(--surface)] border-t border-[var(--border)]">
        {/* Quick actions */}
        <div className="flex items-center justify-center gap-2 px-3 pt-2.5 pb-1">
          {[
            { label: "📚 Assignments", href: "/student/assignments" },
            { label: "📝 Challenge", href: "/challenge" },
            { label: "🏆 Leaderboard", href: "/leaderboard" },
            { label: "📊 Progress", href: "/report" }
          ].map(a => (
            <button key={a.href} onClick={() => router.push(a.href)} className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[10px] font-medium text-[var(--accent)] hover:bg-[var(--accent)]/5 transition btn-tap">
              {a.label}
            </button>
          ))}
        </div>

        <div className="p-3 pt-1">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={localStorage.getItem("skillo_lang") === "hi" ? "कुछ भी पूछो..." : "Type a message..."}
              className="flex-1 resize-none bg-[var(--bg)] border border-[var(--border)] rounded-2xl pl-4 pr-12 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/40 max-h-32 min-h-[48px]"
              rows="1"
              style={{ overflowY: input.split("\n").length > 2 ? "auto" : "hidden" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] w-9 h-9 rounded-xl flex items-center justify-center hover:brightness-110 transition disabled:opacity-30 btn-tap"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
