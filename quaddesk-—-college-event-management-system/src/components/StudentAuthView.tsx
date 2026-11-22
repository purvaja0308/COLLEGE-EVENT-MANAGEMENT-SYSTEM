import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCems } from '../context/CemsContext';
import { AcademicYear } from '../types/cems';
import { ParticleCanvas } from './ParticleCanvas';

const YEARS: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

interface PreviewMail {
  to: string;
  subject: string;
  code: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function StudentAuthView() {
  const {
    studentLogin,
    studentSignup,
    findStudentByGmail,
    resetStudentPassword,
    pendingRecovery,
    clearPendingRecovery,
    setPortalMode,
    settings,
  } = useCems();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(() =>
    pendingRecovery ? 'forgot' : 'login'
  );

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [gmail, setGmail] = useState('');
  const [year, setYear] = useState<AcademicYear>('3rd Year');
  const [section, setSection] = useState('A');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot password / normal recovery mail fields
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify-reset' | 'done'>(
    () => (pendingRecovery ? 'verify-reset' : 'request')
  );
  const [recoveryEmail, setRecoveryEmail] = useState(
    () => pendingRecovery?.gmail ?? ''
  );
  const [recoveryToken, setRecoveryToken] = useState(
    () => pendingRecovery?.token ?? ''
  );
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [testMailUrl, setTestMailUrl] = useState<string | null>(null);
  const [previewMail, setPreviewMail] = useState<PreviewMail | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pendingRecovery) {
      setMode('forgot');
      setRecoveryStep('verify-reset');
      setRecoveryEmail(pendingRecovery.gmail);
      setRecoveryToken(pendingRecovery.token);
      setRecoveryNotice(
        `Recovery link detected for ${pendingRecovery.gmail}. Enter your new password below.`
      );
      setError('');
    }
  }, [pendingRecovery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = studentLogin(identifier, loginPassword);
    if (!res.ok) setError(res.message);
    else setError('');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const res = studentSignup({
      rollNumber,
      fullName,
      gmail,
      year,
      section,
      password: signupPassword,
    });
    if (!res.ok) setError(res.message);
    else setError('');
  };

  const openForgotPassword = () => {
    const trimmed = identifier.trim().toLowerCase();
    setRecoveryEmail(trimmed.includes('@') ? trimmed : '');
    setRecoveryToken('');
    setRecoveryCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryNotice('');
    setTestMailUrl(null);
    setPreviewMail(null);
    setRecoveryStep('request');
    setError('');
    setMode('forgot');
  };

  const sendRecoveryMail = async (targetEmail: string) => {
    const normalized = targetEmail.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }

    const account = findStudentByGmail(normalized);
    if (!account) {
      setError(
        `No student account found for ${normalized}. Check your email or create an account.`
      );
      return;
    }

    setRecoveryBusy(true);
    setError('');
    setTestMailUrl(null);
    setPreviewMail(null);

    try {
      const response = await fetch('/api/student-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail: account.gmail,
          studentName: account.fullName,
          rollNumber: account.rollNumber,
          universityName: settings.universityName,
          departmentName: settings.departmentName,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        testMailUrl?: string;
        previewMail?: PreviewMail;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message || 'Could not send recovery mail.');
        return;
      }

      setRecoveryEmail(account.gmail);
      setRecoveryNotice(
        payload.message || `Recovery mail sent to ${account.gmail}.`
      );
      setTestMailUrl(
        payload.testMailUrl && payload.testMailUrl.startsWith('https://')
          ? payload.testMailUrl
          : null
      );
      setPreviewMail(payload.previewMail ?? null);
      setRecoveryStep('verify-reset');
    } catch {
      setError('Unable to reach the recovery mail service. Please try again.');
    } finally {
      setRecoveryBusy(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendRecoveryMail(recoveryEmail);
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    const account = findStudentByGmail(recoveryEmail);
    if (!account) {
      setError(
        `No student account found for ${recoveryEmail} in this browser. Sign up or restore backup first.`
      );
      return;
    }

    setRecoveryBusy(true);
    try {
      const response = await fetch('/api/student-recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail: recoveryEmail,
          code: recoveryCode.trim(),
          token: recoveryToken.trim(),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setError(
          payload.message || 'Recovery code verification failed. Please try again.'
        );
        return;
      }

      const resetRes = resetStudentPassword(recoveryEmail, newPassword);
      if (!resetRes.ok) {
        setError(resetRes.message);
        return;
      }

      setTestMailUrl(null);
      setPreviewMail(null);
      setRecoveryCode('');
      setRecoveryToken('');
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryStep('done');
    } catch {
      setError('Could not verify recovery code. Please try again.');
    } finally {
      setRecoveryBusy(false);
    }
  };

  const returnToLogin = (prefillEmail?: string) => {
    clearPendingRecovery();
    setMode('login');
    if (prefillEmail) setIdentifier(prefillEmail);
    setLoginPassword('');
    setError('');
    setRecoveryNotice('');
    setTestMailUrl(null);
    setPreviewMail(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      <ParticleCanvas />

      <div className="relative z-10 flex items-center justify-between max-w-5xl w-full mx-auto">
        <button
          type="button"
          onClick={() => {
            clearPendingRecovery();
            setPortalMode('gateway');
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-lg hover:border-cyan-400/50 transition-colors"
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
        className="relative z-10 w-full max-w-md mx-auto my-auto py-8"
      >
        <div className="bg-white/[0.07] backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-7 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
              {mode === 'forgot' ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <GraduationCap className="w-4 h-4" />
              )}
              <span>
                {mode === 'forgot' ? 'Account Recovery' : 'Student Portal'}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === 'login'
                ? 'Student Log In'
                : mode === 'signup'
                ? 'Student Sign Up'
                : 'Recover Password'}
            </h1>
            <p className="text-xs text-slate-300">
              {mode === 'login'
                ? 'Log in to view event timings, registration fees, and UPI payment.'
                : mode === 'signup'
                ? 'Create your student account with your email to register for fest events.'
                : 'Enter your registered email address to receive a 6-digit recovery code and change your password.'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'login'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'signup'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 text-xs text-red-200 bg-red-950/70 border border-red-400/40 rounded-lg"
            >
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="stu-login-id"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Email or Roll Number
                </label>
                <input
                  id="stu-login-id"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@gmail.com or 24AIML018"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="stu-login-pw"
                    className="block text-xs font-medium text-slate-200"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="stu-login-pw"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
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
                className="w-full py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]"
              >
                Log In to Student Portal
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="stu-sign-roll"
                    className="block text-xs font-medium text-slate-200 mb-1"
                  >
                    Roll Number
                  </label>
                  <input
                    id="stu-sign-roll"
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="24AIML018"
                    required
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stu-sign-name"
                    className="block text-xs font-medium text-slate-200 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="stu-sign-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Karthik S."
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="stu-sign-gmail"
                  className="block text-xs font-medium text-slate-200 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="stu-sign-gmail"
                  type="email"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="stu-sign-year"
                    className="block text-xs font-medium text-slate-200 mb-1"
                  >
                    Academic Year
                  </label>
                  <select
                    id="stu-sign-year"
                    value={year}
                    onChange={(e) => setYear(e.target.value as AcademicYear)}
                    className="w-full px-3 py-2 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y} className="bg-slate-900">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stu-sign-sec"
                    className="block text-xs font-medium text-slate-200 mb-1"
                  >
                    Section
                  </label>
                  <input
                    id="stu-sign-sec"
                    type="text"
                    maxLength={4}
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    required
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-900/75 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="stu-sign-pw"
                  className="block text-xs font-medium text-slate-200 mb-1"
                >
                  Create Password
                </label>
                <input
                  id="stu-sign-pw"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]"
              >
                Create Student Account
              </button>
            </form>
          )}

          {mode === 'forgot' && recoveryStep === 'request' && (
            <form onSubmit={handleRequestRecovery} className="space-y-4">
              <div>
                <label
                  htmlFor="stu-rec-email"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-200 mb-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Registered Email ID</span>
                </label>
                <input
                  id="stu-rec-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={recoveryBusy}
                className="w-full py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]"
              >
                {recoveryBusy ? 'Sending Recovery Mail...' : 'Send Recovery Mail'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => returnToLogin()}
                  className="text-xs text-slate-300 hover:text-white hover:underline"
                >
                  Back to Student Log In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && recoveryStep === 'verify-reset' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              {recoveryNotice && (
                <div className="p-3 text-xs text-cyan-100 bg-cyan-950/60 border border-cyan-400/35 rounded-lg leading-relaxed">
                  {recoveryNotice}
                </div>
              )}

              {previewMail && (
                <div className="p-3.5 bg-slate-900/90 border border-cyan-400/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-cyan-200">
                      Recovery Mail Dispatched
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecoveryCode(previewMail.code)}
                      className="px-2 py-1 text-[11px] font-semibold bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 rounded hover:bg-cyan-400/30"
                    >
                      Fill Code
                    </button>
                  </div>
                  <div className="text-slate-300 space-y-0.5">
                    <div>
                      To: <span className="font-mono text-white">{previewMail.to}</span>
                    </div>
                    <div>
                      Subject: <span className="text-white">{previewMail.subject}</span>
                    </div>
                    <div>
                      6-Digit Code:{' '}
                      <span className="font-mono font-bold tracking-widest text-cyan-300">
                        {previewMail.code}
                      </span>
                    </div>
                  </div>
                  {testMailUrl && (
                    <a
                      href={testMailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-300 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Dispatched Email</span>
                    </a>
                  )}
                </div>
              )}

              {!recoveryToken && (
                <div>
                  <label
                    htmlFor="stu-rec-code"
                    className="block text-xs font-medium text-slate-200 mb-1.5"
                  >
                    6-Digit Recovery Code
                  </label>
                  <input
                    id="stu-rec-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) =>
                      setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="123456"
                    required
                    className="w-full px-3.5 py-2.5 text-sm font-mono tracking-[0.3em] text-center bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="stu-rec-newpw"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="stu-rec-newpw"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
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

              <div>
                <label
                  htmlFor="stu-rec-confirmpw"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="stu-rec-confirmpw"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/75 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={recoveryBusy}
                className="w-full py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]"
              >
                {recoveryBusy ? 'Verifying & Updating...' : 'Verify & Change Password'}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  disabled={recoveryBusy}
                  onClick={() => void sendRecoveryMail(recoveryEmail)}
                  className="text-cyan-300 hover:text-cyan-200 hover:underline disabled:opacity-50"
                >
                  Resend Recovery Mail
                </button>
                <button
                  type="button"
                  onClick={() => returnToLogin()}
                  className="text-slate-300 hover:text-white hover:underline"
                >
                  Back to Log In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && recoveryStep === 'done' && (
            <div className="py-4 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-white">
                  Password Updated
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Password for <span className="font-mono text-cyan-300">{recoveryEmail}</span>{' '}
                  has been changed. Use your new password to log in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => returnToLogin(recoveryEmail)}
                className="w-full py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]"
              >
                Continue to Student Log In
              </button>
            </div>
          )}
        </div>
      </motion.main>

      <footer className="relative z-10 text-center text-xs text-slate-500">
        {settings.universityName} · {settings.departmentName}
      </footer>
    </div>
  );
}
