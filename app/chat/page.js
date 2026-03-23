"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Loading from "@/components/Loading";

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ name: "", grade: "" });
  const messagesEndRef = useRef(null);

  // Extraction mechanics
  const messagesRef = useRef(messages);
  const lastExtractedLen = useRef(1);
  const typingTimer = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const triggerExtraction = async () => {
    const currentMsgs = messagesRef.current;
    if (currentMsgs.length < 2) return;
    
    try {
      await fetch("/api/extract", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMsgs, userId: "student_001" })
      });
    } catch (e) {
      console.error("Silent extraction failed", e);
    }
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
      typingTimer.current = setTimeout(() => {
        triggerExtraction();
      }, 2 * 60 * 1000);
    }
    return () => clearTimeout(typingTimer.current);
  }, [input, messages]);

  useEffect(() => {
    const name = localStorage.getItem("skillo_name");
    const grade = localStorage.getItem("skillo_grade");
    const lang = localStorage.getItem("skillo_lang");

    if (!name) {
      router.push("/onboard");
      return;
    }

    const savedUserId = localStorage.getItem("skillo_user_id") || "student_001";
    setStudentInfo({ name, grade, userId: savedUserId });

    const isHi = lang === "हिंदी" || lang === "hi";
    
    let topicsMsg = "";
    const modelStr = localStorage.getItem("skillo_learner_model");
    if (modelStr) {
      try {
        const model = JSON.parse(modelStr);
        const { getTopicsForToday } = require("@/lib/spacedRepetition");
        const topics = getTopicsForToday(model);
        if (topics.length > 0) {
          if (isHi) {
            topicsMsg = `\n\n📚 आज review करने के लिए:\n${topics.map(t => `- ${t}`).join("\n")}\nक्या इनसे शुरू करें?`;
          } else {
            topicsMsg = `\n\n📚 Topics to review today:\n${topics.map(t => `- ${t}`).join("\n")}\nShall we start with these?`;
          }
        }
      } catch(e) {}
    }

    const initialMsg = isHi
      ? `नमस्ते ${name}! मैं Skillo हूँ, तुम्हारा personal tutor। आज क्या पढ़ना है? 😊${topicsMsg}`
      : `Namaste ${name}! I'm Skillo, your personal tutor. What shall we study today? 😊${topicsMsg}`;

    setMessages([{ role: "assistant", content: initialMsg }]);
    setPageLoading(false);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    const userId = studentInfo.userId || "student_001";
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    localStorage.setItem(`skillo_chat_history_${userId}`, JSON.stringify(newMessages));
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId: studentInfo.userId || "student_001",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "API error");
      }

      const text = await response.text();
      const botMessages = [...newMessages, { role: "assistant", content: text }];
      setMessages(botMessages);
      localStorage.setItem(`skillo_chat_history_${studentInfo.userId || "student_001"}`, JSON.stringify(botMessages));
    } catch (error) {
      console.error(error);
      setPageError(error.message || "Thodi si problem aayi. Dobara try karo! 🔄");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (pageLoading) return <Loading />;
  if (pageError) return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-2">Oops! Thodi si problem aayi.</p>
      <p className="text-sm text-red-400 mb-6 bg-[#181714] p-3 rounded-lg border border-red-900/30 max-w-sm">
        {typeof pageError === "string" ? pageError : "API error. Dobara try karo! 🔄"}
      </p>
      <button onClick={() => window.location.reload()} className="bg-[#c9a84c] text-[#0f0e0d] px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#b8973b] transition-colors">Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0f0e0d] max-w-2xl mx-auto border-x border-[#2a2824] relative shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="bg-[#181714] border-b border-[#2a2824] p-3 md:p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0f0e0d] font-bold text-xl shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#e8e2d9]">Skillo</h1>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button 
            onClick={() => window.open("/report", "_blank")}
            className="text-xs flex items-center gap-1 bg-[#2a2824] px-2 py-1 rounded-md text-[#c9a84c] border border-[#3a3834] hover:bg-[#3a3834] transition-colors"
          >
            📋 Report
          </button>
          <div className="text-right">
            <p className="text-sm font-medium text-[#c9a84c] leading-none mb-1">{studentInfo.name}</p>
            <p className="text-xs text-gray-400 leading-none">Class {studentInfo.grade}</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f0e0d] pb-[140px] scroll-smooth">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                m.role === "user"
                  ? "bg-[#c9a84c] text-[#0f0e0d] rounded-tr-sm"
                  : "bg-[#181714] text-[#e8e2d9] border border-[#2a2824] rounded-tl-sm whitespace-pre-wrap leading-relaxed"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1 shadow-md">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions + Input Area */}
      <div className="absolute bottom-0 w-full bg-[#181714] border-t border-[#2a2824]">
        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-2 px-3 pt-2 pb-1">
          <button
            onClick={() => router.push("/challenge")}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0f0e0d] border border-[#2a2824] rounded-full text-xs text-[#c9a84c] hover:bg-[#2a2824] transition-colors active:scale-95"
          >
            📝 Daily Challenge
          </button>
          <button
            onClick={() => router.push("/leaderboard")}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0f0e0d] border border-[#2a2824] rounded-full text-xs text-[#c9a84c] hover:bg-[#2a2824] transition-colors active:scale-95"
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => router.push("/report")}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0f0e0d] border border-[#2a2824] rounded-full text-xs text-[#c9a84c] hover:bg-[#2a2824] transition-colors active:scale-95"
          >
            📊 My Progress
          </button>
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 pt-1">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto relative items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={localStorage.getItem("skillo_lang") === "हिंदी" ? "कुछ भी पूछो..." : "Type a message..."}
              className="flex-1 resize-none bg-[#0f0e0d] border border-[#33312c] rounded-2xl pl-4 pr-12 py-3 text-[#e8e2d9] focus:outline-none focus:border-[#c9a84c] max-h-32 min-h-[50px] flex items-center"
              rows="1"
              style={{ overflowY: input.split("\n").length > 2 ? "auto" : "hidden" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-3 mb-0.5 bg-[#c9a84c] text-[#0f0e0d] p-2 rounded-full hover:bg-[#b8973b] transition-colors disabled:opacity-50 disabled:hover:bg-[#c9a84c] transform active:scale-90 flex items-center"
            >
              {localStorage.getItem("skillo_lang") === "हिंदी" ? <span className="text-xs px-1 font-bold">भेजो</span> : <Send className="w-5 h-5 -ml-0.5 mt-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
