"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/learnerModel";
import { Users, Activity, AlertCircle, Flame, Download, CheckCircle, Settings, FileText, ArrowLeft, Copy, Clock, X, TrendingUp, Shield } from "lucide-react";
import Loading from "@/components/Loading";

const statusDot = { green: "bg-[var(--green)]", amber: "bg-amber-500", red: "bg-[var(--red)]" };

export default function InstitutionDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const [inst, setInst] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [filter, setFilter] = useState("all");
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [reportsMap, setReportsMap] = useState({});
  const [generatingReports, setGeneratingReports] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data: instData, error: e1 } = await supabase.from("institutions").select("*").eq("institution_id", id).single();
        if (e1) throw e1;
        if (instData) setInst(instData);

        const { data: stuData, error: e2 } = await supabase.from("institution_students").select("department, year, learner_models(model_json)").eq("institution_id", id);
        if (e2) throw e2;

        if (stuData) {
          const parsed = stuData.map(row => {
            const m = row.learner_models?.model_json || {};
            const lastSeenStr = m.sessionStats?.lastSeen;
            let status = "red", daysAgo = 999;
            if (lastSeenStr) {
              daysAgo = Math.floor(Math.abs(new Date() - new Date(lastSeenStr)) / (1000*60*60*24));
              status = daysAgo === 0 ? "green" : daysAgo <= 3 ? "amber" : "red";
            }
            const mathTopics = m.subjects?.maths?.topics || {};
            const weak = Object.entries(mathTopics).filter(([_,d]) => d.status === "shaky").map(([t]) => t).slice(0,2);
            const mastered = Object.entries(mathTopics).filter(([_,d]) => d.status === "mastered").length;
            const total = Object.keys(mathTopics).length;
            return {
              id: m.userId || Math.random().toString(), name: m.profile?.name || "Unknown", grade: m.profile?.grade || "?",
              department: row.department, year: row.year, streak: m.sessionStats?.streakDays || 0,
              lastSeenStr, daysAgo, status, weak, mastery: total > 0 ? Math.round((mastered/total)*100) : 0
            };
          });
          setStudents(parsed);
        }
      } catch (e) { console.error(e); setError(true); }
      setLoading(false);
    }
    load();
  }, [id]);

  const stats = {
    total: students.length,
    activeToday: students.filter(s => s.daysAgo === 0).length,
    needsAttention: students.filter(s => s.daysAgo >= 4).length,
    avgStreak: students.length > 0 ? Math.round(students.reduce((a,s) => a+s.streak,0)/students.length) : 0,
    avgMastery: students.length > 0 ? Math.round(students.reduce((a,s) => a+s.mastery,0)/students.length) : 0
  };

  const filteredStudents = students.filter(s => {
    if (filter === "active") return s.status === "green";
    if (filter === "attention") return s.status === "red";
    if (filter.startsWith("grade_")) return s.grade.toString() === filter.replace("grade_","");
    return true;
  });

  const getSubBadge = () => {
    if (!inst) return null;
    const today = new Date();
    const end = new Date(inst.trial_end_date);
    const diff = Math.ceil((end - today)/(1000*60*60*24));
    if (inst.subscription_status === "active") return <span className="bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Shield className="w-3 h-3" />Active</span>;
    if (diff < 0 || inst.subscription_status === "expired") return <span className="bg-[var(--red)]/10 text-[var(--red)] border border-[var(--red)]/20 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer" onClick={()=>setUpgradeModal(true)}>Expired — Renew</span>;
    return <span className="bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 px-3 py-1 rounded-full text-xs font-semibold">Trial — {diff} days left</span>;
  };

  const handleGenerateAllReports = async () => {
    setGeneratingReports(true);
    const newMap = { ...reportsMap };
    for (const student of students) {
      if (!newMap[student.id]) {
        try { const res = await fetch(`/api/report?userId=${student.id}`); if (res.ok) newMap[student.id] = await res.text(); } catch(e) {}
      }
    }
    setReportsMap(newMap);
    setGeneratingReports(false);
  };

  const handleUpgradeClick = () => {
    alert("Thank you! Our team will contact you within 24 hours. Email: support@skillo.ai");
    setUpgradeModal(false);
  };

  if (loading) return <Loading />;
  if (error || !inst) return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4" style={{fontFamily:"var(--font-heading)"}}>Something went wrong</p>
      <button onClick={()=>window.location.reload()} className="bg-[var(--accent)] text-[var(--bg)] px-6 py-2 rounded-xl font-bold btn-tap">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-20">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] pt-8 pb-6 px-4 md:px-8 mb-8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold capitalize" style={{fontFamily:"var(--font-heading)"}}>{inst.name}</h1>
                {getSubBadge()}
              </div>
              <p className="text-sm text-[var(--muted)] capitalize">{inst.type} • {inst.city}, {inst.state}</p>
            </div>
            <p className="text-xs font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 rounded-lg border border-[var(--accent)]/20">ID: {inst.institution_id}</p>
          </div>

          <div className="flex gap-4 text-sm border-b border-[var(--border)]">
            {["students","reports","settings"].map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} className={`pb-3 px-1 font-medium transition relative ${activeTab===t?'text-[var(--accent)]':'text-[var(--muted)] hover:text-[var(--text)]'}`}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {activeTab === t && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8">
        {activeTab === "students" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: Users, label: "Total", val: stats.total, color: "text-[var(--blue)]" },
                { icon: Activity, label: "Active Today", val: stats.activeToday, color: "text-[var(--green)]" },
                { icon: AlertCircle, label: "Need Attention", val: stats.needsAttention, color: "text-[var(--red)]" },
                { icon: Flame, label: "Avg Streak", val: `${stats.avgStreak}d`, color: "text-[var(--accent)]" },
                { icon: TrendingUp, label: "Avg Mastery", val: `${stats.avgMastery}%`, color: "text-[var(--green)]" }
              ].map((s,i) => (
                <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.color}`} />
                  <p className="text-2xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>{s.val}</p>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {["all","active","attention","grade_9","grade_10"].map(f => (
                <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition btn-tap ${filter===f?'bg-[var(--accent)] text-[var(--bg)]':'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'}`}>
                  {f==="all"?"All":f==="active"?"Active":f==="attention"?"Needs Help":`Grade ${f.replace("grade_","")}`}
                </button>
              ))}
            </div>

            {/* Student grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(s => (
                <div key={s.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col card-hover">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-bold" style={{fontFamily:"var(--font-heading)"}}>{s.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2">{s.name} <span className={`w-2 h-2 rounded-full ${statusDot[s.status]}`} /></h3>
                        <p className="text-[10px] text-[var(--muted)]">{inst.type==='college'?`${s.department} • Year ${s.year}`:`Grade ${s.grade}`}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-lg font-semibold">🔥{s.streak}</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mb-3 flex items-center gap-1"><Clock className="w-3 h-3" />{s.daysAgo===0?"Today":s.daysAgo<999?`${s.daysAgo}d ago`:"Never"}</div>
                  <div className="mb-3"><div className="flex justify-between text-[10px] mb-1"><span className="text-[var(--muted)]">Mastery</span><span>{s.mastery}%</span></div><div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--green)] progress-bar" style={{width:`${s.mastery}%`}} /></div></div>
                  {s.weak.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{s.weak.map(t=><span key={t} className="text-[10px] bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--muted)]">{t}</span>)}</div>}
                  <button onClick={()=>window.open(`/report?userId=${s.id}`,'_blank')} className="mt-auto w-full py-2 bg-[var(--accent)]/10 rounded-xl text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition border border-[var(--accent)]/20 btn-tap">View Report</button>
                </div>
              ))}
              {filteredStudents.length === 0 && <div className="col-span-full py-12 text-center text-[var(--muted)]">No students match this filter.</div>}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl">
              <div><h2 className="font-semibold" style={{fontFamily:"var(--font-heading)"}}>Batch Reports</h2><p className="text-xs text-[var(--muted)]">Generate for all {students.length} students.</p></div>
              <div className="flex gap-2">
                <button onClick={()=>window.print()} className="bg-[var(--surface2)] hover:bg-[var(--border)] p-2.5 rounded-xl transition border border-[var(--border)]"><Download className="w-4 h-4" /></button>
                <button onClick={handleGenerateAllReports} disabled={generatingReports} className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-xl font-semibold text-sm hover:brightness-110 transition disabled:opacity-50 btn-tap">{generatingReports?"Generating...":"Generate All"}</button>
              </div>
            </div>
            <div className="space-y-3">{students.map(s=>(
              <div key={s.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm">{s.name} <span className="text-xs font-normal text-[var(--muted)] ml-1">Grade {s.grade}</span></h3>
                  {reportsMap[s.id] ? (
                    <button onClick={()=>navigator.clipboard.writeText(reportsMap[s.id])} className="text-[#25D366] flex items-center gap-1 text-xs font-semibold bg-[#25D366]/10 px-3 py-1 rounded-lg hover:bg-[#25D366]/20 transition btn-tap"><Copy className="w-3 h-3" />WhatsApp</button>
                  ) : <span className="text-[10px] text-[var(--muted)]">Not generated</span>}
                </div>
                {reportsMap[s.id] && <div className="bg-[var(--bg)] p-3 rounded-lg text-xs text-[var(--muted)] border border-[var(--border)] whitespace-pre-wrap font-mono">{reportsMap[s.id]}</div>}
              </div>
            ))}</div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{fontFamily:"var(--font-heading)"}}><Settings className="w-5 h-5 text-[var(--accent)]" /> Institution Profile</h2>
              <div className="space-y-4">
                {[
                  { label: "Name", val: inst.name },
                  { label: "Admin Email", val: inst.admin_email },
                  { label: "Location", val: `${inst.city}, ${inst.state}` }
                ].map((f,i)=>(
                  <div key={i}><label className="text-[10px] text-[var(--muted)] uppercase tracking-wider block mb-1">{f.label}</label><p className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] capitalize text-sm">{f.val}</p></div>
                ))}
                <div>
                  <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider block mb-1">Subscription</label>
                  <div className="flex items-center justify-between bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)]">
                    <div><p className="text-sm font-medium capitalize">{inst.subscription_status} Plan</p><p className="text-[10px] text-[var(--muted)]">Valid until {new Date(inst.trial_end_date).toLocaleDateString()}</p></div>
                    <button onClick={()=>setUpgradeModal(true)} className="bg-[var(--accent)] text-[var(--bg)] text-xs font-bold px-4 py-2 rounded-xl hover:brightness-110 transition btn-tap">Upgrade</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {upgradeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] w-full max-w-4xl rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
              <h2 className="text-xl font-bold" style={{fontFamily:"var(--font-heading)"}}>Choose your plan</h2>
              <button onClick={()=>setUpgradeModal(false)} className="text-[var(--muted)] hover:text-[var(--text)] transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { tier: "BASIC", price: "Free", sub: "/ trial", features: ["Up to 50 students","Student dashboard","Weekly reports","90 days free"], disabled: true },
                  { tier: "SCHOOL", price: "₹999", sub: "/ month", features: ["Up to 200 students","All Basic features","Teacher dashboard","Parent WhatsApp reports","Priority support"], highlight: true },
                  { tier: "COLLEGE", price: "₹2499", sub: "/ month", features: ["Unlimited students","All School features","Department analytics","API access","Dedicated support"] }
                ].map((p,i) => (
                  <div key={i} className={`bg-[var(--surface)] border rounded-2xl p-6 flex flex-col ${p.highlight?'border-[var(--accent)] shadow-[0_0_24px_rgba(245,166,35,0.1)]':'border-[var(--border)]'}`}>
                    {p.highlight && <div className="bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider self-start mb-3">Recommended</div>}
                    <h3 className={`text-lg font-bold ${p.highlight?'text-[var(--accent)]':'text-[var(--muted)]'}`} style={{fontFamily:"var(--font-heading)"}}>{p.tier}</h3>
                    <p className="text-2xl font-extrabold my-3" style={{fontFamily:"var(--font-heading)"}}>{p.price} <span className="text-xs font-normal text-[var(--muted)]">{p.sub}</span></p>
                    <ul className="space-y-2 mb-6 flex-1">{p.features.map((f,j)=><li key={j} className="flex items-center gap-2 text-xs"><CheckCircle className="w-3.5 h-3.5 text-[var(--green)]" />{f}</li>)}</ul>
                    <button onClick={p.disabled?undefined:handleUpgradeClick} disabled={p.disabled} className={`w-full py-3 rounded-xl font-semibold text-sm transition btn-tap ${p.disabled?'bg-[var(--border)] text-[var(--muted)]':p.highlight?'bg-[var(--accent)] text-[var(--bg)] hover:brightness-110':'bg-[var(--surface2)] text-[var(--accent)] border border-[var(--border)]'}`}>{p.disabled?"Current Plan":`Upgrade → ${p.price}/month`}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
