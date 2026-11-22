import { Menu, Plus } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { ActiveTab } from '../types/cems';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenMobileNav: () => void;
  onPrimaryAction: () => void;
}

const TAB_TITLES: Record<ActiveTab, string> = {
  overview: 'Overview',
  events: 'Event Adding & Catalog',
  participants: 'Participant Details',
  attendance: 'Attendance Management',
  reports: 'Event Reports',
  settings: 'Settings & Theme',
};

export function TopBar({ activeTab, onOpenMobileNav, onPrimaryAction }: TopBarProps) {
  const { settings, accent } = useCems();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-8 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0 truncate">
          <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
            {settings.departmentName}
          </span>
          <span className="text-slate-300 dark:text-slate-700 shrink-0" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onPrimaryAction}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${accent.primaryBtn} ${accent.ring}`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add Event</span>
        </button>
      </div>
    </header>
  );
}
