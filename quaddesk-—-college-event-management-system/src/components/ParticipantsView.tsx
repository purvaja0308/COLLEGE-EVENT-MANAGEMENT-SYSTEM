import { useMemo, useState } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { formatDisplayDate } from '../utils/formatters';

interface ParticipantsViewProps {
  selectedEventId: string;
  onSelectEventId: (eventId: string) => void;
  onOpenCreateEvent: () => void;
}

export function ParticipantsView({
  selectedEventId,
  onSelectEventId,
  onOpenCreateEvent,
}: ParticipantsViewProps) {
  const {
    events,
    participations,
    eventMap,
    removeParticipation,
    accent,
    settings,
  } = useCems();

  const [filterEventId, setFilterEventId] = useState<string>(
    selectedEventId || 'all'
  );
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participations.filter((entry) => {
      if (filterEventId !== 'all' && entry.eventId !== filterEventId) return false;
      if (!q) return true;
      const evt = eventMap.get(entry.eventId);
      return (
        entry.studentName.toLowerCase().includes(q) ||
        entry.rollNumber.toLowerCase().includes(q) ||
        entry.gmail.toLowerCase().includes(q) ||
        entry.transactionRef.toLowerCase().includes(q) ||
        (evt?.title.toLowerCase().includes(q) ?? false)
      );
    });
  }, [participations, filterEventId, search, eventMap]);

  const totalFees = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + (e.amountPaid || 0), 0),
    [filteredEntries]
  );

  const rowPad = settings.compactTables ? 'py-2 px-4' : 'py-3 px-4';

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, roll no, Gmail, or ref ID..."
              aria-label="Search participant details"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            aria-label="Filter by event"
            value={filterEventId}
            onChange={(e) => {
              setFilterEventId(e.target.value);
              if (e.target.value !== 'all') {
                onSelectEventId(e.target.value);
              }
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Events ({participations.length})</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.code} — {evt.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6 text-xs shrink-0">
          <div>
            <div className="text-slate-500 dark:text-slate-400">Participants</div>
            <div className="mt-0.5 font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {filteredEntries.length}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Fees Collected</div>
            <div className="mt-0.5 font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
              ₹{totalFees}
            </div>
          </div>
        </div>
      </div>

      {/* Participant Details Table */}
      <div className="bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {events.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No events created yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Create an event first. Students who sign up and pay via the Student Portal
              will appear here.
            </p>
            <button
              type="button"
              onClick={onOpenCreateEvent}
              className={`mt-4 px-4 py-2 text-xs font-medium rounded-lg ${accent.primaryBtn}`}
            >
              Create Event
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
            No participant registrations found for the current filter. Students can register
            through the Student Portal using QR payment &amp; Gmail.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student &amp; Gmail</th>
                  <th className="py-3 px-4">Year / Sec</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredEntries.map((entry) => {
                  const evt = eventMap.get(entry.eventId);
                  return (
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
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {entry.gmail}
                        </div>
                      </td>
                      <td
                        className={`${rowPad} text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap`}
                      >
                        {entry.year} · Sec {entry.section}
                      </td>
                      <td className={rowPad}>
                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {evt?.title ?? entry.eventId}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                          {evt ? `${formatDisplayDate(evt.date)} · ${evt.time}` : ''}
                        </div>
                      </td>
                      <td
                        className={`${rowPad} text-right font-mono text-xs tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap`}
                      >
                        {entry.amountPaid === 0 ? 'Free (₹0)' : `₹${entry.amountPaid}`}
                      </td>
                      <td
                        className={`${rowPad} font-mono text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap`}
                      >
                        {entry.transactionRef}
                      </td>
                      <td className={`${rowPad} text-right`}>
                        <button
                          type="button"
                          onClick={() => removeParticipation(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                          aria-label={`Remove ${entry.studentName}`}
                          title="Remove participant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
