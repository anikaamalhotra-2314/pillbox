import { WEEKDAYS, type LocalDate, type LocalTime, type Weekday } from './dates';
import { MAX_GRACE_MINUTES } from './medication';
import { isPillIcon } from './pill-icon';
import type { DoseLog, Medication } from './types';

// Stored data is untrusted input: an older app version, a bug, or hand-editing can leave anything there.
// These functions keep what is valid and report how much was dropped, and never throw.

export interface PersistedState {
  userName: string;
  medications: Medication[];
  logs: DoseLog[];
}

export interface ParsedPersisted {
  state: { userName?: string; medications: Medication[]; logs: DoseLog[] };
  /** How many entries were invalid and left out. The caller should back up the raw data when this is above 0. */
  dropped: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const isTime = (v: unknown): v is LocalTime => typeof v === 'string' && TIME.test(v);
const isWeekday = (v: unknown): v is Weekday => WEEKDAYS.some((w) => w === v);
function isDate(v: unknown): v is LocalDate {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d; // rejects 2025-02-30
}

function parseMedication(v: unknown): Medication | null {
  if (!isRecord(v)) return null;
  const { id, name, dosage, notes, days, times, graceMinutes, alertsEnabled, startDate, icon } = v;
  if (!isText(id) || !isText(name) || !isText(dosage)) return null;
  if (notes !== undefined && typeof notes !== 'string') return null;
  if (!Array.isArray(days) || days.length === 0 || !days.every(isWeekday)) return null;
  if (!Array.isArray(times) || times.length === 0 || !times.every(isTime)) return null;
  if (!Number.isInteger(graceMinutes) || (graceMinutes as number) < 1 || (graceMinutes as number) > MAX_GRACE_MINUTES) return null;
  if (typeof alertsEnabled !== 'boolean') return null;
  if (startDate !== undefined && !isDate(startDate)) return null;
  return {
    id, name, dosage, ...(notes ? { notes } : {}),
    days: WEEKDAYS.filter((w) => days.includes(w)),
    times: [...new Set(times)].sort(),
    graceMinutes: graceMinutes as number,
    alertsEnabled,
    ...(startDate ? { startDate } : {}),
    // Cosmetic, so an unknown icon is ignored rather than costing the user the medication.
    ...(isPillIcon(icon) ? { icon: { shape: icon.shape, color: icon.color } } : {}),
  };
}

function parseLog(v: unknown): DoseLog | null {
  if (!isRecord(v)) return null;
  const { medicationId, date, time, outcome, loggedAt } = v;
  if (!isText(medicationId) || !isDate(date) || !isTime(time)) return null;
  if (outcome !== 'taken' && outcome !== 'skipped') return null;
  if (typeof loggedAt !== 'string' || Number.isNaN(new Date(loggedAt).getTime())) return null;
  return { medicationId, date, time, outcome, loggedAt };
}

/** Returns null only when the value is not a usable state object at all. */
export function parsePersistedState(raw: unknown): ParsedPersisted | null {
  if (!isRecord(raw) || !Array.isArray(raw.medications) || !Array.isArray(raw.logs)) return null;

  let dropped = 0;
  const seenMeds = new Set<string>();
  const medications: Medication[] = [];
  for (const item of raw.medications) {
    const med = parseMedication(item);
    if (!med || seenMeds.has(med.id)) { dropped++; continue; }
    seenMeds.add(med.id);
    medications.push(med);
  }

  const seenLogs = new Set<string>();
  const logs: DoseLog[] = [];
  for (const item of raw.logs) {
    const log = parseLog(item);
    const key = log && `${log.medicationId}|${log.date}|${log.time}`;
    if (!log || !key || seenLogs.has(key)) { dropped++; continue; }
    seenLogs.add(key);
    logs.push(log);
  }

  const hasName = isText(raw.userName);
  if (raw.userName !== undefined && !hasName) dropped++;
  return { state: { ...(hasName ? { userName: raw.userName as string } : {}), medications, logs }, dropped };
}
