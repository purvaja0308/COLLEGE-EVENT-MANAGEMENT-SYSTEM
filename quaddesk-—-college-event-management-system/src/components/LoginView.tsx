import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useCems } from '../context/CemsContext';
import { ParticleCanvas } from './ParticleCanvas';

export function LoginView() {
  const { adminLogin, setPortalMode, settings } = useCems();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminLogin(username, password);
    if (!res.ok) {
      setError(res.message);
    } else {
      setError('');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      <ParticleCanvas />

      <div className="relative z-10 flex items-center justify-between max-w-5xl w-full mx-auto">
        <button
          type="button"
          onClick={() => setPortalMode('gateway')}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-lg hover:border-indigo-400/50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portals</span>
        </button>
        <div className="text-xs text-slate-400">
          {settings.universityName} · {settings.departmentName}
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-auto my-auto py-12"
      >
        <div className="bg-white/[0.07] backdrop-blur-xl border border-indigo-400/35 rounded-2xl p-8 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-6">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-indigo-300">
              {settings.universityName} · {settings.departmentName}
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Admin Sign In
            </h1>
            <p className="text-sm text-slate-300">
              Sign in with department administrator credentials to add events, inspect
              participant details, record attendance, and export reports.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 text-xs text-red-200 bg-red-950/70 border border-red-400/40 rounded-lg"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-slate-200 mb-1.5"
              >
                Admin Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-slate-200 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.38)] hover:shadow-[0_0_30px_rgba(129,140,248,0.65)]"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Admin Portal</span>
            </button>
          </form>
        </div>
      </motion.main>

      <footer className="relative z-10 text-center text-xs text-slate-500">
        {settings.universityName} · {settings.departmentName} · Academic Term{' '}
        {settings.academicTerm}
      </footer>
    </div>
  );
}
