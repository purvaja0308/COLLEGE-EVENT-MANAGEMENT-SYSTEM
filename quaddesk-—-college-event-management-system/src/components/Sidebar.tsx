import React from 'react';
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { ActiveTab } from '../types/cems';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'Event Adding', icon: CalendarDays },
  { id: 'participants', label: 'Participant Details', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'reports', label: 'Event Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Theme', icon: Settings },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { events, participations, settings, accent, adminLogout, adminUsername } =
    useCems();

  const countMap: Partial<Record<ActiveTab, number>> = {
    events: events.length,
    participants: participations.length,
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 block truncate">
              {settings.departmentName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
              {settings.universityName}
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-md"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-5 space-y-1" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = countMap[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 ${accent.ring} ${
                  isActive
                    ? accent.navActive
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? accent.navActiveIcon : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof count === 'number' && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive
                        ? accent.navActiveIcon
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="px-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <div className="font-medium text-slate-800 dark:text-slate-200">
            {settings.universityName}
          </div>
          <div>
            {settings.departmentName} · {settings.academicTerm}
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Admin: {adminUsername}
          </div>
        </div>
        <button
          type="button"
          onClick={adminLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[256px] shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
}
