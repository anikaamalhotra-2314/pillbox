import { weekdayOf, type LocalDate } from './dates';
import { doseStatus, isResolved } from './status';
import type { Dose, DoseLog, DoseStatus, Medication } from './types';

export function doseKey(d: Pick<Dose, 'medicationId' | 'date' | 'time'>): string {
  return `${d.medicationId}|${d.date}|${d.time}`;
}

/** Expands medication schedules into the doses that fall on a date. */
export function dosesForDate(medications: Medication[], date: LocalDate): Dose[] {
  const weekday = weekdayOf(date);
  return medications
    .filter((m) => m.days.includes(weekday) && (!m.startDate || date >= m.startDate))
    .flatMap((m) => [...new Set(m.times)].map((time) => ({ medicationId: m.id, date, time })));
}

export interface DayEntry {
  dose: Dose;
  medication: Medication;
  log?: DoseLog;
  status: DoseStatus;
}

/**
 * Active doses first (by scheduled time), then resolved ones (also by scheduled time, not by when
 * they were logged). The medication id breaks ties so the order is stable (decision 0007).
 */
export function sortDayEntries<T extends { dose: Dose; status: DoseStatus }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const resolved = Number(isResolved(a.status)) - Number(isResolved(b.status));
    if (resolved !== 0) return resolved;
    if (a.dose.time !== b.dose.time) return a.dose.time < b.dose.time ? -1 : 1;
    return a.dose.medicationId < b.dose.medicationId ? -1 : a.dose.medicationId > b.dose.medicationId ? 1 : 0;
  });
}

/** Everything the home screen needs for one day, already ordered. */
export function buildDay(medications: Medication[], logs: DoseLog[], date: LocalDate, now: Date): DayEntry[] {
  const medById = new Map(medications.map((m) => [m.id, m]));
  const logByKey = new Map(logs.map((l) => [doseKey(l), l]));
  const entries = dosesForDate(medications, date).map((dose) => {
    const medication = medById.get(dose.medicationId)!;
    const log = logByKey.get(doseKey(dose));
    return { dose, medication, log, status: doseStatus(dose, log, now, medication.graceMinutes) };
  });
  return sortDayEntries(entries);
}
