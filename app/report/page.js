"use client";

import { useState, useEffect } from "react";
import { Share2, Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildReport } from "@/lib/reportBuilder";
import Loading from "@/components/Loading";

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState("Generating report...");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    async function fetchReport() {
      const userId = localStorage.getItem("skillo_user_id") || "student_001";
      try {
        const res = await fetch(`/api/report?userId=${userId}`);
        if (!res.ok) throw new Error("Fetch failed");
        const text = await res.text();
        setReport(text);
      } catch (e) {
        console.warn("Offline or API failed, falling back to local storage...");
        const localModel = localStorage.getItem("skillo_learner_model");
        if (localModel) {
          const model = JSON.parse(localModel);
          setReport(buildReport(model));
        } else {
          setReport("Could not load report. Please connect to the internet.");
          setError(true);
        }
      }
      setLoading(false);
    }
    
    fetchReport();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4">Report load nahi hua. Refresh karo.</p>
      <button onClick={() => window.location.reload()} className="bg-[#c9a84c] text-[#0f0e0d] px-6 py-2 rounded-full font-bold">Refresh</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] p-4 md:p-8 flex justify-center">
      <div className="max-w-md w-full">
        <header className="mb-6 flex items-center gap-4 border-b border-[#2a2824] pb-4">
          <button onClick={() => router.push("/chat")} className="p-2 bg-[#181714] rounded-full hover:bg-[#2a2824] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Parent Report</h1>
        </header>

        <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6 shadow-xl relative whitespace-pre-wrap leading-relaxed">
          {report}
        </div>

        <button 
          onClick={handleCopy}
          disabled={report.startsWith("Generating")}
          className="w-full mt-6 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          {copied ? <><Check className="w-5 h-5"/> Copied to Clipboard!</> : <><Share2 className="w-5 h-5"/> Copy to share on WhatsApp</>}
        </button>
      </div>
    </div>
  );
}
