/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AttendanceView } from './components/AttendanceView';
import { CreateEventModal } from './components/CreateEventModal';
import { EventsView } from './components/EventsView';
import { FestSplashScreen } from './components/FestSplashScreen';
import { LoginView } from './components/LoginView';
import { OverviewView } from './components/OverviewView';
import { ParticipantsView } from './components/ParticipantsView';
import { PortalGateway } from './components/PortalGateway';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { StudentAuthView } from './components/StudentAuthView';
import { StudentPortal } from './components/StudentPortal';
import { TopBar } from './components/TopBar';
import { CemsProvider, useCems } from './context/CemsContext';
import { ActiveTab } from './types/cems';

function CemsWorkspace() {
  const { portalMode, isAdminAuthenticated, currentStudent, events } = useCems();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? '');

  const handleJumpToParticipants = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('participants');
  };

  const handleJumpToAttendance = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('attendance');
  };

  let view: React.ReactNode;

  if (portalMode === 'student-portal' && currentStudent) {
    view = <StudentPortal />;
  } else if (portalMode === 'student-auth') {
    view = <StudentAuthView />;
  } else if (portalMode === 'admin-portal' && isAdminAuthenticated) {
    view = (
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar
            activeTab={activeTab}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onPrimaryAction={() => setCreateEventModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'overview' && (
                  <OverviewView
                    onNavigate={setActiveTab}
                    onOpenCreateEvent={() => setCreateEventModalOpen(true)}
                    onSelectEventForAttendance={handleJumpToAttendance}
                  />
                )}

                {activeTab === 'events' && (
                  <EventsView
                    onOpenCreateEvent={() => setCreateEventModalOpen(true)}
                    onManageParticipation={handleJumpToParticipants}
                    onOpenAttendance={handleJumpToAttendance}
                  />
                )}

                {activeTab === 'participants' && (
                  <ParticipantsView
                    selectedEventId={selectedEventId}
                    onSelectEventId={setSelectedEventId}
                    onOpenCreateEvent={() => setCreateEventModalOpen(true)}
                  />
                )}

                {activeTab === 'attendance' && (
                  <AttendanceView
                    selectedEventId={selectedEventId}
                    onSelectEventId={setSelectedEventId}
                    onOpenCreateEvent={() => setCreateEventModalOpen(true)}
                  />
                )}

                {activeTab === 'reports' && <ReportsView />}

                {activeTab === 'settings' && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <CreateEventModal
          open={createEventModalOpen}
          onClose={() => setCreateEventModalOpen(false)}
        />
      </div>
    );
  } else if (portalMode === 'admin-login') {
    view = <LoginView />;
  } else {
    view = <PortalGateway />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <FestSplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>
      {view}
    </>
  );
}

export default function App() {
  return (
    <CemsProvider>
      <CemsWorkspace />
    </CemsProvider>
  );
}
