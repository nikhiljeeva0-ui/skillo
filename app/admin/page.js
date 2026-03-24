"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, BookOpen, Settings, Plus, Search, ChevronRight, Activity, Database } from "lucide-react";
import { supabase } from "@/lib/learnerModel";
import Loading from "@/components/Loading";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ teachers: 0, students: 0, assignments: 0 });

  useEffect(() => {
    async function load() {
      if (!supabase) {
         setLoading(false);
         return;
      }
      try {
        const { count: tc } = await supabase.from('institutions').select('*', { count: 'exact', head: true });
        const { count: sc } = await supabase.from('learner_models').select('*', { count: 'exact', head: true });
        const { count: ac } = await supabase.from('assignments').select('*', { count: 'exact', head: true });
        setStats({ teachers: tc || 0, students: sc || 0, assignments: ac || 0 });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-10 flex justify-center font-sans">
      <div className="max-w-6xl w-full">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center text-black font-black">S</div>
             <h1 className="text-xl font-black tracking-tighter uppercase">Skillo <span className="text-[var(--accent)]">Admin</span></h1>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold text-gray-500">
             <button className="text-[var(--accent)]">Overview</button>
             <button className="hover:text-white transition cursor-not-allowed">Teachers</button>
             <button className="hover:text-white transition cursor-not-allowed">Students</button>
             <button className="hover:text-white transition cursor-not-allowed">Logs</button>
          </div>
        </nav>

        <header className="mb-12">
          <h2 className="text-4xl font-black mb-3">System Health</h2>
          <p className="text-gray-500 max-w-lg">Monitor your multi-billion dollar startup's core infrastructure and growth metrics in real-time.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Active Students", val: stats.students, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Teachers/Inst.", val: stats.teachers || 12, icon: Shield, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Live Assignments", val: stats.assignments, icon: BookOpen, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" },
            { label: "AI Response Time", val: "~1.2s", icon: Activity, color: "text-purple-400", bg: "bg-purple-400/10" }
          ].map((s, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors group">
               <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                 <s.icon className="w-6 h-6" />
               </div>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
               <p className="text-3xl font-black">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#111] border border-white/5 rounded-3xl p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Recent Registrations</h3>
                    <button className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 rounded-lg">View All</button>
                 </div>
                 <div className="space-y-4">
                    {[
                      { name: "Delhi Public School", type: "Institution", status: "Active" },
                      { name: "Modern High School", type: "Institution", status: "Pending" },
                      { name: "John Doe (Teacher)", type: "Individual", status: "Active" }
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition cursor-pointer group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-sm">{r.name.charAt(0)}</div>
                            <div>
                               <p className="font-bold text-sm tracking-tight">{r.name}</p>
                               <p className="text-[10px] uppercase font-bold text-gray-500">{r.type}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${r.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{r.status}</span>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-3xl p-8 h-full relative overflow-hidden">
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[var(--accent)]/10 rounded-full blur-3xl"></div>
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Database className="w-5 h-5 text-[var(--accent)]" /> Quick Tools</h3>
                 <div className="grid grid-cols-1 gap-3">
                    <button className="w-full py-4 px-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 transition flex items-center gap-3 font-bold text-sm">
                       <Plus className="w-5 h-5 text-[var(--accent)]" /> Add New Teacher
                    </button>
                    <button className="w-full py-4 px-6 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-400 hover:bg-blue-400/10 transition flex items-center gap-3 font-bold text-sm">
                       <Settings className="w-5 h-5 text-blue-400" /> System Settings
                    </button>
                    <button className="w-full py-4 px-6 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-400 hover:bg-purple-400/10 transition flex items-center gap-3 font-bold text-sm">
                       <Users className="w-5 h-5 text-purple-400" /> Manage Roles
                    </button>
                 </div>
                 
                 <div className="mt-12 p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-sm">
                   <p className="text-gray-500 italic mb-2">"Visionary leadership is about building systems that scale."</p>
                   <p className="text-[10px] font-black uppercase text-[var(--accent)] tracking-widest">— Skillo AI Strategist</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
