"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { supabase } from "@/lib/learnerModel";

const BOT_DELAY = 600;

export default function RegisterInstitution() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const [answers, setAnswers] = useState({
    name: "",
    type: "",
    city: "",
    email: "",
    inst_id: ""
  });

  const steps = [
    { id: "name", type: "text", text: "Welcome! Let's set up your institution.\nWhat is your school/college name?" },
    { id: "type", type: "buttons", text: "What type of institution?", options: ["School", "College"] },
    { id: "city", type: "text", text: "Which city are you in?" },
    { id: "email", type: "text", text: "What is your admin email?" },
    { id: "inst_id", type: "text", text: "Create a unique ID for your institution.\nThis is what students will use to join.\n(e.g. BGLR_ST_001)\n\nStudents will enter this code to join your institution." },
    { id: "done", type: "end", text: (a) => `🎉 ${a.name} is registered!\nYour free trial starts today.\nYou have 90 days free.\n\nShare this code with your students: ${a.inst_id}\nStudents enter this code during signup.` }
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
        finishRegistration(answers);
      }
    }, BOT_DELAY);
  };

  const handleAnswer = (val) => {
    if (!val.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: val }]);
    
    const nextIdx = stepIndex + 1;
    const newAnswers = { ...answers, [currentStep.id]: val };
    setAnswers(newAnswers);
    setInputText("");
    setStepIndex(nextIdx);
    
    if (nextIdx < steps.length) {
      const nextStep = steps[nextIdx];
      const text = typeof nextStep.text === "function" ? nextStep.text(newAnswers) : nextStep.text;
      
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
        setIsTyping(false);
        if (nextStep.id === "done") {
          finishRegistration(newAnswers);
        }
      }, BOT_DELAY);
    }
  };

  const finishRegistration = async (finalAnswers) => {
    const institution_id = finalAnswers.inst_id;
    
    if (supabase) {
      await supabase.from("institutions").upsert({
        institution_id: institution_id,
        name: finalAnswers.name,
        type: finalAnswers.type.toLowerCase(),
        city: finalAnswers.city,
        admin_email: finalAnswers.email,
        subscription_status: "trial",
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: "institution_id" });
    }
    
    localStorage.setItem("skillo_institution_id", institution_id);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0f0e0d] max-w-2xl mx-auto border-x border-[#2a2824] relative shadow-2xl overflow-hidden">
      <header className="bg-[#181714] border-b border-[#2a2824] p-3 md:p-4 flex items-center gap-3 z-10 sticky top-0">
        <div className="w-10 h-10 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0f0e0d] font-bold text-xl">S</div>
        <div>
          <h1 className="text-lg font-bold text-[#e8e2d9]">Institution Registration</h1>
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
                type={currentStep?.id === "email" ? "email" : "text"}
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
            <button onClick={() => router.push(`/institution/${answers.inst_id}`)} className="bg-[#c9a84c] text-[#0f0e0d] font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-[#b8973b] transition-colors active:scale-95 flex items-center gap-2">
              Go to Dashboard <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
