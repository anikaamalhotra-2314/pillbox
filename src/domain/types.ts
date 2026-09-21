import type { LocalDate, LocalTime, Weekday } from './dates';
import type { PillIcon } from './pill-icon';

/** Default minutes after the scheduled time that a dose still counts as "due" (decision 0008). */
export const DEFAULT_GRACE_MINUTES = 30;

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  notes?: string;
  days: Weekday[];
  times: LocalTime[];
  /** Per medication: some medications need stricter timing (decision 0008). */
  graceMinutes: number;
  alertsEnabled: boolean;
  /** First day this medication counts. Doses never appear before it. Missing means it always did. */
  startDate?: LocalDate;
  /** Missing on medications saved before icons existed; use `pillIconOf`. */
  icon?: PillIcon;
}

/** One scheduled occurrence of a medication. Derived from the schedule, never stored. */
export interface Dose {
  medicationId: string;
  date: LocalDate;
  time: LocalTime;
}

export type DoseOutcome = 'taken' | 'skipped';

/** What the user did about a dose. Stored. `loggedAt` is when they recorded it, which may be late. */
export interface DoseLog extends Dose {
  outcome: DoseOutcome;
  loggedAt: string; // ISO 8601
}

export type DoseStatus =
  | 'upcoming' // today, before the scheduled time
  | 'due' // today, from the scheduled time until the grace window ends
  | 'overdue' // today, grace window passed, not logged
  | 'missed' // a past day, not logged
  | 'taken'
  | 'skipped'
  | 'locked'; // a future day: can't be logged yet
