import { doseKey } from './day';
import { logDose } from './status';
import type { Dose, DoseLog, DoseOutcome } from './types';

/**
 * Records `outcome` for a dose, or clears it if the dose already has that outcome, so the same
 * action undoes itself. Any other outcome is replaced. Throws for a future day, like `logDose`.
 * Returns a new array and never mutates.
 */
function toggleOutcome(logs: DoseLog[], dose: Dose, outcome: DoseOutcome, now: Date): DoseLog[] {
  const key = doseKey(dose);
  const existing = logs.find((l) => doseKey(l) === key);
  if (existing?.outcome === outcome) return logs.filter((l) => l !== existing);
  const next = logDose(dose, outcome, now);
  return existing ? logs.map((l) => (l === existing ? next : l)) : [...logs, next];
}

/** Checking a dose off marks it taken; checking it again undoes that. A skipped dose becomes taken. */
export function toggleTaken(logs: DoseLog[], dose: Dose, now: Date): DoseLog[] {
  return toggleOutcome(logs, dose, 'taken', now);
}

/** Skipping a dose on purpose; skipping it again undoes that. A taken dose becomes skipped. */
export function toggleSkipped(logs: DoseLog[], dose: Dose, now: Date): DoseLog[] {
  return toggleOutcome(logs, dose, 'skipped', now);
}
