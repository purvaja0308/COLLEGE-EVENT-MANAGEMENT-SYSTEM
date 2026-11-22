import { AccentColor } from '../types/cems';

export interface AccentTokens {
  primaryBtn: string;
  navActive: string;
  navActiveIcon: string;
  linkText: string;
  progressFill: string;
  softBtn: string;
  ring: string;
}

export const ACCENT_TOKENS: Record<AccentColor, AccentTokens> = {
  blue: {
    primaryBtn: 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white',
    navActive: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    navActiveIcon: 'text-blue-700 dark:text-blue-300',
    linkText: 'text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
    progressFill: 'bg-blue-700 dark:bg-blue-500',
    softBtn: 'text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/60 dark:hover:bg-blue-900/60',
    ring: 'focus-visible:ring-blue-600 focus:ring-blue-600',
  },
  emerald: {
    primaryBtn: 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white',
    navActive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    navActiveIcon: 'text-emerald-700 dark:text-emerald-300',
    linkText: 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300',
    progressFill: 'bg-emerald-700 dark:bg-emerald-500',
    softBtn: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60',
    ring: 'focus-visible:ring-emerald-600 focus:ring-emerald-600',
  },
  indigo: {
    primaryBtn: 'bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white',
    navActive: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    navActiveIcon: 'text-indigo-700 dark:text-indigo-300',
    linkText: 'text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300',
    progressFill: 'bg-indigo-700 dark:bg-indigo-500',
    softBtn: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60',
    ring: 'focus-visible:ring-indigo-600 focus:ring-indigo-600',
  },
  amber: {
    primaryBtn: 'bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white',
    navActive: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    navActiveIcon: 'text-amber-700 dark:text-amber-300',
    linkText: 'text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300',
    progressFill: 'bg-amber-700 dark:bg-amber-500',
    softBtn: 'text-amber-800 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60 dark:hover:bg-amber-900/60',
    ring: 'focus-visible:ring-amber-600 focus:ring-amber-600',
  },
};
