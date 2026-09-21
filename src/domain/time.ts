import type { LocalTime } from './dates';

const pad = (n: number) => String(n).padStart(2, '0');

/** A wall-clock time as the 12-hour pieces the time picker edits. */
export interface Time12 {
  hour: number; // 1-12
  minute: number; // 0-59
  pm: boolean;
}

export function to12h(time: LocalTime): Time12 {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`Invalid local time: ${time}`);
  const hour24 = Number(m[1]);
  return { hour: hour24 % 12 === 0 ? 12 : hour24 % 12, minute: Number(m[2]), pm: hour24 >= 12 };
}

export function from12h({ hour, minute, pm }: Time12): LocalTime {
  return `${pad((hour % 12) + (pm ? 12 : 0))}:${pad(minute)}`;
}

/** Whole number 1-12, or null. */
export function parseHour12(text: string): number | null {
  if (!/^\d{1,2}$/.test(text.trim())) return null;
  const n = Number(text);
  return n >= 1 && n <= 12 ? n : null;
}

/** Whole number 0-59, or null. */
export function parseMinute(text: string): number | null {
  if (!/^\d{1,2}$/.test(text.trim())) return null;
  const n = Number(text);
  return n >= 0 && n <= 59 ? n : null;
}
