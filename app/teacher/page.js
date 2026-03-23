"use client";

import { useEffect, useState } from "react";
import { Users, Activity, AlertCircle, Flame, Clock, Plus, FileText, MessageSquare, X, Search, BarChart3, ClipboardList, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const statusDot = { green: "bg-[var(--green)]", amber: "bg-amber-500", red: "bg-[var(--red)]" };

export function TeacherHeader({ active }) {
  return (
    <div className="flex gap-4 text-sm mb-6 pb-4 border-b border-[var(--border)] items-center flex-wrap">
      <a href="/teacher" className={active === 'students' ? 'text-[var(--accent)] font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'}>Students</a>
      <a href="/teacher/reports" className={active === 'reports' ? 'text-[var(--accent)] font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'}>Reports</a>
      <a href="/teacher?tab=assignments" className={active === 'assignments' ? 'text-[var(--accent)] font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'}>Assignments</a>
      <a href="/teacher?tab=analytics" className={active === 'analytics' ? 'text-[var(--accent)] font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'}>Analytics</a>
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

  if (loading) return <div className="text-center py-12 text-[var(--muted)]">Loading...</div>;

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)} className="text-[var(--accent)] text-sm mb-4 hover:underline">← Back</button>
      <h2 className="text-xl font-bold mb-1" style={{fontFamily:"var(--font-heading)"}}>{selected.title}</h2>
      <p className="text-[var(--muted)] text-sm mb-6">{selected.subject} • Class {selected.grade} • Avg: {selected.avg}/{selected.max_marks}</p>
      {subLoading ? <div className="text-[var(--muted)] py-8 text-center">Loading...</div> : submissions.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-[var(--muted)]">No submissions yet.</div>
      ) : (
        <div className="space-y-2">{submissions.map(s => (
          <div key={s.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
            <div><p className="font-medium text-sm">{s.studentName}</p><p className="text-[10px] text-[var(--muted)]">{new Date(s.submitted_at).toLocaleString('en-IN')}</p></div>
            <p className={`font-bold text-lg ${s.ai_score >= selected.max_marks * 0.6 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{s.ai_score}/{selected.max_marks}</p>
          </div>
        ))}</div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" style={{fontFamily:"var(--font-heading)"}}>Assignments</h2>
        <a href="/teacher/assignments" className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-4 py-2 rounded-xl text-sm font-semibold btn-tap"><Plus className="w-4 h-4" /> New Assignment</a>
      </div>
      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <ClipboardList className="w-10 h-10 mx-auto text-[var(--muted)]/30 mb-3" />
          <p className="text-[var(--muted)]">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-2">{assignments.map(a => (
          <button key={a.id} onClick={() => viewSubs(a)} className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-left hover:border-[var(--accent)]/30 transition card-hover">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm">{a.title}</h3>
              <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium capitalize">{a.subject}</span>
            </div>
            <div className="flex gap-4 text-xs text-[var(--muted)]">
              <span>Class {a.grade}</span><span>{a.subCount} submitted</span><span>Avg: {a.avg}/{a.max_marks}</span>
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

  if (loading) return <div className="text-center py-12 text-[var(--muted)]">Loading...</div>;
  if (!data) return <div className="text-center py-12 text-[var(--muted)]">No data yet</div>;

  const maxW = Math.max(...data.weekly.map(d=>d.count),1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2" style={{fontFamily:"var(--font-heading)"}}><BarChart3 className="w-5 h-5 text-[var(--accent)]" /> Analytics</h2>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-4">Subject Averages</h3>
        {data.subjectAvg.length === 0 ? <p className="text-sm text-[var(--muted)]/50">No data</p> : (
          <div className="space-y-3">{data.subjectAvg.map(s => (
            <div key={s.subject}>
              <div className="flex justify-between text-xs mb-1"><span className="capitalize">{s.subject}</span><span className={s.avg>=60?'text-[var(--green)]':'text-[var(--red)]'}>{s.avg}%</span></div>
              <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden"><div className={`h-full rounded-full progress-bar ${s.avg>=60?'bg-[var(--green)]':'bg-[var(--red)]'}`} style={{width:`${s.avg}%`}} /></div>
            </div>
          ))}</div>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-4">Weekly Submissions</h3>
        <div className="flex items-end gap-2 h-28">
          {data.weekly.map((d,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--muted)]">{d.count}</span>
              <div className="w-full rounded-t bg-gradient-to-t from-[var(--accent)] to-[var(--accent2)] transition-all" style={{height:`${Math.max((d.count/maxW)*100,4)}%`,minHeight:'4px'}} />
              <span className="text-[10px] text-[var(--muted)]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Students Needing Attention</h3>
        {data.needAtt.length === 0 ? <p className="text-sm text-[var(--green)]">All good! 🎉</p> : (
          <div className="space-y-2">{data.needAtt.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
              <span className="text-sm">{s.name}</span><span className="text-[var(--red)] font-semibold text-sm">{s.avg}%</span>
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

        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="text-2xl md:text-3xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>Teacher Dashboard</h1><p className="text-sm text-[var(--muted)] mt-1">Real-time student tracking</p></div>
          <a href="/teacher/assignments" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-5 py-2.5 rounded-xl text-sm font-bold btn-tap"><Plus className="w-4 h-4" /> Create Assignment</a>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Users, label: "Total", val: stats.total, color: "text-[var(--blue)]" },
            { icon: Activity, label: "Active Today", val: stats.active, color: "text-[var(--green)]" },
            { icon: AlertCircle, label: "Need Attention", val: stats.attention, color: "text-[var(--red)]" },
            { icon: Flame, label: "Avg Streak", val: `${stats.avgStreak}d`, color: "text-[var(--accent)]" }
          ].map((s,i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-extrabold" style={{fontFamily:"var(--font-heading)"}}>{s.val}</p>
              <p className="text-[10px] text-[var(--muted)] mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["students","assignments","analytics"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap btn-tap ${activeTab===t?'bg-[var(--accent)] text-[var(--bg)]':'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'}`}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "assignments" && <AssignmentsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "students" && (
          <>
            {/* Search + filter */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/40" />
              </div>
              <div className="flex gap-2">
                {["all","active","attention"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition btn-tap ${filter===f?'bg-[var(--accent)] text-[var(--bg)]':'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'}`}>
                    {f==="all"?"All":f==="active"?"Active":"Needs Help"}
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
          </>
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
