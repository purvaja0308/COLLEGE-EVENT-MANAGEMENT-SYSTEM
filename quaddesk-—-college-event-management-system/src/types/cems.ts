export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type ParticipantRole = 'Participant' | 'Volunteer' | 'Coordinator';

export type EventCategory =
  | 'Technical'
  | 'Workshop'
  | 'Cultural'
  | 'Seminar'
  | 'Sports';

export type EventFormat = 'In-Person' | 'Lab Session' | 'Auditorium' | 'Outdoor';

export type EventStatus = 'Open' | 'Completed' | 'Cancelled';

export type AttendanceStatus = 'Unmarked' | 'Present' | 'Late' | 'Absent';

export type PortalMode =
  | 'gateway'
  | 'student-auth'
  | 'student-portal'
  | 'admin-login'
  | 'admin-portal';

export type ActiveTab =
  | 'overview'
  | 'events'
  | 'participants'
  | 'attendance'
  | 'reports'
  | 'settings';

export type ThemeMode = 'light' | 'dark';

export type AccentColor = 'blue' | 'emerald' | 'indigo' | 'amber';

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentColor;
  universityName: string;
  departmentName: string;
  academicTerm: string;
  festName: string;
  festDateTime: string;
  compactTables: boolean;
}

export interface StudentAccount {
  id: string;
  rollNumber: string;
  fullName: string;
  gmail: string;
  year: AcademicYear;
  section: string;
  password: string;
  createdAt: string;
}

export interface CollegeEvent {
  id: string;
  code: string;
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
  status: EventStatus;
  description: string;
  imageUrl?: string;
}

export interface ParticipationEntry {
  id: string;
  eventId: string;
  rollNumber: string;
  studentName: string;
  gmail: string;
  year: AcademicYear;
  section: string;
  role: ParticipantRole;
  amountPaid: number;
  transactionRef: string;
  enrolledAt: string;
  attendance: AttendanceStatus;
  checkedInAt?: string;
}
