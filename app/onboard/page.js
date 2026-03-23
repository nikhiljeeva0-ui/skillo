"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { supabase } from "@/lib/learnerModel";

const BOT_DELAY = 600;

export default function OnboardChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const [answers, setAnswers] = useState({
    name: "",
    grade: "",
    board: "",
    language: "",
    schoolType: "",
    instCheck: "",
    instID: "",
    institution_name: "",
    goal: ""
  });

  const steps = [
    { id: "name", type: "text", text: "Namaste! I'm Skillo 👋\nWhat's your name?" },
    { id: "grade", type: "buttons", text: (a) => `Nice to meet you, ${a.name}!\nWhich class are you in?`, options: ["6", "7", "8", "9", "10", "11", "12", "College"] },
    { id: "board", type: "buttons", text: "Which board do you follow?", options: ["CBSE", "ICSE", "State Board"] },
    { id: "language", type: "buttons", text: "What language do you prefer?", options: ["English", "हिंदी"] },
    { id: "schoolType", type: "buttons", text: "What type of school do you go to?", options: ["Government School", "Private School"] },
    { id: "instCheck", type: "buttons", text: "Do you have an institution code?\n(Given by your school or college)", options: ["I have a code", "Skip for now"] },
    { id: "instID", type: "text", text: "Please enter your institution code:" },
    { id: "goal", type: "buttons", text: "What is your main goal?", options: ["Score well in board exam", "Crack entrance exam (JEE/NEET)", "Understand concepts deeply"] },
    { id: "done", type: "end", text: (a) => `Perfect! I'm ready to be your\npersonal tutor, ${a.name}. Let's begin! 🚀` }
  ];

  const currentStep = steps[stepIndex];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (stepIndex === 0 && messages.length === 0) {
      appendBotMessage(steps[0].text);
    }
  }, []);

  const appendBotMessage = (textTemplate) => {
    setIsTyping(true);
    setTimeout(() => {
      const text = typeof textTemplate === "function" ? textTemplate(answers) : textTemplate;
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
      setIsTyping(false);
      
      if (steps[stepIndex]?.id === "done" || stepIndex >= steps.length - 1) {
        finishOnboarding(answers);
      }
    }, BOT_DELAY);
  };

  const advanceToStep = (nextIdx, currentAnswers) => {
    if (nextIdx >= steps.length) return;
    
    setStepIndex(nextIdx);
    const nextStep = steps[nextIdx];
    const text = typeof nextStep.text === "function" ? nextStep.text(currentAnswers) : nextStep.text;
    
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
      setIsTyping(false);
      if (nextStep.id === "done") {
        finishOnboarding(currentAnswers);
      }
    }, BOT_DELAY);
  };

  const handleAnswer = async (val) => {
    if (!val.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: val }]);
    
    const newAnswers = { ...answers, [currentStep.id]: val };
    setAnswers(newAnswers);
    setInputText("");

    if (currentStep.id === "instCheck") {
      if (val === "Skip for now") {
        advanceToStep(stepIndex + 2, newAnswers);
      } else {
        advanceToStep(stepIndex + 1, newAnswers);
      }
      return;
    }

    if (currentStep.id === "instID") {
      setIsTyping(true);
      if (supabase) {
        const { data } = await supabase.from('institutions').select('name').eq('institution_id', val).single();
        if (data) {
          newAnswers.institution_name = data.name;
          setAnswers(newAnswers);
          setMessages(prev => [...prev, { role: "assistant", content: `✅ Connected to ${data.name}!` }]);
          setTimeout(() => advanceToStep(stepIndex + 1, newAnswers), 1000);
        } else {
          setIsTyping(false);
          setMessages(prev => [...prev, { role: "assistant", content: `❌ Invalid code. Try again.` }]);
        }
      } else {
        // Fallback if no supabase
        advanceToStep(stepIndex + 1, newAnswers);
      }
      return;
    }

    advanceToStep(stepIndex + 1, newAnswers);
  };

  const finishOnboarding = async (finalAnswers) => {
    const userId = "student_001";
    
    localStorage.setItem("skillo_user_id", userId);
    localStorage.setItem("skillo_name", finalAnswers.name);
    localStorage.setItem("skillo_grade", finalAnswers.grade);
    localStorage.setItem("skillo_lang", finalAnswers.language);

    const model = {
      userId,
      profile: {
        name: finalAnswers.name,
        grade: finalAnswers.grade,
        board: finalAnswers.board,
        language: finalAnswers.language,
        schoolType: finalAnswers.schoolType,
        goal: finalAnswers.goal
      },
      subjects: { maths: { curriculumId: "CBSE_G9_MATHS", topics: {} } },
      learningStyle: { prefersAnalogy: true, prefersVisual: false, vocabularyLevel: "basic" },
      signals: { confidence: {} },
      spacedRepetition: {},
      sessionStats: { totalSessions: 0, streakDays: 1, lastSeen: new Date().toISOString() }
    };

    if (supabase) {
      await supabase.from("learner_models").upsert({
        user_id: userId,
        model_json: model,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

      if (finalAnswers.instID && finalAnswers.institution_name) {
        await supabase.from("institution_students").insert({
          institution_id: finalAnswers.instID,
          user_id: userId,
          department: "General",
          year: finalAnswers.grade === "College" ? 1 : parseInt(finalAnswers.grade) || 9
        });
        localStorage.setItem("skillo_institution_id", finalAnswers.instID);
      }
    }
    
    localStorage.setItem("skillo_learner_model", JSON.stringify(model));

    setTimeout(() => {
      router.push("/chat");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0f0e0d] max-w-2xl mx-auto border-x border-[#2a2824] relative shadow-2xl overflow-hidden">
      <header className="bg-[#181714] border-b border-[#2a2824] p-3 md:p-4 flex items-center gap-3 z-10 sticky top-0">
        <div className="w-10 h-10 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0f0e0d] font-bold text-xl">S</div>
        <div>
          <h1 className="text-lg font-bold text-[#e8e2d9]">Skillo Onboarding</h1>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[120px] scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${m.role === "user" ? "bg-[#c9a84c] text-[#0f0e0d] rounded-tr-sm" : "bg-[#181714] text-[#e8e2d9] border border-[#2a2824] rounded-tl-sm whitespace-pre-wrap leading-relaxed"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 w-full bg-[#181714] border-t border-[#2a2824] p-3 md:p-4">
        {!isTyping && currentStep?.id !== "done" && (
          currentStep?.type === "buttons" ? (
             <div className="flex flex-wrap gap-2 justify-center pb-2">
               {currentStep.options.map(opt => (
                 <button key={opt} onClick={() => handleAnswer(opt)} className="bg-[#2a2824] hover:bg-[#3a3834] text-[#e8e2d9] border border-[#3a3834] px-4 py-2 rounded-full text-sm transition-colors active:scale-95">
                   {opt}
                 </button>
               ))}
             </div>
          ) : currentStep?.type === "text" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleAnswer(inputText); }} className="flex gap-2 max-w-2xl mx-auto relative items-center">
              <input
                type="text"
                autoFocus
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 bg-[#0f0e0d] border border-[#33312c] rounded-full pl-4 pr-12 py-3 text-[#e8e2d9] focus:outline-none focus:border-[#c9a84c]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 bottom-2 bg-[#c9a84c] text-[#0f0e0d] p-2 rounded-full hover:bg-[#b8973b] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          ) : null
        )}
        {currentStep?.id === "done" && (
          <div className="flex justify-center pb-2">
            <button onClick={() => router.push("/chat")} className="bg-[#c9a84c] text-[#0f0e0d] font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-[#b8973b] transition-colors active:scale-95 flex items-center gap-2">
              Start Learning <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
