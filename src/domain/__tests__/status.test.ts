import { canLog, doseActions, doseStatus, isResolved, logDose } from '../status';
import type { Dose, DoseLog } from '../types';

const at = (h: number, m: number, day = 15) => new Date(2025, 2, day, h, m);
const dose: Dose = { medicationId: 'synthroid', date: '2025-03-15', time: '10:30' };
const log = (outcome: 'taken' | 'skipped'): DoseLog => ({ ...dose, outcome, loggedAt: at(10, 40).toISOString() });

describe('doseStatus (default 30 minute grace window)', () => {
  it('is upcoming before the scheduled time', () => {
    expect(doseStatus(dose, undefined, at(10, 29))).toBe('upcoming');
  });
  it('is due from the scheduled time through the end of the grace window, inclusive', () => {
    expect(doseStatus(dose, undefined, at(10, 30))).toBe('due');
    expect(doseStatus(dose, undefined, at(11, 0))).toBe('due');
  });
  it('is overdue once the grace window has passed', () => {
    expect(doseStatus(dose, undefined, at(11, 1))).toBe('overdue');
  });
  it('respects a stricter per-medication grace window', () => {
    expect(doseStatus(dose, undefined, at(10, 41), 10)).toBe('overdue');
    expect(doseStatus(dose, undefined, at(10, 40), 10)).toBe('due');
  });
  it('is missed on a past day and locked on a future day', () => {
    expect(doseStatus({ ...dose, date: '2025-03-14' }, undefined, at(10, 30))).toBe('missed');
    expect(doseStatus({ ...dose, date: '2025-03-16' }, undefined, at(10, 30))).toBe('locked');
  });
  it('a log overrides time-based status, even when logged late or on a past day', () => {
    expect(doseStatus(dose, log('taken'), at(23, 0))).toBe('taken');
    expect(doseStatus(dose, log('skipped'), at(9, 0))).toBe('skipped');
    expect(doseStatus({ ...dose, date: '2025-03-14' }, { ...log('taken'), date: '2025-03-14' }, at(10, 30))).toBe('taken');
  });
});

describe('isResolved / canLog', () => {
  it('only taken and skipped are resolved', () => {
    expect(['taken', 'skipped'].every((s) => isResolved(s as never))).toBe(true);
    expect(['upcoming', 'due', 'overdue', 'missed', 'locked'].some((s) => isResolved(s as never))).toBe(false);
  });
  it('allows late logging everywhere except future days', () => {
    expect(canLog('overdue')).toBe(true);
    expect(canLog('missed')).toBe(true);
    expect(canLog('locked')).toBe(false);
  });
});

describe('logDose', () => {
  it('records the actual time it was logged, so late logging is visible', () => {
    const now = at(14, 5);
    expect(logDose(dose, 'taken', now)).toEqual({ ...dose, outcome: 'taken', loggedAt: now.toISOString() });
  });
  it('allows logging a past day', () => {
    expect(() => logDose({ ...dose, date: '2025-03-13' }, 'taken', at(9, 0))).not.toThrow();
  });
  it('refuses a future day', () => {
    expect(() => logDose({ ...dose, date: '2025-03-16' }, 'taken', at(9, 0))).toThrow();
  });
});

describe('doseActions', () => {
  it('offers skip and edit for a dose that can be logged', () => {
    for (const s of ['upcoming', 'due', 'overdue', 'missed', 'taken'] as const) expect(doseActions(s)).toEqual(['skip', 'edit']);
  });
  it('offers to undo a skip', () => {
    expect(doseActions('skipped')).toEqual(['unskip', 'edit']);
  });
  it('offers only edit on a future day', () => {
    expect(doseActions('locked')).toEqual(['edit']);
  });
});
