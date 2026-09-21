import { dayOfMonth, monthIndexOf, WEEKDAYS, weekdayOf, yearOf, type LocalDate, type LocalTime, type Weekday } from './dates';
import type { DoseStatus, Medication } from './types';

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

/** The line under a medication's name: "1 pill | 125mg", or just the dosage when there are no notes. */
export function medicationSubtitle(m: Pick<Medication, 'notes' | 'dosage'>): string {
  return m.notes ? `${m.notes} | ${m.dosage}` : m.dosage;
}

/** "Anika's Medicine Cabinet", with a typographic apostrophe. */
export function cabinetTitle(userName: string): string {
  return `${userName}’s Medicine Cabinet`;
}

/** 'Every day', 'Weekdays', 'Weekends', or the short names in week order. */
export function formatDays(days: Weekday[]): string {
  const on = WEEKDAYS.filter((w) => days.includes(w));
  const same = (list: Weekday[]) => on.length === list.length && list.every((w) => on.includes(w));
  if (on.length === 7) return 'Every day';
  if (same(['mon', 'tue', 'wed', 'thu', 'fri'])) return 'Weekdays';
  if (same(['sat', 'sun'])) return 'Weekends';
  return on.map((w) => WEEKDAY_NAMES[w].slice(0, 3)).join(', ');
}

export function greetingFor(now: Date): 'Morning' | 'Afternoon' | 'Evening' {
  const hour = now.getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
