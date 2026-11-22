import { useMemo, useState } from 'react';
import { CalendarPlus, Search, Trash2 } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { EventCategory, EventStatus } from '../types/cems';
import { formatDisplayDate } from '../utils/formatters';
import { EventMedia } from './EventMedia';

interface EventsViewProps {
  onOpenCreateEvent: () => void;
  onManageParticipation: (eventId: string) => void;
  onOpenAttendance: (eventId: string) => void;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Technical',
  'Workshop',
  'Cultural',
  'Seminar',
  'Sports',
];

const STATUSES: EventStatus[] = ['Open', 'Completed', 'Cancelled'];

export function EventsView({
  onOpenCreateEvent,
  onManageParticipation,
  onOpenAttendance,
}: EventsViewProps) {
  const { events, participationsByEvent, updateEventStatus, deleteEvent, accent } = useCems();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EventCategory>('All');

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((evt) => {
      if (categoryFilter !== 'All' && evt.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.code.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q)
      );
    });
  }, [events, categoryFilter, search]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title, code, or venue..."
              aria-label="Search events"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateEvent}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg whitespace-nowrap shrink-0 ${accent.primaryBtn}`}
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Catalog */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {events.length === 0
              ? 'No events scheduled yet'
              : 'No events match your filters'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {events.length === 0
              ? 'Create a department event with timing and registration fee to publish it.'
              : 'Clear your search or publish a new campus event.'}
          </p>
          <button
            type="button"
            onClick={onOpenCreateEvent}
            className={`mt-4 px-4 py-2 text-xs font-medium rounded-lg ${accent.primaryBtn}`}
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
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
                      <span className="truncate">
                        {evt.code} <span aria-hidden="true">·</span> {evt.format}
                      </span>
                      <span
                        className={`font-medium shrink-0 ${
                          evt.status === 'Open'
                            ? 'text-green-700 dark:text-green-400'
                            : evt.status === 'Completed'
                            ? 'text-slate-600 dark:text-slate-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>

                    <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {evt.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {evt.description}
                    </p>

                    <dl className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400">Timing</dt>
                        <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {formatDisplayDate(evt.date)} · {evt.time}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400">Registration Fee</dt>
                        <dd className="font-mono tabular-nums font-semibold text-slate-900 dark:text-cyan-300">
                          {evt.registrationFee === 0
                            ? 'Free (₹0)'
                            : `₹${evt.registrationFee}${evt.paymentQrUrl ? ' · Custom QR' : ''}`}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400">Venue</dt>
                        <dd className="text-slate-800 dark:text-slate-200 text-right truncate">
                          {evt.venue}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400">Coordinator</dt>
                        <dd className="text-slate-800 dark:text-slate-200 truncate">
                          {evt.coordinatorName}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Seat Occupancy</span>
                      <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                        {enrolled} / {evt.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          enrolled >= evt.capacity ? 'bg-amber-600' : accent.progressFill
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Event status for ${evt.title}`}
                        value={evt.status}
                        onChange={(e) =>
                          updateEventStatus(evt.id, e.target.value as EventStatus)
                        }
                        className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => deleteEvent(evt.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                        aria-label={`Delete ${evt.title}`}
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onManageParticipation(evt.id)}
                        className={`text-xs font-medium whitespace-nowrap ${accent.linkText}`}
                      >
                        Participants
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAttendance(evt.id)}
                        className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                      >
                        Attendance
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
