import { dayOfMonth, monthIndexOf, weekdayOf, yearOf, type LocalDate, type LocalTime, type Weekday } from './dates';
import type { DoseStatus } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

function parts(time: LocalTime) {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`Invalid local time: ${time}`);
  const hour = Number(m[1]);
  return { hour, minute: m[2], hour12: hour % 12 === 0 ? 12 : hour % 12, pm: hour >= 12 };
}

/** '13:00' becomes '1:00pm', as designed. */
export function formatTime(time: LocalTime): string {
  const { hour12, minute, pm } = parts(time);
  return `${hour12}:${minute}${pm ? 'pm' : 'am'}`;
}

/** '13:00' becomes '1:00 PM', for screen readers. */
export function spokenTime(time: LocalTime): string {
  const { hour12, minute, pm } = parts(time);
  return `${hour12}:${minute} ${pm ? 'PM' : 'AM'}`;
}

/** The local wall-clock time an ISO timestamp falls on. */
export function localTimeOf(iso: string): LocalTime {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Short visible tag shown beside the time, so state never depends on color alone. */
export function statusLabel(status: DoseStatus, loggedAt?: string): string | undefined {
  switch (status) {
    case 'due': return 'Due now';
    case 'overdue': return 'Overdue';
    case 'missed': return 'Missed';
    case 'skipped': return 'Skipped';
    case 'taken': return loggedAt ? `Taken ${formatTime(localTimeOf(loggedAt))}` : 'Taken';
    default: return undefined; // upcoming and locked need no tag
  }
}

/** The same state as a spoken phrase. */
export function statusPhrase(status: DoseStatus, loggedAt?: string): string {
  switch (status) {
    case 'upcoming': return 'upcoming';
    case 'due': return 'due now';
    case 'overdue': return 'overdue';
    case 'missed': return 'missed';
    case 'skipped': return 'skipped';
    case 'locked': return 'scheduled, cannot be marked yet';
    case 'taken': return loggedAt ? `taken at ${spokenTime(localTimeOf(loggedAt))}` : 'taken';
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_NAMES: Record<Weekday, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export function weekdayName(weekday: Weekday): string {
  return WEEKDAY_NAMES[weekday];
}

/** '2025-03-15' becomes 'March 2025'. */
export function monthYearLabel(date: LocalDate): string {
  return `${MONTHS[monthIndexOf(date)]} ${yearOf(date)}`;
}

/** '2025-03-15' becomes 'Sat', as in the week strip. */
export function weekdayShort(date: LocalDate): string {
  const name = WEEKDAY_NAMES[weekdayOf(date)];
  return name.slice(0, 3);
}

/** '2025-03-15' becomes 'Saturday, March 15', with ', today' appended for today. */
export function spokenDate(date: LocalDate, isToday: boolean): string {
  const base = `${WEEKDAY_NAMES[weekdayOf(date)]}, ${MONTHS[monthIndexOf(date)]} ${dayOfMonth(date)}`;
  return isToday ? `${base}, today` : base;
}

export function greetingFor(now: Date): 'Morning' | 'Afternoon' | 'Evening' {
  const hour = now.getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
