import { doseKey } from './day';
import { logDose } from './status';
import type { Dose, DoseLog } from './types';

/**
 * Checking a dose off marks it taken; checking it again undoes that. A skipped dose becomes taken.
 * Throws for a future day, like `logDose`. Returns a new array and never mutates.
 */
export function toggleTaken(logs: DoseLog[], dose: Dose, now: Date): DoseLog[] {
  const key = doseKey(dose);
  const existing = logs.find((l) => doseKey(l) === key);
  if (existing?.outcome === 'taken') return logs.filter((l) => l !== existing);
  const next = logDose(dose, 'taken', now);
  return existing ? logs.map((l) => (l === existing ? next : l)) : [...logs, next];
}
