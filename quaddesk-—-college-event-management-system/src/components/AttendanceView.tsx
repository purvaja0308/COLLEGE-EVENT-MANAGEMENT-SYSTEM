import React, { useMemo, useState } from 'react';
import { CheckCheck, CheckCircle2, CircleDashed, Clock, XCircle } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { AttendanceStatus } from '../types/cems';
import { formatShortTime } from '../utils/formatters';

interface AttendanceViewProps {
  selectedEventId: string;
  onSelectEventId: (eventId: string) => void;
  onOpenCreateEvent: () => void;
}

export function AttendanceView({
  selectedEventId,
  onSelectEventId,
  onOpenCreateEvent,
}: AttendanceViewProps) {
  const {
    events,
    participationsByEvent,
    markAttendance,
    bulkMarkPresent,
    checkInByRollNumber,
    settings,
    accent,
  } = useCems();

  const [rollInput, setRollInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const activeEvent =
    events.find((e) => e.id === selectedEventId) ?? events[0] ?? null;

  const roster = useMemo(() => {
    if (!activeEvent) return [];
    return participationsByEvent.get(activeEvent.id) ?? [];
  }, [activeEvent, participationsByEvent]);

  const counts = useMemo(() => {
    const c = { Present: 0, Late: 0, Absent: 0, Unmarked: 0 };
    for (const r of roster) {
      c[r.attendance] += 1;
    }
    return c;
  }, [roster]);

  if (!activeEvent) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          No events available
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Create an event and add participants before taking attendance.
        </p>
        <button
          type="button"
          onClick={onOpenCreateEvent}
          className={`mt-4 px-4 py-2 text-xs font-medium rounded-lg ${accent.primaryBtn}`}
        >
          Create Event
        </button>
      </div>
    );
  }

  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const res = checkInByRollNumber(activeEvent.id, rollInput);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setRollInput('');
  };

  const handleBulkPresent = () => {
    const updated = bulkMarkPresent(activeEvent.id);
    if (updated === 0) {
      setFeedback({
        ok: false,
        text: 'All enrolled participants already have attendance marked.',
      });
    } else {
      setFeedback({
        ok: true,
        text: `Batch check-in complete: marked ${updated} unmarked students Present.`,
      });
    }
  };

  const renderStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Present</span>
          </span>
        );
      case 'Late':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Late</span>
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Absent</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CircleDashed className="w-3.5 h-3.5 shrink-0" />
            <span>Unmarked</span>
          </span>
        );
    }
  };

  const rowPad = settings.compactTables ? 'py-2 px-4' : 'py-3 px-4';

  return (
    <div className="space-y-6">
      {/* Control Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label
              htmlFor="attendance-event-select"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Event Attendance Sheet
            </label>
            <select
              id="attendance-event-select"
              value={activeEvent.id}
              onChange={(e) => {
                onSelectEventId(e.target.value);
                setFeedback(null);
              }}
              className="w-full px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.code} — {evt.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleQuickCheckIn} className="flex items-center gap-2">
            <input
              type="text"
              value={rollInput}
              onChange={(e) => setRollInput(e.target.value)}
              placeholder="Roll No check-in"
              aria-label="Quick roll number check-in"
              className="w-52 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${accent.primaryBtn}`}
            >
              Check In
            </button>
          </form>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Present:{' '}
              <strong className="font-mono tabular-nums text-green-700 dark:text-green-400">
                {counts.Present}
              </strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Late:{' '}
              <strong className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                {counts.Late}
              </strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Absent:{' '}
              <strong className="font-mono tabular-nums text-red-700 dark:text-red-400">
                {counts.Absent}
              </strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Unmarked:{' '}
              <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                {counts.Unmarked}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleBulkPresent}
            disabled={counts.Unmarked === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Mark All Unmarked Present</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 text-sm rounded-lg border ${
            feedback.ok
              ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {roster.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No participants enrolled for this event
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add participants under Event Participation to begin roll call.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Year &amp; Section</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {roster.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td
                      className={`${rowPad} font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap`}
                    >
                      {entry.rollNumber}
                    </td>
                    <td className={rowPad}>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {entry.studentName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {entry.id} · {entry.role}
                      </div>
                    </td>
                    <td
                      className={`${rowPad} text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap`}
                    >
                      {entry.year} · Sec {entry.section}
                    </td>
                    <td
                      className={`${rowPad} font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap`}
                    >
                      {formatShortTime(entry.checkedInAt)}
                    </td>
                    <td className={`${rowPad} whitespace-nowrap`}>
                      {renderStatusLabel(entry.attendance)}
                    </td>
                    <td className={`${rowPad} text-right`}>
                      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(['Present', 'Late', 'Absent'] as AttendanceStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => markAttendance(entry.id, st)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                entry.attendance === st
                                  ? st === 'Present'
                                    ? 'bg-green-700 text-white'
                                    : st === 'Late'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-red-700 text-white'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              {st}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
