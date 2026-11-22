import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useCems } from '../context/CemsContext';
import { LiveCountdown } from './LiveCountdown';
import { ParticleCanvas } from './ParticleCanvas';

export function PortalGateway() {
  const { settings, setPortalMode } = useCems();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between">
      <ParticleCanvas />

      {/* Ambient radial lighting behind glassmorphism cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.14),_transparent_55%)]"
      />

      {/* Minimal Top Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-end gap-4 border-b border-white/10">
        <span className="text-xs sm:text-sm text-slate-300 truncate">
          {settings.universityName} · {settings.departmentName}
        </span>
      </header>

      {/* Main Hero + Two Separate Glassmorphism Portals */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 sm:py-14 space-y-10 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto space-y-4"
        >
          <div className="text-xs font-medium text-cyan-300">
            {settings.universityName} · {settings.departmentName}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white text-balance">
            {settings.festName}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Choose your portal below to continue.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <LiveCountdown />
        </motion.div>

        {/* Two Separate Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Student Portal Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="group relative bg-white/[0.06] backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-7 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/70 hover:shadow-[0_0_36px_rgba(34,211,238,0.22)]"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <GraduationCap className="w-5 h-5" />
              </div>

              <h2 className="font-display text-xl font-bold text-white">
                Student Portal
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setPortalMode('student-auth')}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            >
              <span>Student Sign Up / Log In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.section>

          {/* Admin Portal Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="group relative bg-white/[0.06] backdrop-blur-xl border border-indigo-400/30 rounded-2xl p-7 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-[0_0_36px_rgba(129,140,248,0.22)]"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h2 className="font-display text-xl font-bold text-white">
                Admin Portal
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setPortalMode('admin-login')}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.38)] hover:shadow-[0_0_30px_rgba(129,140,248,0.65)]"
            >
              <span>Admin Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.section>
        </div>
      </main>

      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-400 border-t border-white/10">
        {settings.universityName} · {settings.departmentName} · Academic Term{' '}
        {settings.academicTerm}
      </footer>
    </div>
  );
}
