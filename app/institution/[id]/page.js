"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/learnerModel";
import { Users, Activity, AlertCircle, Flame, Download, CheckCircle, Settings, FileText, ArrowLeft, Copy, Clock, X } from "lucide-react";
import Loading from "@/components/Loading";

const statusColors = {
  green: "bg-emerald-500 text-emerald-900 border-emerald-500",
  amber: "bg-amber-500 text-amber-900 border-amber-500",
  red: "bg-red-500 text-red-900 border-red-500",
};

export default function InstitutionDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const [inst, setInst] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("all_students");
  const [filter, setFilter] = useState("all");
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [reportsMap, setReportsMap] = useState({});
  const [generatingReports, setGeneratingReports] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      
      try {
        const { data: instData, error: e1 } = await supabase
          .from("institutions")
          .select("*")
          .eq("institution_id", id)
          .single();
          
        if (e1) throw e1;
        if (instData) setInst(instData);

        const { data: stuData, error: e2 } = await supabase
          .from("institution_students")
          .select(`
            department,
            year,
            learner_models (
              model_json
            )
          `)
          .eq("institution_id", id);
          
        if (e2) throw e2;

      if (stuData) {
        const parsed = stuData.map(row => {
          const m = row.learner_models?.model_json || {};
          const lastSeenStr = m.sessionStats?.lastSeen;
          let status = "red";
          let daysAgo = 999;
          
          if (lastSeenStr) {
            const lastSeenDate = new Date(lastSeenStr);
            const today = new Date();
            const diffTime = Math.abs(today - lastSeenDate);
            daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysAgo === 0) status = "green";
            else if (daysAgo <= 3) status = "amber";
          }

          const mathTopics = m.subjects?.maths?.topics || {};
          const weakTopics = Object.entries(mathTopics)
            .filter(([_, d]) => d.status === "shaky")
            .map(([t]) => t).slice(0, 2);

          return {
            id: m.userId || Math.random().toString(),
            name: m.profile?.name || "Unknown",
            grade: m.profile?.grade || "?",
            department: row.department,
            year: row.year,
            streak: m.sessionStats?.streakDays || 0,
            lastSeenStr,
            daysAgo,
            status,
            weakTopics
          };
        });
        setStudents(parsed);
      }
      } catch (e) {
        console.error(e);
        setError(true);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const stats = {
    total: students.length,
    activeToday: students.filter(s => s.daysAgo === 0).length,
    needsAttention: students.filter(s => s.daysAgo >= 4).length,
    avgStreak: students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.streak, 0) / students.length) : 0
  };

  const filteredStudents = students.filter(s => {
    if (filter === "active") return s.status === "green";
    if (filter === "attention") return s.status === "red";
    if (filter.startsWith("grade_")) return s.grade.toString() === filter.replace("grade_", "");
    return true;
  });

  const getSubBadge = () => {
    if (!inst) return null;
    const today = new Date();
    const end = new Date(inst.trial_end_date);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    
    if (inst.subscription_status === "active") {
      return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">Active</span>;
    }
    if (diff < 0 || inst.subscription_status === "expired") {
      return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer" onClick={() => setUpgradeModal(true)}>Expired — Renew now</span>;
    }
    return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">Trial — {diff} days remaining</span>;
  };

  const handleGenerateAllReports = async () => {
    setGeneratingReports(true);
    const newMap = { ...reportsMap };
    for (const student of students) {
      if (!newMap[student.id]) {
        try {
          const res = await fetch(`/api/report?userId=${student.id}`);
          if (res.ok) {
            newMap[student.id] = await res.text();
          }
        } catch(e) {}
      }
    }
    setReportsMap(newMap);
    setGeneratingReports(false);
  };

  const handleUpgradeClick = () => {
    alert("Thank you for your interest! Our team will contact you within 24 hours. Email: support@skillo.ai");
    setUpgradeModal(false);
  };

  if (loading) return <Loading />;
  if (error || !inst) return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4">Kuch problem aayi. Thodi der baad try karo.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] font-sans pb-20">
      <header className="bg-[#181714] border-b border-[#2a2824] pt-8 pb-6 px-4 md:px-8 mb-8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight capitalize">{inst.name}</h1>
              {getSubBadge()}
            </div>
            <p className="text-gray-400 capitalize">{inst.type} • {inst.city}, {inst.state}</p>
          </div>
          <p className="text-sm font-mono text-[#c9a84c] bg-[#c9a84c]/10 px-3 py-1.5 rounded-lg border border-[#c9a84c]/20">ID: {inst.institution_id}</p>
        </div>
        
        <div className="max-w-6xl mx-auto mt-8 flex flex-wrap gap-2 md:gap-8 border-b border-[#2a2824]">
          {["all_students", "reports", "settings"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === t ? "text-[#c9a84c]" : "text-gray-400 hover:text-gray-300"}`}>
              {t.replace("_", " ").toUpperCase()}
              {activeTab === t && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#c9a84c] rounded-t-full"></span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8">
        {activeTab === "all_students" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <Users className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Total Enrolled</p>
              </div>
              <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <Activity className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-3xl font-bold">{stats.activeToday}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Active Today</p>
              </div>
              <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-3xl font-bold">{stats.needsAttention}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Needs Attention</p>
              </div>
              <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <Flame className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-3xl font-bold">{stats.avgStreak}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Avg Streak (Days)</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["all", "active", "attention", "grade_9", "grade_10"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${filter === f ? "bg-[#c9a84c] text-[#0f0e0d] border-[#c9a84c]" : "bg-[#181714] text-gray-400 border-[#2a2824] hover:bg-[#2a2824]"}`}>
                  {f === "all" ? "All" : f === "active" ? "Active" : f === "attention" ? "Needs Attention" : `Grade ${f.replace("grade_", "")}`}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(s => (
                <div key={s.id} className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 flex flex-col h-full relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {s.name} <span className={`w-2.5 h-2.5 rounded-full ${statusColors[s.status]} opacity-80 shadow-[0_0_8px_currentColor]`}></span>
                      </h3>
                      <p className="text-sm text-gray-400">
                        {inst.type === 'college' ? `${s.department} • Year ${s.year}` : `Grade ${s.grade}`}
                      </p>
                    </div>
                    <div className="bg-[#1f1e1a] px-2 py-1 rounded-md text-xs font-medium text-[#c9a84c] border border-[#c9a84c]/20">
                      🔥 {s.streak}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {s.daysAgo === 0 ? "Seen Today" : s.daysAgo < 999 ? `Seen ${s.daysAgo} days ago` : "Never logged in"}
                  </div>
                  <div className="mb-6 flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Weak Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {s.weakTopics.length > 0 ? s.weakTopics.map(t => (
                        <span key={t} className="text-xs bg-[#2a2824] text-gray-300 px-2 py-1 rounded">{t}</span>
                      )) : <span className="text-xs text-gray-600">None detected</span>}
                    </div>
                  </div>
                  <button onClick={() => window.open(`/report?userId=${s.id}`, '_blank')} className="w-full bg-[#2a2824] hover:bg-[#3a3834] text-[#c9a84c] py-2 rounded-lg text-sm font-semibold transition-colors border border-[#3a3834]">
                    View Report
                  </button>
                </div>
              ))}
              {filteredStudents.length === 0 && <div className="col-span-full py-12 text-center text-gray-500">No students found matching this filter.</div>}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-[#181714] border border-[#2a2824] p-4 rounded-xl">
              <div>
                <h2 className="font-semibold">Batch Reports Generation</h2>
                <p className="text-sm text-gray-400">Generate weekly progress reports for all {students.length} students.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-[#2a2824] hover:bg-[#3a3834] text-white p-2 rounded-lg transition-colors border border-[#3a3834]" title="Download All as PDF">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={handleGenerateAllReports} disabled={generatingReports} className="bg-[#c9a84c] text-[#0f0e0d] px-4 py-2 rounded-lg font-semibold hover:bg-[#b8973b] transition-colors disabled:opacity-50">
                  {generatingReports ? "Generating..." : "Generate All"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {students.map(s => (
                <div key={s.id} className="bg-[#181714] border border-[#2a2824] rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">{s.name} <span className="text-sm font-normal text-gray-400 ml-2">Class {s.grade}</span></h3>
                    {reportsMap[s.id] ? (
                      <button onClick={() => navigator.clipboard.writeText(reportsMap[s.id])} className="text-[#25D366] flex items-center gap-1.5 text-sm font-semibold bg-[#25D366]/10 px-3 py-1.5 rounded-lg hover:bg-[#25D366]/20 transition-colors">
                        <Copy className="w-4 h-4"/> Copy for WhatsApp
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">Not generated</span>
                    )}
                  </div>
                  {reportsMap[s.id] && (
                    <div className="bg-[#0f0e0d] p-4 rounded-lg text-sm text-gray-300 border border-[#2a2824] whitespace-pre-wrap font-mono">
                      {reportsMap[s.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-[#c9a84c]" /> Institution Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Institution Name</label>
                  <p className="font-medium bg-[#0f0e0d] p-3 rounded-lg border border-[#2a2824] capitalize">{inst.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Admin Email</label>
                  <p className="font-medium bg-[#0f0e0d] p-3 rounded-lg border border-[#2a2824]">{inst.admin_email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">City & State</label>
                  <p className="font-medium bg-[#0f0e0d] p-3 rounded-lg border border-[#2a2824] capitalize">{inst.city}, {inst.state}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Subscription</label>
                  <div className="flex items-center justify-between bg-[#0f0e0d] p-3 rounded-lg border border-[#2a2824]">
                    <div>
                      <p className="font-medium capitalize">{inst.subscription_status} Plan</p>
                      <p className="text-xs text-gray-400">Valid until {new Date(inst.trial_end_date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setUpgradeModal(true)} className="bg-[#c9a84c] text-[#0f0e0d] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#b8973b] transition-colors">
                      Upgrade to Full Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {upgradeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0e0d] w-full max-w-4xl rounded-3xl border border-[#2a2824] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#2a2824] flex justify-between items-center bg-[#181714]">
              <h2 className="text-2xl font-bold">Choose your plan</h2>
              <button onClick={() => setUpgradeModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[#0f0e0d]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Plan */}
                <div className="bg-[#181714] border border-[#2a2824] p-6 rounded-2xl flex flex-col opacity-80">
                  <h3 className="text-xl font-bold text-gray-300">BASIC</h3>
                  <p className="text-3xl font-bold my-4">Free <span className="text-sm font-normal text-gray-500">/ trial</span></p>
                  <ul className="space-y-3 mb-8 text-sm flex-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Up to 50 students</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Student dashboard</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Weekly reports</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 90 days free</li>
                  </ul>
                  <button disabled className="w-full py-3 rounded-xl bg-[#2a2824] text-gray-400 font-semibold border border-[#3a3834]">Current Plan</button>
                </div>

                {/* School Plan */}
                <div className="bg-[#181714] border border-[#c9a84c] p-6 rounded-2xl flex flex-col relative transform md:-translate-y-2 shadow-[0_0_30px_rgba(201,168,76,0.1)]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c9a84c] text-[#0f0e0d] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</div>
                  <h3 className="text-xl font-bold text-[#c9a84c]">SCHOOL</h3>
                  <p className="text-3xl font-bold my-4">₹999 <span className="text-sm font-normal text-gray-500">/ month</span></p>
                  <ul className="space-y-3 mb-8 text-sm flex-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Up to 200 students</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> All Basic features</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Teacher dashboard</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Parent WhatsApp reports</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Priority support</li>
                  </ul>
                  <button onClick={handleUpgradeClick} className="w-full py-3 rounded-xl bg-[#c9a84c] text-[#0f0e0d] font-bold hover:bg-[#b8973b] transition-colors active:scale-95 shadow-lg">Upgrade → ₹999/month</button>
                </div>

                {/* College Plan */}
                <div className="bg-[#181714] border border-[#2a2824] p-6 rounded-2xl flex flex-col">
                  <h3 className="text-xl font-bold text-gray-300">COLLEGE</h3>
                  <p className="text-3xl font-bold my-4">₹2499 <span className="text-sm font-normal text-gray-500">/ month</span></p>
                  <ul className="space-y-3 mb-8 text-sm flex-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Unlimited students</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> All School features</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Department-wise analytics</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> API access</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Dedicated support</li>
                  </ul>
                  <button onClick={handleUpgradeClick} className="w-full py-3 rounded-xl bg-[#2a2824] hover:bg-[#3a3834] text-[#c9a84c] font-semibold border border-[#3a3834] transition-colors active:scale-95">Upgrade → ₹2499/month</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
