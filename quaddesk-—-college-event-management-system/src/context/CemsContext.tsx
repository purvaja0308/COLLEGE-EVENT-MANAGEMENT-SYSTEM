import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AcademicYear,
  AppSettings,
  AttendanceStatus,
  CollegeEvent,
  EventCategory,
  EventFormat,
  EventStatus,
  ParticipantRole,
  ParticipationEntry,
  PortalMode,
  StudentAccount,
} from '../types/cems';
import { ACCENT_TOKENS, AccentTokens } from '../utils/theme';

const DATA_STORAGE_KEY = 'apec_aiml_cems_data_v3';
const SETTINGS_STORAGE_KEY = 'apec_aiml_cems_settings_v3';
const ADMIN_SESSION_KEY = 'apec_aiml_admin_session_v3';
const STUDENT_SESSION_KEY = 'apec_aiml_student_session_v3';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accent: 'blue',
  universityName: 'Adhiparasakthi Engineering College',
  departmentName: 'AIML Department',
  academicTerm: '2026–2027',
  festName: 'AIML Neural TechFest 2026',
  festDateTime: '2026-12-06T09:00',
  compactTables: false,
};

interface PersistedData {
  events: CollegeEvent[];
  participations: ParticipationEntry[];
  studentAccounts: StudentAccount[];
}

export interface CreateEventInput {
  title: string;
  category: EventCategory;
  format: EventFormat;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  registrationFee: number;
  paymentQrUrl?: string;
  upiId?: string;
  coordinatorName: string;
  creditHours: number;
  description: string;
  imageUrl?: string;
}

export interface StudentSignupInput {
  rollNumber: string;
  fullName: string;
  gmail: string;
  year: AcademicYear;
  section: string;
  password: string;
}

export interface AddParticipantInput {
  eventId: string;
  rollNumber: string;
  studentName: string;
  gmail: string;
  year: AcademicYear;
  section: string;
  role: ParticipantRole;
  amountPaid?: number;
  transactionRef?: string;
}

export interface StudentEventRegistrationInput {
  eventId: string;
  gmail: string;
  transactionRef: string;
}

interface ActionResult {
  ok: boolean;
  message: string;
}

interface CemsContextValue {
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  isAdminAuthenticated: boolean;
  adminUsername: string;
  adminLogin: (username: string, password: string) => ActionResult;
  adminLogout: () => void;
  currentStudent: StudentAccount | null;
  studentAccounts: StudentAccount[];
  pendingRecovery: { gmail: string; token: string } | null;
  clearPendingRecovery: () => void;
  findStudentByGmail: (gmail: string) => StudentAccount | null;
  resetStudentPassword: (gmail: string, newPassword: string) => ActionResult;
  studentSignup: (input: StudentSignupInput) => ActionResult;
  studentLogin: (identifier: string, password: string) => ActionResult;
  studentLogout: () => void;
  events: CollegeEvent[];
  participations: ParticipationEntry[];
  settings: AppSettings;
  accent: AccentTokens;
  updateSettings: (partial: Partial<AppSettings>) => void;
  createEvent: (input: CreateEventInput) => ActionResult;
  updateEventStatus: (eventId: string, status: EventStatus) => void;
  deleteEvent: (eventId: string) => void;
  addParticipantToEvent: (input: AddParticipantInput) => ActionResult;
  registerStudentForEvent: (input: StudentEventRegistrationInput) => ActionResult;
  removeParticipation: (entryId: string) => void;
  markAttendance: (entryId: string, status: AttendanceStatus) => void;
  bulkMarkPresent: (eventId: string) => number;
  checkInByRollNumber: (eventId: string, rollNumber: string) => ActionResult;
  clearAllData: () => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => ActionResult;
  participationsByEvent: Map<string, ParticipationEntry[]>;
  eventMap: Map<string, CollegeEvent>;
}

const CemsContext = createContext<CemsContextValue | null>(null);

function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedData>;
      return {
        events: Array.isArray(parsed.events) ? parsed.events : [],
        participations: Array.isArray(parsed.participations) ? parsed.participations : [],
        studentAccounts: Array.isArray(parsed.studentAccounts) ? parsed.studentAccounts : [],
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return { events: [], participations: [], studentAccounts: [] };
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const merged = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
      if (merged.festName === 'AIML Zenith TechFest 2026') {
        merged.festName = 'AIML Neural TechFest 2026';
      }
      return merged;
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_SETTINGS;
}

function loadAdminAuth(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'aimldep';
  } catch {
    return false;
  }
}

function loadStudentSessionId(): string | null {
  try {
    return sessionStorage.getItem(STUDENT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function CemsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PersistedData>(loadData);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(loadAdminAuth);
  const [studentSessionId, setStudentSessionId] = useState<string | null>(
    loadStudentSessionId
  );

  const [pendingRecovery, setPendingRecovery] = useState<{
    gmail: string;
    token: string;
  } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('recoveryToken')?.trim() ?? '';
      const gmail = params.get('gmail')?.trim().toLowerCase() ?? '';
      if (/^[a-f0-9]{48}$/i.test(token) && gmail.includes('@')) {
        return { gmail, token };
      }
    } catch {
      // Ignore URL parse errors
    }
    return null;
  });

  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('recoveryToken')?.trim() ?? '';
      const gmail = params.get('gmail')?.trim() ?? '';
      if (/^[a-f0-9]{48}$/i.test(token) && gmail.includes('@')) {
        return 'student-auth';
      }
    } catch {
      // Ignore
    }
    if (loadAdminAuth()) return 'admin-portal';
    if (loadStudentSessionId()) return 'student-portal';
    return 'gateway';
  });

  useEffect(() => {
    if (pendingRecovery) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // Ignore history errors
      }
    }
  }, [pendingRecovery]);

  const currentStudent = useMemo(() => {
    if (!studentSessionId) return null;
    return data.studentAccounts.find((s) => s.id === studentSessionId) ?? null;
  }, [data.studentAccounts, studentSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore quota errors
    }
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  const adminLogin = (username: string, password: string): ActionResult => {
    if (username.trim() === 'aimldep' && password === '@!m132') {
      setIsAdminAuthenticated(true);
      setPortalMode('admin-portal');
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'aimldep');
      } catch {
        // Ignore sessionStorage errors
      }
      return { ok: true, message: 'Signed in as aimldep.' };
    }
    return { ok: false, message: 'Invalid admin username or password.' };
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    setPortalMode('gateway');
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
  };

  const studentSignup = (input: StudentSignupInput): ActionResult => {
    const roll = input.rollNumber.trim().toUpperCase();
    const fullName = input.fullName.trim();
    const gmail = input.gmail.trim().toLowerCase();
    const section = input.section.trim().toUpperCase() || 'A';
    const password = input.password;

    if (!roll || !fullName || !gmail || !password) {
      return { ok: false, message: 'All fields including Gmail and password are required.' };
    }
    if (!gmail.endsWith('@gmail.com') && !gmail.includes('@')) {
      return { ok: false, message: 'Please enter a valid Gmail address.' };
    }
    if (password.length < 4) {
      return { ok: false, message: 'Password must be at least 4 characters.' };
    }
    if (data.studentAccounts.some((s) => s.rollNumber.toUpperCase() === roll)) {
      return { ok: false, message: `Roll number ${roll} is already signed up.` };
    }
    if (data.studentAccounts.some((s) => s.gmail.toLowerCase() === gmail)) {
      return { ok: false, message: `Gmail ${gmail} is already registered.` };
    }

    const account: StudentAccount = {
      id: `stu-${Date.now()}`,
      rollNumber: roll,
      fullName,
      gmail,
      year: input.year,
      section,
      password,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      studentAccounts: [account, ...prev.studentAccounts],
    }));
    setStudentSessionId(account.id);
    setPortalMode('student-portal');
    try {
      sessionStorage.setItem(STUDENT_SESSION_KEY, account.id);
    } catch {
      // Ignore
    }
    return { ok: true, message: `Welcome, ${fullName}!` };
  };

  const studentLogin = (identifier: string, password: string): ActionResult => {
    const query = identifier.trim().toLowerCase();
    if (!query || !password) {
      return { ok: false, message: 'Enter your Gmail or Roll Number and password.' };
    }
    const found = data.studentAccounts.find(
      (s) =>
        (s.gmail.toLowerCase() === query || s.rollNumber.toLowerCase() === query) &&
        s.password === password
    );
    if (!found) {
      return { ok: false, message: 'Invalid student credentials. Please check or sign up.' };
    }
    setStudentSessionId(found.id);
    setPortalMode('student-portal');
    try {
      sessionStorage.setItem(STUDENT_SESSION_KEY, found.id);
    } catch {
      // Ignore
    }
    return { ok: true, message: `Signed in as ${found.fullName}.` };
  };

  const studentLogout = () => {
    setStudentSessionId(null);
    setPortalMode('gateway');
    try {
      sessionStorage.removeItem(STUDENT_SESSION_KEY);
    } catch {
      // Ignore
    }
  };

  const clearPendingRecovery = () => {
    setPendingRecovery(null);
  };

  const findStudentByGmail = (gmail: string): StudentAccount | null => {
    const normalized = gmail.trim().toLowerCase();
    if (!normalized) return null;
    return data.studentAccounts.find((s) => s.gmail.toLowerCase() === normalized) ?? null;
  };

  const resetStudentPassword = (gmail: string, newPassword: string): ActionResult => {
    const normalized = gmail.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      return { ok: false, message: 'A valid Gmail address is required.' };
    }
    if (newPassword.length < 4) {
      return { ok: false, message: 'New password must be at least 4 characters.' };
    }
    const exists = data.studentAccounts.some(
      (s) => s.gmail.toLowerCase() === normalized
    );
    if (!exists) {
      return {
        ok: false,
        message: 'No student account found with that Gmail address.',
      };
    }

    setData((prev) => ({
      ...prev,
      studentAccounts: prev.studentAccounts.map((s) =>
        s.gmail.toLowerCase() === normalized ? { ...s, password: newPassword } : s
      ),
    }));
    setPendingRecovery(null);
    return {
      ok: true,
      message: 'Your password has been updated. You can now log in.',
    };
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const createEvent = (input: CreateEventInput): ActionResult => {
    const title = input.title.trim();
    const venue = input.venue.trim();
    const coordinatorName = input.coordinatorName.trim();

    if (!title || !venue || !input.date || !input.time || !coordinatorName) {
      return {
        ok: false,
        message: 'Title, date, time, venue, and coordinator name are required.',
      };
    }
    if (input.capacity < 1 || input.capacity > 2000) {
      return { ok: false, message: 'Capacity must be between 1 and 2000.' };
    }
    if (input.registrationFee < 0 || input.registrationFee > 50000) {
      return { ok: false, message: 'Registration amount must be ₹0 or greater.' };
    }

    const prefixMap: Record<EventCategory, string> = {
      Technical: 'TECH',
      Workshop: 'WORK',
      Cultural: 'CULT',
      Seminar: 'SEM',
      Sports: 'SPRT',
    };
    const nextNum = String(data.events.length + 1).padStart(2, '0');
    const code = `AIML-${prefixMap[input.category]}-${nextNum}`;

    const newEvent: CollegeEvent = {
      id: `evt-${Date.now()}`,
      code,
      title,
      category: input.category,
      format: input.format,
      date: input.date,
      time: input.time,
      venue,
      capacity: Number(input.capacity),
      registrationFee: Number(input.registrationFee) || 0,
      paymentQrUrl: input.paymentQrUrl?.trim() || undefined,
      upiId: input.upiId?.trim() || undefined,
      coordinatorName,
      creditHours: Number(input.creditHours) || 2,
      status: 'Open',
      description:
        input.description.trim() || `${input.category} event hosted at ${venue}.`,
      imageUrl: input.imageUrl,
    };

    setData((prev) => ({
      ...prev,
      events: [newEvent, ...prev.events],
    }));

    return { ok: true, message: `Event "${title}" created (${code}).` };
  };

  const updateEventStatus = (eventId: string, status: EventStatus) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === eventId ? { ...e, status } : e)),
    }));
  };

  const deleteEvent = (eventId: string) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== eventId),
      participations: prev.participations.filter((p) => p.eventId !== eventId),
    }));
  };

  const addParticipantToEvent = (input: AddParticipantInput): ActionResult => {
    const evt = data.events.find((e) => e.id === input.eventId);
    if (!evt) {
      return { ok: false, message: 'Selected event was not found.' };
    }
    if (evt.status !== 'Open') {
      return { ok: false, message: `Enrollment closed: event is ${evt.status}.` };
    }

    const roll = input.rollNumber.trim().toUpperCase();
    const name = input.studentName.trim();
    const gmail = input.gmail.trim().toLowerCase();
    const section = input.section.trim().toUpperCase() || 'A';

    if (!roll || !name || !gmail) {
      return { ok: false, message: 'Roll number, student name, and Gmail are required.' };
    }

    const currentForEvent = data.participations.filter((p) => p.eventId === evt.id);
    if (currentForEvent.some((p) => p.rollNumber.toUpperCase() === roll)) {
      return {
        ok: false,
        message: `${roll} is already enrolled in ${evt.title}.`,
      };
    }
    if (currentForEvent.length >= evt.capacity) {
      return {
        ok: false,
        message: `Seat capacity reached (${evt.capacity}/${evt.capacity}).`,
      };
    }

    const maxNum = data.participations.reduce((max, p) => {
      const n = parseInt(p.id.replace(/\D/g, ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 1000);
    const entryId = `PT-${maxNum + 1}`;

    const entry: ParticipationEntry = {
      id: entryId,
      eventId: evt.id,
      rollNumber: roll,
      studentName: name,
      gmail,
      year: input.year,
      section,
      role: input.role,
      amountPaid:
        typeof input.amountPaid === 'number' ? input.amountPaid : evt.registrationFee,
      transactionRef: input.transactionRef?.trim() || `ADM-${Date.now().toString().slice(-6)}`,
      enrolledAt: new Date().toISOString(),
      attendance: 'Unmarked',
    };

    setData((prev) => ({
      ...prev,
      participations: [entry, ...prev.participations],
    }));

    return { ok: true, message: `Added ${name} (${roll}) to ${evt.title}.` };
  };

  const registerStudentForEvent = (
    input: StudentEventRegistrationInput
  ): ActionResult => {
    if (!currentStudent) {
      return { ok: false, message: 'Please sign in as a student first.' };
    }
    const evt = data.events.find((e) => e.id === input.eventId);
    if (!evt) {
      return { ok: false, message: 'Event not found.' };
    }
    const gmail = input.gmail.trim().toLowerCase();
    if (!gmail || !gmail.includes('@')) {
      return { ok: false, message: 'A valid Gmail address is required.' };
    }
    if (evt.registrationFee > 0 && !input.transactionRef.trim()) {
      return {
        ok: false,
        message: 'Complete the QR payment scan or enter the UPI transaction reference.',
      };
    }

    return addParticipantToEvent({
      eventId: evt.id,
      rollNumber: currentStudent.rollNumber,
      studentName: currentStudent.fullName,
      gmail,
      year: currentStudent.year,
      section: currentStudent.section,
      role: 'Participant',
      amountPaid: evt.registrationFee,
      transactionRef:
        evt.registrationFee === 0
          ? 'FREE-PASS'
          : input.transactionRef.trim().toUpperCase(),
    });
  };

  const removeParticipation = (entryId: string) => {
    setData((prev) => ({
      ...prev,
      participations: prev.participations.filter((p) => p.id !== entryId),
    }));
  };

  const markAttendance = (entryId: string, status: AttendanceStatus) => {
    const checkedInAt =
      status === 'Present' || status === 'Late' ? new Date().toISOString() : undefined;
    setData((prev) => ({
      ...prev,
      participations: prev.participations.map((p) =>
        p.id === entryId ? { ...p, attendance: status, checkedInAt } : p
      ),
    }));
  };

  const bulkMarkPresent = (eventId: string): number => {
    const targets = data.participations.filter(
      (p) => p.eventId === eventId && p.attendance === 'Unmarked'
    );
    if (targets.length === 0) return 0;
    const now = new Date().toISOString();
    const targetIds = new Set(targets.map((t) => t.id));

    setData((prev) => ({
      ...prev,
      participations: prev.participations.map((p) =>
        targetIds.has(p.id) ? { ...p, attendance: 'Present', checkedInAt: now } : p
      ),
    }));
    return targets.length;
  };

  const checkInByRollNumber = (eventId: string, rollNumber: string): ActionResult => {
    const normalized = rollNumber.trim().toUpperCase();
    if (!normalized) {
      return { ok: false, message: 'Enter a roll number to check in.' };
    }
    const entry = data.participations.find(
      (p) => p.eventId === eventId && p.rollNumber.toUpperCase() === normalized
    );
    if (!entry) {
      return {
        ok: false,
        message: `Roll number ${normalized} is not enrolled in this event.`,
      };
    }
    markAttendance(entry.id, 'Present');
    return {
      ok: true,
      message: `Checked in ${entry.studentName} (${normalized}) as Present.`,
    };
  };

  const clearAllData = () => {
    setData({ events: [], participations: [], studentAccounts: [] });
  };

  const exportBackupJson = (): string => {
    return JSON.stringify(
      {
        application: 'QuadDesk',
        institution: settings.universityName,
        department: settings.departmentName,
        academicTerm: settings.academicTerm,
        exportedAt: new Date().toISOString(),
        events: data.events,
        participations: data.participations,
        studentAccounts: data.studentAccounts,
      },
      null,
      2
    );
  };

  const importBackupJson = (rawJson: string): ActionResult => {
    try {
      const parsed = JSON.parse(rawJson) as {
        events?: unknown;
        participations?: unknown;
        studentAccounts?: unknown;
      };
      if (!Array.isArray(parsed.events) || !Array.isArray(parsed.participations)) {
        return {
          ok: false,
          message: 'Invalid backup file: expected "events" and "participations" arrays.',
        };
      }
      const nextEvents = parsed.events as CollegeEvent[];
      const nextParticipations = parsed.participations as ParticipationEntry[];
      const nextAccounts = Array.isArray(parsed.studentAccounts)
        ? (parsed.studentAccounts as StudentAccount[])
        : data.studentAccounts;
      setData({
        events: nextEvents,
        participations: nextParticipations,
        studentAccounts: nextAccounts,
      });
      return {
        ok: true,
        message: `Restored ${nextEvents.length} event(s) and ${nextParticipations.length} participation record(s).`,
      };
    } catch {
      return { ok: false, message: 'Could not parse JSON backup file.' };
    }
  };

  const derived = useMemo(() => {
    const eventMap = new Map<string, CollegeEvent>();
    for (const e of data.events) {
      eventMap.set(e.id, e);
    }

    const participationsByEvent = new Map<string, ParticipationEntry[]>();
    for (const e of data.events) {
      participationsByEvent.set(e.id, []);
    }
    for (const p of data.participations) {
      const list = participationsByEvent.get(p.eventId);
      if (list) list.push(p);
    }

    return {
      eventMap,
      participationsByEvent,
    };
  }, [data.events, data.participations]);

  const value: CemsContextValue = {
    portalMode,
    setPortalMode,
    isAdminAuthenticated,
    adminUsername: 'aimldep',
    adminLogin,
    adminLogout,
    currentStudent,
    studentAccounts: data.studentAccounts,
    pendingRecovery,
    clearPendingRecovery,
    findStudentByGmail,
    resetStudentPassword,
    studentSignup,
    studentLogin,
    studentLogout,
    events: data.events,
    participations: data.participations,
    settings,
    accent: ACCENT_TOKENS[settings.accent],
    updateSettings,
    createEvent,
    updateEventStatus,
    deleteEvent,
    addParticipantToEvent,
    registerStudentForEvent,
    removeParticipation,
    markAttendance,
    bulkMarkPresent,
    checkInByRollNumber,
    clearAllData,
    exportBackupJson,
    importBackupJson,
    ...derived,
  };

  return <CemsContext.Provider value={value}>{children}</CemsContext.Provider>;
}

export function useCems() {
  const ctx = useContext(CemsContext);
  if (!ctx) throw new Error('useCems must be used inside CemsProvider');
  return ctx;
}
