import { addDays, scheduledInstant, toLocalDate } from './dates';
import { doseKey, dosesForDate } from './day';
import { formatTime, medicationSubtitle } from './format';
import type { Dose, DoseLog, DoseStatus, Medication, Snooze } from './types';

// Reminders are one-time notifications, one per dose, planned from the data and then reconciled
// against what the OS has pending. Repeating triggers can't skip a single day, so a dose taken
// early would still ring. Recomputing the whole plan also covers edits, deletes and time zones.

/** Snooze re-sends the reminder later. It never moves the dose or its due/overdue window. */
export const SNOOZE_MINUTES = 10;
/** How far ahead to plan. Each launch extends it. */
export const REMINDER_HORIZON_DAYS = 14;
/** iOS keeps at most 64 pending notifications per app and silently drops the rest. */
export const MAX_PENDING_REMINDERS = 64;

export interface Reminder {
  id: string;
  /** Epoch milliseconds. */
  fireAt: number;
  title: string;
  body: string;
  dose: Dose;
}

/** What the OS reports as pending, reduced to what reconciling needs. */
export interface PendingReminder {
  id: string;
  title?: string | null;
  body?: string | null;
  fireAt?: number;
}

function reminderFor(kind: 'dose' | 'snooze', medication: Medication, dose: Dose, fireAt: number): Reminder {
  return {
    id: `${kind}|${doseKey(dose)}`,
    fireAt,
    title: `Time for ${medication.name}`,
    body: `${formatTime(dose.time)} · ${medicationSubtitle(medication)}`,
    dose,
  };
}

/**
 * Every reminder that should be pending right now, earliest first: the rest of today's and the
 * coming days' unlogged doses for medications with alerts on, plus active snoozes. Capped so
 * that the soonest ones win when there are more than the OS will hold.
 */
export function planReminders(
  medications: Medication[],
  logs: DoseLog[],
  snoozes: Snooze[],
  now: Date,
  { horizonDays = REMINDER_HORIZON_DAYS, max = MAX_PENDING_REMINDERS } = {},
): Reminder[] {
  const alerting = medications.filter((m) => m.alertsEnabled);
  const medById = new Map(alerting.map((m) => [m.id, m]));
  const logged = new Set(logs.map(doseKey));
  const t = now.getTime();
  const today = toLocalDate(now);
  const plan: Reminder[] = [];

  for (let d = 0; d < horizonDays; d++) {
    for (const dose of dosesForDate(alerting, addDays(today, d))) {
      const fireAt = scheduledInstant(dose.date, dose.time).getTime();
      if (fireAt > t && !logged.has(doseKey(dose))) plan.push(reminderFor('dose', medById.get(dose.medicationId)!, dose, fireAt));
    }
  }

  for (const s of snoozes) {
    const medication = medById.get(s.medicationId);
    const fireAt = new Date(s.until).getTime();
    // The schedule may have changed since the snooze: only remind about a dose that still exists.
    const stillScheduled = medication && dosesForDate([medication], s.date).some((d) => d.time === s.time);
    if (stillScheduled && fireAt > t && !logged.has(doseKey(s))) {
      plan.push(reminderFor('snooze', medication, { medicationId: s.medicationId, date: s.date, time: s.time }, fireAt));
    }
  }

  return plan.sort((a, b) => a.fireAt - b.fireAt || (a.id < b.id ? -1 : 1)).slice(0, max);
}

/** The smallest change that makes `pending` match `plan`. A reminder whose text or time changed is replaced. */
export function reconcileReminders(pending: PendingReminder[], plan: Reminder[]): { cancel: string[]; schedule: Reminder[] } {
  const planned = new Map(plan.map((r) => [r.id, r]));
  const kept = new Set<string>();
  const cancel: string[] = [];
  for (const p of pending) {
    const want = planned.get(p.id);
    if (want && !kept.has(p.id) && want.title === p.title && want.body === p.body && want.fireAt === p.fireAt) kept.add(p.id);
    else cancel.push(p.id);
  }
  return { cancel, schedule: plan.filter((r) => !kept.has(r.id)) };
}

/** Only a dose that is due or overdue, with alerts on, can be snoozed. */
export function canSnooze(status: DoseStatus, alertsEnabled: boolean): boolean {
  return alertsEnabled && (status === 'due' || status === 'overdue');
}

/** Snoozes `dose` from `now`, replacing any earlier snooze of it and dropping ones that have expired. */
export function snoozeDose(snoozes: Snooze[], dose: Dose, now: Date, minutes = SNOOZE_MINUTES): Snooze[] {
  const key = doseKey(dose);
  const t = now.getTime();
  const rest = snoozes.filter((s) => doseKey(s) !== key && new Date(s.until).getTime() > t);
  return [...rest, { medicationId: dose.medicationId, date: dose.date, time: dose.time, until: new Date(t + minutes * 60_000).toISOString() }];
}

/** When the dose's snoozed reminder will ring, if it is still waiting. */
export function snoozedUntil(snoozes: Snooze[], dose: Dose, now: Date): string | undefined {
  const key = doseKey(dose);
  const s = snoozes.find((x) => doseKey(x) === key);
  return s && new Date(s.until).getTime() > now.getTime() ? s.until : undefined;
}
