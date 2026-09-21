import { buildDay, dosesForDate, sortDayEntries } from '../day';
import type { Dose, DoseLog, DoseStatus, Medication } from '../types';

const med = (id: string, times: string[], days: Medication['days'] = ['sat'], graceMinutes = 30): Medication => ({
  id, name: id, dosage: '125mg', days, times, graceMinutes, alertsEnabled: true,
});
const takenLog = (medicationId: string, time: string, loggedAt: Date): DoseLog => ({
  medicationId, date: '2025-03-15', time, outcome: 'taken', loggedAt: loggedAt.toISOString(),
});
const now = new Date(2025, 2, 15, 10, 35);

describe('dosesForDate', () => {
  it('only includes medications scheduled for that weekday', () => {
    const meds = [med('a', ['08:00'], ['sat']), med('b', ['08:00'], ['sun'])];
    expect(dosesForDate(meds, '2025-03-15').map((d) => d.medicationId)).toEqual(['a']);
    expect(dosesForDate(meds, '2025-03-16').map((d) => d.medicationId)).toEqual(['b']);
  });
  it('expands several times per day and ignores duplicate times', () => {
    expect(dosesForDate([med('a', ['06:30', '10:30', '10:30'])], '2025-03-15')).toHaveLength(2);
  });
});

describe('sortDayEntries', () => {
  const entry = (time: string, status: DoseStatus, medicationId = 'a') => ({
    dose: { medicationId, date: '2025-03-15', time } as Dose, status,
  });
  it('puts resolved doses below active ones, each group in time order', () => {
    const sorted = sortDayEntries([
      entry('19:00', 'taken'), entry('13:00', 'upcoming'), entry('06:30', 'taken'), entry('10:30', 'due'),
    ]);
    expect(sorted.map((e) => `${e.dose.time} ${e.status}`)).toEqual([
      '10:30 due', '13:00 upcoming', '06:30 taken', '19:00 taken',
    ]);
  });
  it('orders resolved doses by scheduled time, not by when they were logged', () => {
    const sorted = sortDayEntries([entry('19:00', 'taken'), entry('06:30', 'skipped')]);
    expect(sorted.map((e) => e.dose.time)).toEqual(['06:30', '19:00']);
  });
  it('lists an overdue dose ahead of later active ones', () => {
    const sorted = sortDayEntries([entry('13:00', 'upcoming'), entry('06:30', 'overdue')]);
    expect(sorted[0].status).toBe('overdue');
  });
  it('is stable for equal times', () => {
    const sorted = sortDayEntries([entry('08:00', 'upcoming', 'b'), entry('08:00', 'upcoming', 'a')]);
    expect(sorted.map((e) => e.dose.medicationId)).toEqual(['a', 'b']);
  });
});

describe('buildDay (the Figma home screen, Saturday March 15 at 10:35)', () => {
  const meds = [
    med('synthroid', ['06:30', '19:00']),
    med('microgestin', ['10:30']),
    med('calcium', ['13:00']),
  ];
  it('reproduces the designed order: due, upcoming, upcoming, then the taken 6:30 at the bottom', () => {
    const day = buildDay(meds, [takenLog('synthroid', '06:30', new Date(2025, 2, 15, 6, 42))], '2025-03-15', now);
    expect(day.map((e) => `${e.medication.id} ${e.dose.time} ${e.status}`)).toEqual([
      'microgestin 10:30 due',
      'calcium 13:00 upcoming',
      'synthroid 19:00 upcoming',
      'synthroid 06:30 taken',
    ]);
  });
  it('uses each medication\'s own grace window', () => {
    const strict = [med('strict', ['10:00'], ['sat'], 10), med('relaxed', ['10:00'], ['sat'], 60)];
    const byId = Object.fromEntries(buildDay(strict, [], '2025-03-15', now).map((e) => [e.medication.id, e.status]));
    expect(byId).toEqual({ strict: 'overdue', relaxed: 'due' });
  });
  it('locks every dose on a future day', () => {
    expect(buildDay(meds, [], '2025-03-15', new Date(2025, 2, 14, 9, 0)).every((e) => e.status === 'locked')).toBe(true);
  });
});
