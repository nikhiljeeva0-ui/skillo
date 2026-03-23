"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-extrabold text-sm" style={{fontFamily:"var(--font-heading)"}}>S</div>
            <span className="text-lg font-bold" style={{fontFamily:"var(--font-heading)"}}>Skillo</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--muted)] hover-text-[var(--text)]">
            <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
            <a href="#how" className="hover:text-[var(--text)] transition-colors">How it works</a>
            <a href="/teacher" className="hover:text-[var(--accent)] transition-colors font-semibold">Teacher Dashboard</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/teacher" className="text-[var(--accent)] font-semibold px-4 py-2 border border-[var(--accent)]/30 rounded-xl hover:bg-[var(--accent)]/10 text-sm hidden md:block transition-all btn-tap">Teacher Hub</a>
            <a href="/onboard" className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(245,166,35,0.3)] hover:shadow-none hover:translate-y-[2px] transition-all btn-tap">Student Start</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-[clamp(2.5rem,6vw,3.5rem)] font-extrabold leading-[1.1] mb-6" style={{fontFamily:"var(--font-heading)"}}>
              हर बच्चे का<br/>
              <span className="gradient-text">Personal Tutor</span>
            </h1>
            <p className="text-lg text-[var(--muted)] leading-relaxed mb-8 max-w-lg">
              AI that <strong className="text-[var(--text)]">remembers how YOU learn</strong>.
              Adapts every session. Built with a powerful teaching dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/onboard" className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-7 py-3.5 rounded-xl font-bold text-base hover:brightness-110 transition btn-tap shadow-[0_4px_24px_rgba(245,166,35,0.25)]">
                Try AI Tutor Free →
              </a>
              <a href="/teacher" className="border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-7 py-3.5 rounded-xl font-semibold text-base hover:border-[var(--accent)] transition-colors btn-tap">
                Open Teacher Dashboard →
              </a>
            </div>
          </div>

          {/* Mock chat */}
          <div className="animate-fade-in-up stagger-2 hidden lg:block">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-2xl max-w-sm ml-auto">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] text-xs font-bold">S</div>
                <div><p className="text-sm font-semibold">Skillo</p><p className="text-[10px] text-[var(--green)]">● Online</p></div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-end"><div className="bg-[var(--accent)]/15 border border-[var(--accent)]/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[80%] text-[var(--text)]">I don&apos;t understand triangles 😕</div></div>
                <div className="flex justify-start"><div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] text-[var(--muted)]">No worries! Remember last week you mastered angles? Triangles use the same concept. Let&apos;s connect them! 🎯</div></div>
                <div className="flex justify-end"><div className="bg-[var(--accent)]/15 border border-[var(--accent)]/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[80%] text-[var(--text)]">Oh that makes sense!</div></div>
                <div className="flex justify-start"><div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] text-[var(--muted)]">Exactly! Now try this: A triangle has angles 60° and 70°. What&apos;s the third? 🤔</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { val: "320M+", label: "Students in India" },
            { val: "1:45", label: "Teacher student ratio" },
            { val: "₹0", label: "Cost for students" }
          ].map((s, i) => (
            <div key={i} className={`animate-count-up stagger-${i+1}`}>
              <p className="text-2xl md:text-4xl font-extrabold gradient-text" style={{fontFamily:"var(--font-heading)"}}>{s.val}</p>
              <p className="text-xs md:text-sm text-[var(--muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{fontFamily:"var(--font-heading)"}}>Everything a student needs</h2>
          <p className="text-center text-[var(--muted)] mb-12 max-w-md mx-auto">One platform. AI tutor + grading + analytics. Built for India.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { emoji: "🧠", title: "Remembers You", desc: "Skillo builds your profile over months. No other AI does this.", color: "from-purple-500/10 to-purple-500/5" },
              { emoji: "🇮🇳", title: "India First", desc: "Cricket, rupees, chai examples. Hindi + English. Works on 2G.", color: "from-orange-500/10 to-orange-500/5" },
              { emoji: "📊", title: "Teacher Insights", desc: "Teachers see every student's progress in real time.", color: "from-blue-500/10 to-blue-500/5" },
              { emoji: "🎯", title: "Exam Ready", desc: "CBSE, ICSE, JEE, NEET aligned. Practice that actually helps.", color: "from-green-500/10 to-green-500/5" }
            ].map((f, i) => (
              <div key={i} className={`animate-fade-in-up stagger-${i+1} bg-gradient-to-br ${f.color} border border-[var(--border)] rounded-2xl p-6 md:p-8 card-hover`}>
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="text-xl font-bold mb-2" style={{fontFamily:"var(--font-heading)"}}>{f.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4 md:px-8 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12" style={{fontFamily:"var(--font-heading)"}}>How Skillo works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Tell us about you", desc: "Grade, board, language, goals. 2 minutes to set up." },
              { step: "02", title: "Chat with Skillo", desc: "Ask anything, get guided answers with Indian examples." },
              { step: "03", title: "Watch yourself improve", desc: "Track mastery, fix weak areas, build a daily streak." }
            ].map((s, i) => (
              <div key={i} className={`animate-fade-in-up stagger-${i+1} text-center md:text-left`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] font-extrabold text-lg mb-4" style={{fontFamily:"var(--font-heading)"}}>{s.step}</div>
                <h3 className="text-lg font-bold mb-2" style={{fontFamily:"var(--font-heading)"}}>{s.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12" style={{fontFamily:"var(--font-heading)"}}>Built for real students</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { quote: "Finally an AI that explains in Hindi! My maths marks went from 45 to 72.", name: "Priya", detail: "Class 9, Bengaluru" },
              { quote: "I use it every day before school. The streak keeps me motivated!", name: "Rahul", detail: "Class 10, Mumbai" },
              { quote: "As a teacher, the dashboard saves me 2 hours every day.", name: "Mrs. Sharma", detail: "Govt School Teacher" }
            ].map((t, i) => (
              <div key={i} className={`animate-fade-in-up stagger-${i+1} bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 card-hover`}>
                <div className="text-[var(--accent)] text-3xl mb-3">&ldquo;</div>
                <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">{t.quote}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] text-xs font-bold">{t.name[0]}</div>
                  <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-[var(--muted)]">{t.detail}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Schools */}
      <section id="schools" className="py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border border-[var(--border)] rounded-3xl p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-3xl font-extrabold mb-3" style={{fontFamily:"var(--font-heading)"}}>Free for every school in India</h2>
              <p className="text-[var(--muted)] mb-8">No budget needed. No approval required. Just start.</p>
              <div className="space-y-3">
                {["AI grades assignments instantly", "See all 60 students in one dashboard", "Weekly reports to parents on WhatsApp", "Zero cost for government schools"].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-[var(--green)] text-base">✓</span>
                    <span className="text-[var(--muted)]">{b}</span>
                  </div>
                ))}
              </div>
              <a href="/teacher" className="inline-block mt-8 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--bg)] px-7 py-3.5 rounded-xl font-bold hover:brightness-110 transition btn-tap shadow-[0_4px_24px_rgba(245,166,35,0.2)]">
                Access Teacher Dashboard →
              </a>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { tier: "Government Schools", price: "FREE", sub: "forever", highlight: true },
                { tier: "Private Schools", price: "₹999", sub: "/month", highlight: false },
                { tier: "Colleges", price: "₹2499", sub: "/month", highlight: false }
              ].map((p, i) => (
                <div key={i} className={`rounded-2xl p-5 border flex items-center justify-between ${p.highlight ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                  <span className="text-sm font-medium">{p.tier}</span>
                  <span className={`text-xl font-extrabold ${p.highlight ? 'gradient-text' : ''}`} style={{fontFamily:"var(--font-heading)"}}>{p.price} <span className="text-xs font-normal text-[var(--muted)]">{p.sub}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--bg)] font-bold text-xs">S</div>
            <span className="font-bold text-[var(--text)]" style={{fontFamily:"var(--font-heading)"}}>Skillo</span>
            <span className="text-xs text-[var(--muted)] ml-2">AI Tutor for every child</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/nikhiljeeva0-ui" target="_blank" className="hover:text-[var(--text)] transition-colors">GitHub</a>
            <a href="/teacher" className="hover:text-[var(--text)] transition-colors">Teacher Dashboard</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Privacy</a>
          </div>
          <p>Made with ❤️ in India</p>
        </div>
      </footer>
    </div>
  );
}
