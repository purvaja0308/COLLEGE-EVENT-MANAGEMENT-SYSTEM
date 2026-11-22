import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, LogOut, QrCode, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useCems } from '../context/CemsContext';
import { CollegeEvent } from '../types/cems';
import { formatDisplayDate } from '../utils/formatters';
import { EventMedia } from './EventMedia';
import { LiveCountdown } from './LiveCountdown';
import { ParticleCanvas } from './ParticleCanvas';
import { StudentRegistrationModal } from './StudentRegistrationModal';

export function StudentPortal() {
  const {
    currentStudent,
    studentLogout,
    events,
    participations,
    participationsByEvent,
    eventMap,
    settings,
  } = useCems();

  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);

  const openEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (e.status !== 'Open') return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    });
  }, [events, search]);

  const myRegistrations = useMemo(() => {
    if (!currentStudent) return [];
    return participations.filter(
      (p) => p.rollNumber.toUpperCase() === currentStudent.rollNumber.toUpperCase()
    );
  }, [participations, currentStudent]);

  const myRegisteredEventIds = useMemo(
    () => new Set(myRegistrations.map((r) => r.eventId)),
    [myRegistrations]
  );

  if (!currentStudent) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <ParticleCanvas />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]"
      />

      {/* Student Portal Top Bar */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-display text-sm sm:text-base font-bold text-white truncate">
              {settings.universityName} · {settings.departmentName}
            </div>
            <div className="text-xs text-cyan-300 truncate">
              {currentStudent.fullName} ({currentStudent.rollNumber}) ·{' '}
              <span className="font-mono">{currentStudent.gmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block">
              <LiveCountdown compact />
            </div>
            <button
              type="button"
              onClick={studentLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/[0.06] border border-white/15 hover:border-red-400/50 hover:text-red-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Event Schedule &amp; Registration
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Browse available department events, timings, and registration fees. Select an
              event to pay via UPI app and confirm with your Gmail.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events or venues..."
              aria-label="Search events"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Available Events Grid (ONLY events with timing, registration fee, & registration portal) */}
        <section aria-label="Available events">
          {openEvents.length === 0 ? (
            <div className="bg-white/[0.05] backdrop-blur-xl border border-white/15 rounded-2xl p-12 text-center">
              <CalendarDays className="w-8 h-8 text-cyan-300 mx-auto mb-3" />
              <h2 className="font-display text-base font-semibold text-white">
                No open events published yet
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Events published by the AIML Department administrator will appear here with
                timings and registration fees.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openEvents.map((evt, idx) => {
                const enrolled = participationsByEvent.get(evt.id)?.length ?? 0;
                const seatsLeft = Math.max(0, evt.capacity - enrolled);
                const alreadyRegistered = myRegisteredEventIds.has(evt.id);

                return (
                  <motion.article
                    key={evt.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="bg-white/[0.06] backdrop-blur-xl border border-cyan-400/25 rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_12px_36px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-[0_0_32px_rgba(34,211,238,0.18)]"
                  >
                    <div>
                      <EventMedia
                        imageUrl={evt.imageUrl}
                        title={evt.title}
                        category={evt.category}
                        className="aspect-video w-full"
                      />
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                          <span>
                            {evt.category} <span aria-hidden="true">·</span> {evt.format}
                          </span>
                          <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                            {evt.registrationFee === 0
                              ? 'Free'
                              : `₹${evt.registrationFee}`}
                          </span>
                        </div>

                        <h2 className="font-display text-lg font-bold text-white">
                          {evt.title}
                        </h2>

                        <p className="text-xs text-slate-300 line-clamp-2">
                          {evt.description}
                        </p>

                        <dl className="pt-2 border-t border-white/10 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-slate-400 inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-cyan-300" />
                              <span>Timing</span>
                            </dt>
                            <dd className="font-mono tabular-nums text-white">
                              {formatDisplayDate(evt.date)} · {evt.time}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-slate-400">Venue</dt>
                            <dd className="text-slate-200 truncate">{evt.venue}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-slate-400">Registration Fee</dt>
                            <dd className="font-mono tabular-nums font-semibold text-cyan-300">
                              {evt.registrationFee === 0
                                ? '₹0 (Free)'
                                : `₹${evt.registrationFee}`}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-slate-400">Seats Remaining</dt>
                            <dd className="font-mono tabular-nums text-slate-200">
                              {seatsLeft} / {evt.capacity}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2">
                      {alreadyRegistered ? (
                        <div className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Registered</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={seatsLeft === 0}
                          onClick={() => setSelectedEvent(evt)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-[0_0_18px_rgba(34,211,238,0.3)] hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>
                            {seatsLeft === 0
                              ? 'Event Full'
                              : evt.registrationFee === 0
                              ? 'Register Now (Free)'
                              : `Register & Pay (₹${evt.registrationFee})`}
                          </span>
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* My Registered Events */}
        <section className="bg-white/[0.05] backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-white">
                My Registrations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmed passes linked to {currentStudent.rollNumber}
              </p>
            </div>
            <span className="font-mono text-xs tabular-nums text-cyan-300">
              {myRegistrations.length} registered
            </span>
          </div>

          {myRegistrations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              You have not registered for any events yet. Select an event above to register.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 bg-white/[0.02]">
                    <th className="py-3 px-5">Event</th>
                    <th className="py-3 px-5">Timing</th>
                    <th className="py-3 px-5">Gmail</th>
                    <th className="py-3 px-5 text-right">Amount Paid</th>
                    <th className="py-3 px-5 text-right">Reference ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {myRegistrations.map((reg) => {
                    const evt = eventMap.get(reg.eventId);
                    return (
                      <tr key={reg.id} className="hover:bg-white/[0.03]">
                        <td className="py-3 px-5 font-medium text-white">
                          {evt?.title ?? reg.eventId}
                        </td>
                        <td className="py-3 px-5 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {evt ? `${formatDisplayDate(evt.date)} · ${evt.time}` : '—'}
                        </td>
                        <td className="py-3 px-5 font-mono text-cyan-300">{reg.gmail}</td>
                        <td className="py-3 px-5 text-right font-mono tabular-nums text-white">
                          {reg.amountPaid === 0 ? 'Free (₹0)' : `₹${reg.amountPaid}`}
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-emerald-300">
                          {reg.transactionRef}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <StudentRegistrationModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
