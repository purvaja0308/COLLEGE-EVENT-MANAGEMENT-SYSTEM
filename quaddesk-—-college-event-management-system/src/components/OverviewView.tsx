import { ArrowRight, BarChart3, CalendarDays, ClipboardCheck, Settings, Users } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { ActiveTab } from '../types/cems';
import { formatDisplayDate } from '../utils/formatters';
import { EventMedia } from './EventMedia';
import { LiveCountdown } from './LiveCountdown';

interface OverviewViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenCreateEvent: () => void;
  onSelectEventForAttendance: (eventId: string) => void;
}

export function OverviewView({
  onNavigate,
  onOpenCreateEvent,
  onSelectEventForAttendance,
}: OverviewViewProps) {
  const { events, participations, participationsByEvent, settings, accent } = useCems();

  const openEvents = events.filter((e) => e.status === 'Open');
  const totalFeeCollected = participations.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const markedRegs = participations.filter((p) => p.attendance !== 'Unmarked');
  const presentOrLate = markedRegs.filter(
    (p) => p.attendance === 'Present' || p.attendance === 'Late'
  );
  const attendanceRate =
    markedRegs.length > 0 ? Math.round((presentOrLate.length / markedRegs.length) * 100) : 0;

  const featuredEvents = events.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header Intro */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {settings.universityName} · {settings.departmentName}
          </div>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            Department Event Management Portal
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Publish events with timings and registration fees, inspect participant details,
            record attendance, and export reports for {settings.academicTerm}.
          </p>
          <div className="mt-3">
            <LiveCountdown compact />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Settings &amp; Theme</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateEvent}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg whitespace-nowrap ${accent.primaryBtn}`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* 4-column flat hairline metric grid */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Events
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {openEvents.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {events.length} total scheduled
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Registered Participants
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {participations.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Verified Gmail entries
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Fees Collected
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              ₹{totalFeeCollected}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Via QR &amp; event registrations
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Verified Attendance Rate
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {attendanceRate}%
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {presentOrLate.length} of {markedRegs.length} marked check-ins
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section aria-labelledby="featured-events-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3
            id="featured-events-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Department Events
          </h3>
          {events.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className={`inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap ${accent.linkText}`}
            >
              <span>View all events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {featuredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
            <CalendarDays className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h4 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              No events created yet
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Start fresh by creating your first event for {settings.universityName} ·{' '}
              {settings.departmentName}.
            </p>
            <button
              type="button"
              onClick={onOpenCreateEvent}
              className={`mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${accent.primaryBtn}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Add First Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((evt) => {
              const enrolled = participationsByEvent.get(evt.id)?.length ?? 0;
              const pct = Math.min(100, Math.round((enrolled / evt.capacity) * 100));
              return (
                <article
                  key={evt.id}
                  className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:border-blue-500/40"
                >
                  <div>
                    <EventMedia
                      imageUrl={evt.imageUrl}
                      title={evt.title}
                      category={evt.category}
                      className="aspect-video w-full"
                    />
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {evt.category} <span aria-hidden="true">·</span>{' '}
                          {formatDisplayDate(evt.date)} <span aria-hidden="true">·</span>{' '}
                          <span className="font-mono tabular-nums">{evt.time}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-cyan-300 tabular-nums">
                          {evt.registrationFee === 0 ? 'Free' : `₹${evt.registrationFee}`}
                        </span>
                      </div>
                      <h4 className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {evt.title}
                      </h4>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {evt.description}
                      </p>
                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Venue:{' '}
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {evt.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Enrollment</span>
                        <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-200">
                          {enrolled} / {evt.capacity} seats
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${accent.progressFill}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('participants')}
                        className={`text-xs font-medium whitespace-nowrap ${accent.linkText}`}
                      >
                        Participant Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectEventForAttendance(evt.id)}
                        className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                      >
                        Attendance Desk
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Operational Workflows */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          Administrative Workflows
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Navigate directly to participant details, attendance roll call, or departmental
          reports.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('participants')}
            className="p-4 text-left border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 hover:-translate-y-0.5 flex items-start justify-between gap-3"
          >
            <span className="flex items-start gap-3">
              <Users className={`w-4 h-4 mt-0.5 shrink-0 ${accent.navActiveIcon}`} />
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Participant Details
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review student Gmail, registration fees paid, and payment references
                </span>
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="p-4 text-left border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 hover:-translate-y-0.5 flex items-start justify-between gap-3"
          >
            <span className="flex items-start gap-3">
              <ClipboardCheck className={`w-4 h-4 mt-0.5 shrink-0 ${accent.navActiveIcon}`} />
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Attendance Check-In
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mark Present, Late, or Absent by roll number or bulk check-in
                </span>
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="p-4 text-left border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 hover:-translate-y-0.5 flex items-start justify-between gap-3"
          >
            <span className="flex items-start gap-3">
              <BarChart3 className={`w-4 h-4 mt-0.5 shrink-0 ${accent.navActiveIcon}`} />
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Event Reports &amp; CSV
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View year-wise analytics, fee totals, print summaries, and export CSV
                </span>
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          </button>
        </div>
      </section>

      {/* Project Scope & Production Considerations */}
      <section className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-3xl space-y-1">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Academic Prototype Scope &amp; Production Notes
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This mini project covers the core administrative workflow for college events: user
            and event records, participation registration, attendance entry, and basic report
            generation. It is designed as an academic desktop prototype. Production deployment
            would require stronger authentication, role permissions, backup procedures, and
            security review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`text-xs font-medium whitespace-nowrap shrink-0 ${accent.linkText}`}
        >
          Backup &amp; Settings
        </button>
      </section>
    </div>
  );
}
