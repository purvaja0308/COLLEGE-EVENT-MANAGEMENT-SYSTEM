import { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { AcademicYear } from '../types/cems';
import { downloadCsv, formatDisplayDate } from '../utils/formatters';

const ALL_YEARS: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export function ReportsView() {
  const {
    events,
    participations,
    participationsByEvent,
    eventMap,
    settings,
    accent,
  } = useCems();

  const eventSummaries = useMemo(() => {
    return events.map((evt) => {
      const regs = participationsByEvent.get(evt.id) ?? [];
      const present = regs.filter((r) => r.attendance === 'Present').length;
      const late = regs.filter((r) => r.attendance === 'Late').length;
      const absent = regs.filter((r) => r.attendance === 'Absent').length;
      const unmarked = regs.filter((r) => r.attendance === 'Unmarked').length;
      const marked = present + late + absent;
      const turnoutPct = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0;
      const occupancyPct = Math.round((regs.length / evt.capacity) * 100);
      const feesCollected = regs.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
      return {
        evt,
        enrolled: regs.length,
        present,
        late,
        absent,
        unmarked,
        turnoutPct,
        occupancyPct,
        feesCollected,
      };
    });
  }, [events, participationsByEvent]);

  const yearDistribution = useMemo(() => {
    const counts = new Map<AcademicYear, number>();
    for (const y of ALL_YEARS) {
      counts.set(y, 0);
    }
    for (const p of participations) {
      counts.set(p.year, (counts.get(p.year) ?? 0) + 1);
    }
    const maxVal = Math.max(1, ...Array.from(counts.values()));
    return ALL_YEARS.map((yr) => {
      const count = counts.get(yr) ?? 0;
      return {
        year: yr,
        count,
        barPct: Math.round((count / maxVal) * 100),
      };
    });
  }, [participations]);

  const certificateEligible = useMemo(() => {
    return participations
      .filter((p) => p.attendance === 'Present' || p.attendance === 'Late')
      .map((p) => ({
        entry: p,
        evt: eventMap.get(p.eventId),
      }));
  }, [participations, eventMap]);

  const handleExportSummaryCsv = () => {
    downloadCsv(
      'apec-aiml-event-summary-report.csv',
      [
        'Institution',
        'Department',
        'Event Code',
        'Title',
        'Category',
        'Format',
        'Date',
        'Time',
        'Fee (INR)',
        'Fees Collected (INR)',
        'Capacity',
        'Enrolled',
        'Occupancy %',
        'Present',
        'Late',
        'Absent',
        'Turnout %',
      ],
      eventSummaries.map((s) => [
        settings.universityName,
        settings.departmentName,
        s.evt.code,
        s.evt.title,
        s.evt.category,
        s.evt.format,
        s.evt.date,
        s.evt.time,
        s.evt.registrationFee,
        s.feesCollected,
        s.evt.capacity,
        s.enrolled,
        `${s.occupancyPct}%`,
        s.present,
        s.late,
        s.absent,
        `${s.turnoutPct}%`,
      ])
    );
  };

  const handleExportCertificatesCsv = () => {
    downloadCsv(
      'apec-aiml-certificate-eligible-roster.csv',
      [
        'Entry ID',
        'Roll Number',
        'Student Name',
        'Gmail',
        'Year',
        'Section',
        'Event Code',
        'Event Title',
        'Amount Paid (INR)',
        'Transaction Ref',
        'Activity Credits',
        'Attendance Status',
      ],
      certificateEligible.map(({ entry, evt }) => [
        entry.id,
        entry.rollNumber,
        entry.studentName,
        entry.gmail,
        entry.year,
        entry.section,
        evt?.code ?? '',
        evt?.title ?? '',
        entry.amountPaid,
        entry.transactionRef,
        evt?.creditHours ?? 0,
        entry.attendance,
      ])
    );
  };

  return (
    <div className="space-y-8">
      {/* Report Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            {settings.departmentName} — Event Performance &amp; Attendance Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {settings.universityName} · Live aggregates for {settings.academicTerm}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            disabled={eventSummaries.length === 0}
            onClick={handleExportSummaryCsv}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${accent.primaryBtn}`}
          >
            <Download className="w-4 h-4" />
            <span>Download Summary CSV</span>
          </button>
        </div>
      </div>

      {/* Event Summary Table */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Event Turnout, Capacity &amp; Fee Matrix
          </h3>
        </div>
        {eventSummaries.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
            No events created yet. Once events and attendance are recorded, metrics will
            appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4 text-right">Enrolled / Cap</th>
                  <th className="py-3 px-4 text-right">Collected</th>
                  <th className="py-3 px-4 text-right">Present</th>
                  <th className="py-3 px-4 text-right">Late</th>
                  <th className="py-3 px-4 text-right">Absent</th>
                  <th className="py-3 px-4 text-right">Turnout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {eventSummaries.map((row) => (
                  <tr
                    key={row.evt.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {row.evt.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{row.evt.code}</span> · {row.evt.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDisplayDate(row.evt.date)} · {row.evt.time}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {row.enrolled} / {row.evt.capacity} ({row.occupancyPct}%)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      ₹{row.feesCollected}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-green-700 dark:text-green-400">
                      {row.present}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-amber-700 dark:text-amber-400">
                      {row.late}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-red-700 dark:text-red-400">
                      {row.absent}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {row.turnoutPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Two-Column Split: Year-wise Participation + Certificate Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Participation by Academic Year
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution across {settings.departmentName} student cohorts
            </p>
          </div>

          <div className="space-y-4">
            {yearDistribution.map((item) => (
              <div key={item.year} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.year}
                  </span>
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {item.count} enrollments
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all ${accent.progressFill}`}
                    style={{ width: `${item.count === 0 ? 0 : item.barPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Certificate-Eligible Attendees
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Students verified Present or Late ({certificateEligible.length})
              </p>
            </div>
            <button
              type="button"
              disabled={certificateEligible.length === 0}
              onClick={handleExportCertificatesCsv}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap no-print disabled:opacity-40 disabled:cursor-not-allowed ${accent.softBtn}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Roster CSV</span>
            </button>
          </div>

          {certificateEligible.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No verified Present or Late records yet. Mark attendance to generate certificate
              lists.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto">
              {certificateEligible.map(({ entry, evt }) => (
                <li
                  key={entry.id}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {entry.studentName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      <span className="font-mono">{entry.rollNumber}</span> · {entry.gmail} ·{' '}
                      {evt?.title ?? entry.eventId}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs tabular-nums font-medium text-slate-800 dark:text-slate-200">
                      {evt?.creditHours ?? 0} credits
                    </div>
                    <div
                      className={`text-[11px] font-medium ${
                        entry.attendance === 'Present'
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {entry.attendance}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
