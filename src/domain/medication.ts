import { WEEKDAYS, type LocalDate, type LocalTime, type Weekday } from './dates';
import { DEFAULT_GRACE_MINUTES, type Medication } from './types';

/** Alphabetical, ignoring case and accents; ties keep their original order. */
export function sortMedications(medications: Medication[]): Medication[] {
  return [...medications].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export const MAX_GRACE_MINUTES = 180;

/** The add/edit form's state. Fields are text as typed; `toMedication` turns them into the real thing. */
export interface MedicationDraft {
  name: string;
  dosage: string;
  notes: string;
  days: Weekday[];
  times: LocalTime[];
  graceMinutes: string;
  alertsEnabled: boolean;
}

export function emptyDraft(): MedicationDraft {
  return {
    name: '',
    dosage: '',
    notes: '',
    days: [...WEEKDAYS],
    times: [],
    graceMinutes: String(DEFAULT_GRACE_MINUTES),
    alertsEnabled: true,
  };
}

export function toDraft(m: Medication): MedicationDraft {
  return {
    name: m.name,
    dosage: m.dosage,
    notes: m.notes ?? '',
    days: [...m.days],
    times: [...m.times],
    graceMinutes: String(m.graceMinutes),
    alertsEnabled: m.alertsEnabled,
  };
}

export interface DraftErrors {
  name?: string;
  dosage?: string;
  days?: string;
  times?: string;
  graceMinutes?: string;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Title and dosage are required; notes are not (decision 0010). */
export function validateDraft(d: MedicationDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!d.name.trim()) errors.name = 'Add a medication title.';
  if (!d.dosage.trim()) errors.dosage = 'Add a dosage.';
  if (d.days.length === 0) errors.days = 'Pick at least one day.';
  if (d.times.length === 0) errors.times = 'Add at least one time.';
  const grace = Number(d.graceMinutes);
  if (!/^\d+$/.test(d.graceMinutes.trim()) || grace < 1 || grace > MAX_GRACE_MINUTES) {
    errors.graceMinutes = `Enter a whole number from 1 to ${MAX_GRACE_MINUTES}.`;
  }
  return errors;
}

/** Assumes the draft is valid. Trims text, drops empty notes, and orders days and times. */
export function toMedication(d: MedicationDraft, id: string, startDate?: LocalDate): Medication {
  const notes = d.notes.trim();
  return {
    id,
    name: d.name.trim(),
    dosage: d.dosage.trim(),
    ...(notes ? { notes } : {}),
    days: WEEKDAYS.filter((w) => d.days.includes(w)),
    times: [...new Set(d.times)].sort(),
    graceMinutes: Number(d.graceMinutes),
    alertsEnabled: d.alertsEnabled,
    ...(startDate ? { startDate } : {}),
  };
}

/** Applies an edited draft to an existing medication, keeping its id and start date. */
export function updatedMedication(existing: Medication, d: MedicationDraft): Medication {
  return toMedication(d, existing.id, existing.startDate);
}

/** Adds a time (or swaps `replacing` for it), keeping the list sorted and free of duplicates. */
export function withTime(times: LocalTime[], time: LocalTime, replacing?: LocalTime): LocalTime[] {
  const rest = replacing ? times.filter((t) => t !== replacing) : times;
  return [...new Set([...rest, time])].sort();
}
