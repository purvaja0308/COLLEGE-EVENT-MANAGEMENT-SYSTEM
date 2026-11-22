import React, { useRef, useState } from 'react';
import { Check, Download, Moon, ShieldAlert, Sun, Trash2, Upload } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { AccentColor, ThemeMode } from '../types/cems';

const ACCENT_OPTIONS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Cobalt Blue', swatch: 'bg-blue-700' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-emerald-700' },
  { id: 'indigo', label: 'Indigo', swatch: 'bg-indigo-700' },
  { id: 'amber', label: 'Amber', swatch: 'bg-amber-700' },
];

export function SettingsView() {
  const {
    settings,
    updateSettings,
    clearAllData,
    exportBackupJson,
    importBackupJson,
    events,
    participations,
    accent,
  } = useCems();

  const [universityName, setUniversityName] = useState(settings.universityName);
  const [departmentName, setDepartmentName] = useState(settings.departmentName);
  const [academicTerm, setAcademicTerm] = useState(settings.academicTerm);
  const [festName, setFestName] = useState(settings.festName);
  const [festDateTime, setFestDateTime] = useState(settings.festDateTime);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'apec-aiml-events-backup.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupStatus({
      ok: true,
      text: `Exported backup with ${events.length} event(s) and ${participations.length} participation record(s).`,
    });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const res = importBackupJson(content);
      setBackupStatus({ ok: res.ok, text: res.message });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      universityName: universityName.trim() || 'Adhiparasakthi Engineering College',
      departmentName: departmentName.trim() || 'AIML Department',
      academicTerm: academicTerm.trim() || '2026–2027',
      festName: festName.trim() || 'AIML Neural TechFest 2026',
      festDateTime: festDateTime || '2026-12-06T09:00',
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Theme & Appearance */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Theme &amp; Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize workspace color mode, accent color, and table display density.
          </p>
        </div>

        {/* Light / Dark Mode Switch */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Color Mode
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            {(['light', 'dark'] as ThemeMode[]).map((mode) => {
              const active = settings.theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateSettings({ theme: mode })}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5 capitalize">
                    {mode === 'light' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    <span>{mode} Mode</span>
                  </span>
                  {active && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Swatches */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Primary Accent Theme
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ACCENT_OPTIONS.map((opt) => {
              const active = settings.accent === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSettings({ accent: opt.id })}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm shrink-0 ${opt.swatch}`} />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Tables Toggle */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Compact Attendance Rows
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Reduce vertical row padding in participant and attendance tables.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.compactTables}
            onClick={() => updateSettings({ compactTables: !settings.compactTables })}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              settings.compactTables
                ? accent.primaryBtn + ' border-transparent'
                : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {settings.compactTables ? 'Enabled' : 'Standard'}
          </button>
        </div>
      </section>

      {/* Institution & Fest Countdown Settings */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Institution &amp; Fest Countdown Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Controls the live homepage countdown target, headers, and exported CSV reports.
          </p>
        </div>

        <form onSubmit={handleSaveDetails} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="set-univ"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                University / College Name
              </label>
              <input
                id="set-univ"
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="set-dept"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Department Name
              </label>
              <input
                id="set-dept"
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="set-fest"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Fest Name
              </label>
              <input
                id="set-fest"
                type="text"
                value={festName}
                onChange={(e) => setFestName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="set-fest-dt"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Fest Day Countdown Target
              </label>
              <input
                id="set-fest-dt"
                type="datetime-local"
                value={festDateTime}
                onChange={(e) => setFestDateTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="set-term"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Academic Term
              </label>
              <input
                id="set-term"
                type="text"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${accent.primaryBtn}`}
            >
              Save Details
            </button>
            {savedNotice && (
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Preferences saved.
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Backup & Restore */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Backup &amp; Restore
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export local event and participation records as JSON or restore from a saved
              snapshot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreFile}
              className="hidden"
              aria-label="Upload JSON backup file"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${accent.primaryBtn}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>
        </div>

        {backupStatus && (
          <div
            className={`px-3.5 py-2.5 text-xs rounded-lg border ${
              backupStatus.ok
                ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
            }`}
          >
            {backupStatus.text}
          </div>
        )}
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Clear Workspace Data
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Currently storing {events.length} event(s) and {participations.length} participation
            record(s).
          </p>
        </div>

        {!confirmClear ? (
          <button
            type="button"
            disabled={events.length === 0 && participations.length === 0}
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllData();
                setConfirmClear(false);
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg whitespace-nowrap"
            >
              Confirm Clear
            </button>
          </div>
        )}
      </section>

      {/* Project Scope & Production Readiness */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Prototype Scope &amp; Production Considerations
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              This mini project covers the core administrative workflow for college events:
              user and event records, participation registration, attendance entry, and basic
              report generation. It is designed as an academic desktop prototype.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Stronger Authentication
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Production deployment requires server-side authentication, hashed credentials,
              and expiring session tokens instead of a local admin gate.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Role Permissions
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Production workflows should separate permissions across Department Admins,
              Faculty Coordinators, and Check-In Volunteers.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Backup Procedures
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Browser storage should be replaced by a hosted database with automated daily
              snapshots and verified restore procedures.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Security Review
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Full input sanitization, server-side authorization checks, audit logs, and
              HTTPS hardening are recommended before public deployment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
