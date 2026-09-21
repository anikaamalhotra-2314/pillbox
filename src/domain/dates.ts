// Local calendar dates and wall-clock times. A dose is scheduled for a wall-clock time on a
// calendar date ("10:30 on 2025-03-15"), not for a UTC instant, so nothing here uses UTC.

export type LocalDate = string; // 'YYYY-MM-DD'
export type LocalTime = string; // 'HH:mm', 24-hour

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseLocalDate(date: LocalDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid local date: ${date}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function weekdayOf(date: LocalDate): Weekday {
  const { year, month, day } = parseLocalDate(date);
  const jsDay = new Date(year, month - 1, day).getDay(); // 0 = Sunday
  return WEEKDAYS[(jsDay + 6) % 7];
}

/** Calendar-day arithmetic, safe across month, year and DST boundaries. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const { year, month, day } = parseLocalDate(date);
  return toLocalDate(new Date(year, month - 1, day + days));
}

export function dayOfMonth(date: LocalDate): number {
  return parseLocalDate(date).day;
}

export function monthIndexOf(date: LocalDate): number {
  return parseLocalDate(date).month - 1;
}

export function yearOf(date: LocalDate): number {
  return parseLocalDate(date).year;
}

/** The moment a dose is due, in the device's local time zone. */
export function scheduledInstant(date: LocalDate, time: LocalTime): Date {
  const { year, month, day } = parseLocalDate(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!t) throw new Error(`Invalid local time: ${time}`);
  return new Date(year, month - 1, day, Number(t[1]), Number(t[2]));
}
