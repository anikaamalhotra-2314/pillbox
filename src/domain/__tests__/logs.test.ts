import { toggleSkipped, toggleTaken } from '../logs';
import type { Dose, DoseLog } from '../types';

const dose: Dose = { medicationId: 'synthroid', date: '2025-03-15', time: '06:30' };
const now = new Date(2025, 2, 15, 6, 42);

describe('toggleTaken', () => {
  it('marks an unlogged dose taken, recording when', () => {
    const logs = toggleTaken([], dose, now);
    expect(logs).toEqual([{ ...dose, outcome: 'taken', loggedAt: now.toISOString() }]);
  });
  it('undoes a taken dose when toggled again', () => {
    expect(toggleTaken(toggleTaken([], dose, now), dose, now)).toEqual([]);
  });
  it('turns a skipped dose into a taken one', () => {
    const skipped: DoseLog = { ...dose, outcome: 'skipped', loggedAt: now.toISOString() };
    const later = new Date(2025, 2, 15, 9, 0);
    expect(toggleTaken([skipped], dose, later)).toEqual([{ ...dose, outcome: 'taken', loggedAt: later.toISOString() }]);
  });
  it('leaves other doses alone and never mutates its input', () => {
    const other: DoseLog = { ...dose, time: '19:00', outcome: 'taken', loggedAt: now.toISOString() };
    const input = [other];
    const result = toggleTaken(input, dose, now);
    expect(input).toEqual([other]);
    expect(result).toHaveLength(2);
  });
  it('refuses a future dose', () => {
    expect(() => toggleTaken([], { ...dose, date: '2025-03-16' }, now)).toThrow();
  });
});

describe('toggleSkipped', () => {
  it('marks an unlogged dose skipped, recording when', () => {
    expect(toggleSkipped([], dose, now)).toEqual([{ ...dose, outcome: 'skipped', loggedAt: now.toISOString() }]);
  });
  it('undoes a skip when toggled again', () => {
    expect(toggleSkipped(toggleSkipped([], dose, now), dose, now)).toEqual([]);
  });
  it('turns a taken dose into a skipped one', () => {
    const taken: DoseLog = { ...dose, outcome: 'taken', loggedAt: now.toISOString() };
    const later = new Date(2025, 2, 15, 9, 0);
    expect(toggleSkipped([taken], dose, later)).toEqual([{ ...dose, outcome: 'skipped', loggedAt: later.toISOString() }]);
  });
  it('refuses a future dose', () => {
    expect(() => toggleSkipped([], { ...dose, date: '2025-03-16' }, now)).toThrow();
  });
});
