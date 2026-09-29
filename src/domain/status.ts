import { scheduledInstant, toLocalDate } from './dates';
import { DEFAULT_GRACE_MINUTES, type Dose, type DoseLog, type DoseOutcome, type DoseStatus } from './types';

export function doseStatus(
  dose: Dose,
  log: DoseLog | undefined,
  now: Date,
  graceMinutes: number = DEFAULT_GRACE_MINUTES,
): DoseStatus {
  if (log) return log.outcome;

  const today = toLocalDate(now);
  if (dose.date > today) return 'locked';
  if (dose.date < today) return 'missed';

  const scheduled = scheduledInstant(dose.date, dose.time).getTime();
  const t = now.getTime();
  if (t < scheduled) return 'upcoming';
  if (t <= scheduled + graceMinutes * 60_000) return 'due';
  return 'overdue';
}

/** Taken and skipped doses sink to the bottom of the day (decision 0007). */
export function isResolved(status: DoseStatus): boolean {
  return status === 'taken' || status === 'skipped';
}

/** Late logging is allowed on any day up to today (decision 0008). Only future days are locked. */
export function canLog(status: DoseStatus): boolean {
  return status !== 'locked';
}

export function logDose(dose: Dose, outcome: DoseOutcome, now: Date): DoseLog {
  if (dose.date > toLocalDate(now)) throw new Error('Cannot log a dose scheduled for a future day');
  return { ...dose, outcome, loggedAt: now.toISOString() };
}

export type DoseAction = 'skip' | 'unskip' | 'edit';

/** What the dose card's "..." menu offers (decision 0011). A future dose can only be edited. */
export function doseActions(status: DoseStatus): DoseAction[] {
  if (!canLog(status)) return ['edit'];
  return [status === 'skipped' ? 'unskip' : 'skip', 'edit'];
}
