import { WEEKDAYS, type LocalDate, type LocalTime, type Weekday } from './dates';
import { earnedFromLogs, type Decor, type HomeState, type Purchase } from './home';
import { catalogEntry, isCatalogId, isFloorStyle, isPaint, type ItemId, type RoomId } from './home-catalog';
import { MAX_GRACE_MINUTES } from './medication';
import { isPillIcon } from './pill-icon';
import type { DoseLog, Medication, Snooze } from './types';

// Stored data is untrusted input: an older app version, a bug, or hand-editing can leave anything there.
// These functions keep what is valid and report how much was dropped, and never throw.

export interface PersistedState {
  userName: string;
  medications: Medication[];
  logs: DoseLog[];
  /** Added in storage version 2. */
  snoozes: Snooze[];
  /** Added in storage version 3. */
  home: HomeState;
}

export interface ParsedPersisted {
  state: { userName?: string; medications: Medication[]; logs: DoseLog[]; snoozes: Snooze[]; home: HomeState };
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

function parseSnooze(v: unknown): Snooze | null {
  if (!isRecord(v)) return null;
  const { medicationId, date, time, until } = v;
  if (!isText(medicationId) || !isDate(date) || !isTime(time)) return null;
  if (typeof until !== 'string' || Number.isNaN(new Date(until).getTime())) return null;
  return { medicationId, date, time, until };
}

const DOSE_KEY = /^.+\|\d{4}-\d{2}-\d{2}\|([01]\d|2[0-3]):[0-5]\d$/;

function parsePurchase(v: unknown): Purchase | null {
  if (!isRecord(v)) return null;
  const { id, price, at } = v;
  // Something bought in a newer app version is unknown here. It is dropped (which refunds it) and counted,
  // so the raw data is backed up and nothing is lost for good.
  if (!isCatalogId(id)) return null;
  if (!Number.isInteger(price) || (price as number) < 0) return null;
  if (typeof at !== 'string' || Number.isNaN(new Date(at).getTime())) return null;
  return { id, price: price as number, at };
}

const MAX_DX = 600;

/** Cosmetic, like pill icons: anything unrecognised is ignored rather than counted as lost data. Missing before version 4. */
function parseDecor(raw: unknown): Decor {
  const decor: Decor = { items: {}, rooms: {} };
  if (!isRecord(raw)) return decor;
  for (const [id, v] of Object.entries(isRecord(raw.items) ? raw.items : {})) {
    if (!isCatalogId(id) || catalogEntry(id).kind !== 'item' || !isRecord(v)) continue;
    const dx = typeof v.dx === 'number' && Number.isFinite(v.dx) && v.dx !== 0 && Math.abs(v.dx) <= MAX_DX ? Math.round(v.dx) : undefined;
    const color = isPaint(v.color) ? v.color : undefined;
    if (dx || color) decor.items[id as ItemId] = { ...(dx ? { dx } : {}), ...(color ? { color } : {}) };
  }
  for (const [id, v] of Object.entries(isRecord(raw.rooms) ? raw.rooms : {})) {
    if (!isCatalogId(id) || catalogEntry(id).kind !== 'room' || !isRecord(v)) continue;
    const wall = isPaint(v.wall) ? v.wall : undefined;
    const floor = isFloorStyle(v.floor) ? v.floor : undefined;
    if (wall || floor) decor.rooms[id as RoomId] = { ...(wall ? { wall } : {}), ...(floor ? { floor } : {}) };
  }
  return decor;
}

/** Missing before version 3: coins are then backfilled from the on-time doses already logged. */
function parseHome(raw: unknown, medications: Medication[], logs: DoseLog[]): { home: HomeState; dropped: number } {
  const decor = { items: {}, rooms: {} };
  if (raw === undefined) return { home: { earned: earnedFromLogs(logs, medications), purchases: [], decor }, dropped: 0 };
  if (!isRecord(raw)) return { home: { earned: {}, purchases: [], decor }, dropped: 1 };
  let dropped = 0;
  const earned: Record<string, number> = {};
  for (const [key, coins] of Object.entries(isRecord(raw.earned) ? raw.earned : {})) {
    if (DOSE_KEY.test(key) && Number.isInteger(coins) && (coins as number) > 0) earned[key] = coins as number;
    else dropped++;
  }
  if (raw.earned !== undefined && !isRecord(raw.earned)) dropped++;
  const purchases: Purchase[] = [];
  for (const item of Array.isArray(raw.purchases) ? raw.purchases : []) {
    const p = parsePurchase(item);
    if (!p || purchases.some((q) => q.id === p.id)) { dropped++; continue; }
    purchases.push(p);
  }
  if (raw.purchases !== undefined && !Array.isArray(raw.purchases)) dropped++;
  return { home: { earned, purchases, decor: parseDecor(raw.decor) }, dropped };
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

  // Missing before version 2. A snooze is short-lived, so a bad one is simply dropped.
  const snoozes: Snooze[] = [];
  const rawSnoozes = Array.isArray(raw.snoozes) ? raw.snoozes : [];
  if (raw.snoozes !== undefined && !Array.isArray(raw.snoozes)) dropped++;
  for (const item of rawSnoozes) {
    const snooze = parseSnooze(item);
    if (snooze) snoozes.push(snooze);
    else dropped++;
  }

  const home = parseHome(raw.home, medications, logs);
  dropped += home.dropped;

  const hasName = isText(raw.userName);
  if (raw.userName !== undefined && !hasName) dropped++;
  return { state: { ...(hasName ? { userName: raw.userName as string } : {}), medications, logs, snoozes, home: home.home }, dropped };
}
