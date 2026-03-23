"use client";

import { useEffect, useState } from "react";
import { Users, Activity, AlertCircle, Flame, Clock, Plus, FileText, MessageSquare, X, Search, BarChart3, ClipboardList, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const statusDot = { green: "bg-[var(--green)]", amber: "bg-amber-500", red: "bg-[var(--red)]" };

export function TeacherHeader({ active }) {
  const tabs = [
    { id: 'students', label: 'Dashboard', href: '/teacher' },
    { id: 'reports', label: 'Reports', href: '/teacher/reports' },
    { id: 'assignments', label: 'Assignments', href: '/teacher?tab=assignments' },
    { id: 'analytics', label: 'Analytics', href: '/teacher?tab=analytics' }
  ];

  return (
    <div className="flex gap-2 sm:gap-3 text-sm mb-8 pb-4 items-center flex-wrap overflow-x-auto">
      {tabs.map(t => (
        <a 
          key={t.id} 
          href={t.href} 
          className={`px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap ${
            active === t.id 
            ? 'bg-gradient-to-b from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] shadow-[0_4px_0_0_#b37318] translate-y-[-2px]' 
            : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface2)] hover:text-[var(--text)] hover:shadow-[0_2px_0_0_var(--border)]'
          }`}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}

function AssignmentsTab() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data } = await supabase.from("assignments").select("*").order("created_at", { ascending: false });
        if (data) {
          const withCounts = await Promise.all(data.map(async (a) => {
            const { count } = await supabase.from("submissions").select("*", { count: "exact", head: true }).eq("assignment_id", a.id);
            const { data: subs } = await supabase.from("submissions").select("ai_score").eq("assignment_id", a.id);
            const avg = subs?.length > 0 ? Math.round(subs.reduce((s, x) => s + (x.ai_score||0), 0) / subs.length) : 0;
            return { ...a, subCount: count || 0, avg };
          }));
          setAssignments(withCounts);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const viewSubs = async (a) => {
    setSelected(a); setSubLoading(true);
    try {
      const { data } = await supabase.from("submissions").select("*").eq("assignment_id", a.id).order("submitted_at", { ascending: false });
      if (data) {
        const ids = [...new Set(data.map(s => s.user_id))];
        const { data: models } = await supabase.from("learner_models").select("user_id, model_json").in("user_id", ids);
        const nm = {};
        if (models) models.forEach(m => { nm[m.user_id] = m.model_json?.profile?.name || m.user_id; });
        setSubmissions(data.map(s => ({ ...s, studentName: nm[s.user_id] || s.user_id })));
      }
    } catch(e) { console.error(e); }
    setSubLoading(false);
  };

  if (loading) return <div className="text-center py-12 flex flex-col items-center"><div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mb-4"></div></div>;

  if (selected) return (
    <div className="animate-fade-in-up">
      <button onClick={() => setSelected(null)} className="text-[var(--accent)] text-sm mb-6 flex items-center gap-1 hover:underline btn-tap">← Back to List</button>
      <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 md:p-8 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-3xl"></div>
        <h2 className="text-2xl font-bold mb-2 relative z-10" style={{fontFamily:"var(--font-heading)"}}>{selected.title}</h2>
        <p className="text-[var(--muted)] text-sm mb-2 font-medium relative z-10">{selected.subject} • Class {selected.grade}</p>
        <div className="inline-flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] px-4 py-2 rounded-xl text-sm font-bold relative z-10">
          Average Score: <span className="text-[var(--accent)]">{selected.avg}/{selected.max_marks}</span>
        </div>
      </div>
      
      {subLoading ? <div className="text-center py-8"><div className="w-6 h-6 mx-auto rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"></div></div> : submissions.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-3xl text-[var(--muted)] border-dashed border-2">No submissions yet for this assignment.</div>
      ) : (
        <div className="grid gap-3 animate-fade-in-up stagger-2">{submissions.map((s, i) => (
          <div key={s.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between hover:-translate-y-1 transition-transform duration-300 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center font-bold text-sm">{i+1}</div>
              <div><p className="font-bold">{s.studentName}</p><p className="text-xs text-[var(--muted)] mt-0.5">{new Date(s.submitted_at).toLocaleString('en-IN')}</p></div>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-lg ${s.ai_score >= selected.max_marks * 0.6 ? 'bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20' : 'bg-[var(--red)]/10 text-[var(--red)] border border-[var(--red)]/20'}`}>
              {s.ai_score}/{selected.max_marks}
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{fontFamily:"var(--font-heading)"}}>Assignment Dashboard</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Track submissions and scores</p>
        </div>
        <a href="/teacher/assignments" className="flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-6 py-3 rounded-2xl text-sm font-bold shadow-[0_4px_0_0_#b37318] active:translate-y-[4px] active:shadow-none transition-all btn-tap"><Plus className="w-4 h-4" /> Create Assignment</a>
      </div>
      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-3xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center mb-4"><ClipboardList className="w-8 h-8 text-[var(--muted)]" /></div>
          <p className="text-lg font-bold mb-2">No assignments active</p>
          <p className="text-[var(--muted)] text-sm mb-6 max-w-sm">Create your first intelligent assignment to have Skillo automatically grade student responses.</p>
          <a href="/teacher/assignments" className="text-[var(--accent)] font-semibold text-sm hover:underline">Create now →</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{assignments.map(a => (
          <button key={a.id} onClick={() => viewSubs(a)} className="relative group text-left bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] hover:border-[var(--accent)]/50 overflow-hidden text-clip z-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent)]/10 to-transparent -z-10 rounded-bl-[100px] transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{a.subject}</span>
              <span className="text-xs font-semibold text-[var(--muted)] bg-[var(--bg)] px-2 py-1 rounded-lg border border-[var(--border)]">Class {a.grade}</span>
            </div>
            <h3 className="font-extrabold text-lg mb-4 line-clamp-2" style={{fontFamily:"var(--font-heading)"}}>{a.title}</h3>
            
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-xl font-black">{a.subCount}</span>
                <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">Submitted</span>
              </div>
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-[var(--accent)]">{a.avg}<span className="text-[14px] text-[var(--muted)]">/{a.max_marks}</span></span>
                <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">Average</span>
              </div>
            </div>
          </button>
        ))}</div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data: assigns } = await supabase.from("assignments").select("*");
        const { data: subs } = await supabase.from("submissions").select("*");
        if (assigns && subs) {
          const subjectScores = {};
          assigns.forEach(a => {
            const s = subs.filter(x => x.assignment_id === a.id);
            if (s.length) { if (!subjectScores[a.subject]) subjectScores[a.subject] = []; subjectScores[a.subject].push(Math.round(s.reduce((sum,x) => sum+(x.ai_score||0),0)/s.length)); }
          });
          const subjectAvg = Object.entries(subjectScores).map(([k,v]) => ({ subject: k, avg: Math.round(v.reduce((a,b)=>a+b,0)/v.length) }));

          const missed = [];
          subs.forEach(s => { if (s.ai_feedback && Array.isArray(s.ai_feedback)) s.ai_feedback.forEach(f => { if (!f.is_correct && f.questionText) missed.push(f.questionText); }); });
          const mc = {};
          missed.forEach(q => mc[q] = (mc[q]||0)+1);
          const topMissed = Object.entries(mc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([q,c])=>({question:q,count:c}));

          const { data: models } = await supabase.from("learner_models").select("user_id, model_json");
          const nm = {};
          if (models) models.forEach(m => { nm[m.user_id] = m.model_json?.profile?.name || m.user_id; });

          const ss = {};
          subs.forEach(s => { if (!ss[s.user_id]) ss[s.user_id] = {t:0,c:0}; ss[s.user_id].t+=(s.ai_score||0); ss[s.user_id].c++; });
          const needAtt = Object.entries(ss).map(([id,s])=>({id,name:nm[id]||id,avg:Math.round(s.t/s.c)})).filter(s=>s.avg<50).sort((a,b)=>a.avg-b.avg).slice(0,5);

          const weekly = [];
          for (let i=6;i>=0;i--) { const d=new Date(); d.setDate(d.getDate()-i); const ds=d.toISOString().split('T')[0]; weekly.push({day:d.toLocaleDateString('en',{weekday:'short'}),count:subs.filter(s=>s.submitted_at?.startsWith(ds)).length}); }

          setData({ subjectAvg, topMissed, needAtt, weekly });
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 flex flex-col items-center"><div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mb-4"></div></div>;
  if (!data) return <div className="text-center py-12 text-[var(--muted)]">No data yet</div>;

  const maxW = Math.max(...data.weekly.map(d=>d.count),1);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6" style={{fontFamily:"var(--font-heading)"}}><BarChart3 className="w-6 h-6 text-[var(--accent)]" /> Institutional Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-[var(--border)]/80 transition-all">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[var(--blue)] to-transparent"></div>
          <h3 className="text-sm font-bold text-[var(--muted)] mb-6 uppercase tracking-wider">Subject Averages</h3>
          {data.subjectAvg.length === 0 ? <p className="text-sm text-[var(--muted)]/50">No data</p> : (
            <div className="space-y-5">{data.subjectAvg.map(s => (
              <div key={s.subject}>
                <div className="flex justify-between text-sm font-semibold mb-2"><span className="capitalize">{s.subject}</span><span className={s.avg>=60?'text-[var(--green)]':'text-[var(--red)]'}>{s.avg}%</span></div>
                <div className="h-3 bg-[var(--bg)] rounded-full overflow-hidden shadow-inner"><div className={`h-full rounded-full relative progress-bar ${s.avg>=60?'bg-[var(--green)]':'bg-[var(--red)]'}`} style={{width:`${s.avg}%`}}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                </div></div>
              </div>
            ))}</div>
          )}
        </div>

        <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-[var(--border)]/80 transition-all">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent2)]"></div>
          <h3 className="text-sm font-bold text-[var(--muted)] mb-8 uppercase tracking-wider">Submissions Last 7 Days</h3>
          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {data.weekly.map((d,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                <span className="text-[10px] font-bold text-[var(--text)] opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[var(--surface2)] px-2 py-1 rounded-md mb-1 absolute -mt-8">{d.count}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-[var(--accent2)] to-[var(--accent)] transition-all duration-500 ease-in-out group-hover/bar:brightness-125 shadow-[0_0_15px_rgba(245,166,35,0.2)]" style={{height:`${Math.max((d.count/maxW)*100,4)}%`,minHeight:'4px'}} />
                <span className="text-[10px] text-[var(--muted)] font-medium mt-1">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-2xl mt-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-red-500"></div>
        <h3 className="text-sm font-bold text-[var(--muted)] mb-6 uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Intervention Required</h3>
        {data.needAtt.length === 0 ? <p className="text-sm font-bold text-[var(--green)] bg-[var(--green)]/10 p-4 rounded-xl border border-[var(--green)]/20 text-center">Class is performing exceptionally well! 🎉</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{data.needAtt.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-2xl border border-red-500/20 shadow-[0_4px_15px_rgba(239,68,68,0.05)] hover:-translate-y-1 transition-transform">
              <div>
                <span className="font-bold text-sm block mb-1">{s.name}</span>
                <span className="text-[10px] text-[var(--muted)] uppercase">Average Score</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-[var(--red)]/20 flex items-center justify-center font-bold text-[var(--red)] text-sm">
                {s.avg}%
              </div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [activeStudentName, setActiveStudentName] = useState("");
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tab")) setActiveTab(p.get("tab"));
  }, []);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data, error: e } = await supabase.from("learner_models").select("model_json");
        if (e) throw e;
        if (data) {
          const parsed = data.map(item => {
            const m = item.model_json;
            const ls = m.sessionStats?.lastSeen;
            let status = "red", daysAgo = 999;
            if (ls) { const d = Math.floor(Math.abs(new Date()-new Date(ls))/(1000*60*60*24)); daysAgo=d; status = d===0?"green":d<=3?"amber":"red"; }
            const mathTopics = m.subjects?.maths?.topics || {};
            const weak = Object.entries(mathTopics).filter(([_,d])=>d.status==="shaky").map(([t])=>t);
            const mastered = Object.entries(mathTopics).filter(([_,d])=>d.status==="mastered").length;
            const total = Object.keys(mathTopics).length;
            return { id: m.userId||"student_001", name: m.profile?.name||"Unknown", grade: m.profile?.grade||"?", streak: m.sessionStats?.streakDays||0, lastSeen: daysAgo===0?"Today":daysAgo===1?"Yesterday":daysAgo<999?`${daysAgo}d ago`:"Never", status, weak, mastery: total>0?Math.round((mastered/total)*100):0 };
          });
          setStudents(parsed);
        }
      } catch(e) { console.error(e); setError(true); }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "active") return s.status === "green";
    if (filter === "attention") return s.status === "red";
    return true;
  });

  const stats = {
    total: students.length,
    active: students.filter(s=>s.status==="green").length,
    attention: students.filter(s=>s.status==="red").length,
    avgStreak: students.length>0?Math.round(students.reduce((a,s)=>a+s.streak,0)/students.length):0
  };

  const openHistory = (id, name) => {
    setActiveStudentName(name);
    const h = localStorage.getItem("skillo_chat_history_"+id);
    setSelectedHistory(h ? JSON.parse(h).slice(-10) : []);
    setModalOpen(true);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xl mb-4" style={{fontFamily:"var(--font-heading)"}}>Dashboard failed to load</p>
      <button onClick={()=>window.location.reload()} className="bg-[var(--accent)] text-[var(--bg)] px-6 py-2 rounded-xl font-bold btn-tap">Refresh</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <TeacherHeader active={activeTab} />

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
          <div>
            <div className="inline-block px-3 py-1 mb-3 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold tracking-widest uppercase text-[var(--accent)]">Command Center</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight" style={{fontFamily:"var(--font-heading)"}}>Teacher Dashboard</h1>
            <p className="text-base text-[var(--muted)] mt-2 max-w-lg leading-relaxed">Oversee real-time AI-powered student progression across your classroom.</p>
          </div>
          <a href="/teacher/assignments" className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-8 py-4 rounded-2xl text-base font-black shadow-[0_6px_0_0_#b37318] hover:shadow-[0_4px_0_0_#b37318] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all"><Plus className="w-5 h-5 stroke-[3]" /> Assignment</a>
        </header>

        {/* 3D Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 animate-fade-in-up stagger-1">
          {[
            { icon: Users, label: "Total Students", val: stats.total, color: "text-[var(--blue)]", bg: "from-[var(--blue)]/20 to-transparent", border: "border-[var(--blue)]/30" },
            { icon: Activity, label: "Active Today", val: stats.active, color: "text-[var(--green)]", bg: "from-[var(--green)]/20 to-transparent", border: "border-[var(--green)]/30" },
            { icon: AlertCircle, label: "Need Attention", val: stats.attention, color: "text-[var(--red)]", bg: "from-[var(--red)]/20 to-transparent", border: "border-[var(--red)]/30" },
            { icon: Flame, label: "Avg Class Streak", val: `${stats.avgStreak}d`, color: "text-[var(--accent)]", bg: "from-[var(--accent)]/20 to-transparent", border: "border-[var(--accent)]/30" }
          ].map((s,i) => (
            <div key={i} className={`bg-gradient-to-br ${s.bg} bg-[var(--surface)] border-2 ${s.border} rounded-3xl p-5 md:p-6 text-center transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}>
              <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-20 blur-xl ${s.color.replace('text-','bg-')} group-hover:scale-150 transition-transform duration-500`}></div>
              <div className={`w-12 h-12 mx-auto rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center mb-4 shadow-inner ${s.color}`}>
                <s.icon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <p className="text-4xl font-black mb-1 drop-shadow-sm" style={{fontFamily:"var(--font-heading)"}}>{s.val}</p>
              <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {activeTab === "assignments" && <AssignmentsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "students" && (
          <div className="animate-fade-in-up stagger-2">
            {/* Search + filter with glassmorphism */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[var(--surface)]/50 backdrop-blur-md border border-[var(--border)] p-3 rounded-3xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students by name..." className="w-full bg-[var(--bg)] border-2 border-[var(--border)] focus:border-[var(--accent)] rounded-2xl pl-12 pr-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/50 outline-none transition-colors shadow-inner" />
              </div>
              <div className="flex bg-[var(--bg)] rounded-2xl p-1 border border-[var(--border)]">
                {["all","active","attention"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all btn-tap flex-1 md:flex-none ${filter===f?'bg-[var(--surface)] text-[var(--text)] shadow-md border border-[var(--border)]':'text-[var(--muted)] hover:text-[var(--text)] border border-transparent'}`}>
                    {f==="all"?"All":f==="active"?"Active":"Alerts"}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                <Users className="w-10 h-10 mx-auto text-[var(--muted)]/30 mb-3" />
                <p className="text-[var(--muted)]">{search?"No matching students":"No students yet"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(s => (
                  <div key={s.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col card-hover">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-bold text-base" style={{fontFamily:"var(--font-heading)"}}>{s.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3 className="font-semibold text-sm flex items-center gap-2">{s.name} <span className={`w-2 h-2 rounded-full ${statusDot[s.status]}`} /></h3>
                          <p className="text-[10px] text-[var(--muted)]">Grade {s.grade}</p>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-lg font-semibold">🔥{s.streak}</div>
                    </div>

                    <div className="text-xs text-[var(--muted)] mb-3 flex items-center gap-1"><Clock className="w-3 h-3" />{s.lastSeen}</div>

                    {/* Mastery bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] mb-1"><span className="text-[var(--muted)]">Mastery</span><span>{s.mastery}%</span></div>
                      <div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--green)] progress-bar" style={{width:`${s.mastery}%`}} /></div>
                    </div>

                    {s.weak.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">{s.weak.slice(0,2).map(t=>(
                        <span key={t} className="text-[10px] bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--muted)]">{t}</span>
                      ))}</div>
                    )}

                    <div className="mt-auto flex gap-2">
                      <button onClick={()=>window.open(`/report?userId=${s.id}`,'_blank')} className="flex-1 py-2 bg-[var(--surface2)] rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition flex items-center justify-center gap-1 border border-[var(--border)]"><FileText className="w-3 h-3" />Report</button>
                      <button onClick={()=>openHistory(s.id,s.name)} className="flex-1 py-2 bg-[var(--accent)]/10 rounded-xl text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition flex items-center justify-center gap-1 border border-[var(--accent)]/20"><MessageSquare className="w-3 h-3" />Chat</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="font-semibold text-sm">{activeStudentName}&apos;s Chat</h2>
              <button onClick={()=>setModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--text)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-[var(--bg)]">
              {selectedHistory.length === 0 ? <p className="text-[var(--muted)] text-center py-8 text-sm">No history</p> : selectedHistory.map((m,i) => (
                <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${m.role==="user"?"bg-[var(--accent)]/12 border border-[var(--accent)]/20 rounded-tr-sm":"bg-[var(--surface2)] border border-[var(--border)] rounded-tl-sm whitespace-pre-wrap text-[var(--muted)]"}`}>{m.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
