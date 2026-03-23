"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0e0d] flex flex-col items-center justify-center p-4 text-center text-[#e8e2d9]">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="w-20 h-20 mx-auto rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0f0e0d] font-bold text-4xl mb-6 shadow-[0_0_30px_rgba(201,168,76,0.2)]">
            S
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Skillo</h1>
          <p className="text-xl text-gray-400 mb-2">
            हर बच्चे का personal tutor 
            <br className="md:hidden"/>
            <span className="md:inline hidden"> / </span>
            A personal tutor for every child
          </p>
        </div>

        <div className="bg-[#181714] border border-[#2a2824] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold border-b border-[#2a2824] pb-2 text-left">For Students</h2>
          <p className="text-sm text-gray-400 text-left">Are you a student? Start learning free today.</p>
          <button 
            onClick={() => window.location.href='/onboard'}
            className="w-full bg-[#c9a84c] text-[#0f0e0d] font-semibold py-3 rounded-full hover:bg-[#b8973b] transition-colors shadow-lg active:scale-95"
          >
            Start Learning
          </button>
        </div>

        <div className="bg-[#181714] border border-[#2a2824] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold border-b border-[#2a2824] pb-2 text-left">For Institutions</h2>
          <p className="text-sm text-gray-400 text-left">Are you a school or college? Get Skillo for your students.</p>
          <button 
            onClick={() => window.location.href='/register'}
            className="w-full bg-[#2a2824] hover:bg-[#3a3834] text-[#c9a84c] font-semibold py-3 rounded-full border border-[#3a3834] transition-colors active:scale-95"
          >
            Register Institution
          </button>
          <p className="text-xs text-gray-500">90 days free trial. No credit card needed.</p>
        </div>

        {/* Everything in one place — feature cards */}
        <div className="pt-4">
          <h2 className="text-xl font-bold mb-6 text-[#e8e2d9]">Everything in one place</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 text-left hover:border-[#c9a84c]/30 transition-colors group">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[#c9a84c] transition-colors">AI Tutor</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Ask anything, get step-by-step help</p>
            </div>
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 text-left hover:border-[#c9a84c]/30 transition-colors group">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[#c9a84c] transition-colors">Smart Grading</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Submit assignments, get instant feedback</p>
            </div>
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 text-left hover:border-[#c9a84c]/30 transition-colors group">
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[#c9a84c] transition-colors">Daily Challenge</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Practice every day, build the habit</p>
            </div>
            <div className="bg-[#181714] border border-[#2a2824] rounded-2xl p-5 text-left hover:border-[#c9a84c]/30 transition-colors group">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[#c9a84c] transition-colors">Teacher Analytics</h3>
              <p className="text-xs text-gray-500 leading-relaxed">See every student&apos;s progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
