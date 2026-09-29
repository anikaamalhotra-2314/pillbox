import { WEEKDAYS } from '../dates';
import { canSnooze, MAX_PENDING_REMINDERS, planReminders, reconcileReminders, snoozeDose, snoozedUntil, SNOOZE_MINUTES } from '../reminders';
import type { DoseLog, Medication, Snooze } from '../types';

// Saturday 15 March 2025, 10:45 local.
const now = new Date(2025, 2, 15, 10, 45);
const at = (day: number, h: number, m = 0) => new Date(2025, 2, day, h, m).getTime();

const synthroid: Medication = {
  id: 'synthroid', name: 'Synthroid', dosage: '125mg', notes: '1 pill', days: [...WEEKDAYS],
  times: ['06:30', '19:00'], graceMinutes: 30, alertsEnabled: true,
};
const calcium: Medication = { ...synthroid, id: 'calcium', name: 'Calcium', times: ['13:00'], alertsEnabled: false };

describe('planReminders', () => {
  it('plans the rest of today and the coming days, earliest first, for medications with alerts on', () => {
    const plan = planReminders([synthroid, calcium], [], [], now, { horizonDays: 2 });
    expect(plan.map((r) => r.fireAt)).toEqual([at(15, 19), at(16, 6, 30), at(16, 19)]);
    expect(plan.every((r) => r.dose.medicationId === 'synthroid')).toBe(true);
  });

  it('names the medication and dose in the text, with a stable id', () => {
    const [first] = planReminders([synthroid], [], [], now, { horizonDays: 1 });
    expect(first).toEqual({
      id: 'dose|synthroid|2025-03-15|19:00', fireAt: at(15, 19), title: 'Time for Synthroid', body: '7:00pm · 1 pill | 125mg',
      dose: { medicationId: 'synthroid', date: '2025-03-15', time: '19:00' },
    });
  });

  it('skips doses already taken or skipped, including ones logged early', () => {
    const logs: DoseLog[] = [{ medicationId: 'synthroid', date: '2025-03-15', time: '19:00', outcome: 'taken', loggedAt: now.toISOString() }];
    expect(planReminders([synthroid], logs, [], now, { horizonDays: 1 })).toEqual([]);
  });

  it('respects scheduled days and start dates', () => {
    const weekdaysOnly = { ...synthroid, days: ['mon' as const], startDate: '2025-03-18' };
    const plan = planReminders([weekdaysOnly], [], [], now, { horizonDays: 14 });
    expect(plan.map((r) => r.dose.date)).toEqual(['2025-03-24', '2025-03-24']); // not Monday 17th: before the start date
  });

  it('never plans more than iOS will keep, and keeps the soonest', () => {
    const many = { ...synthroid, times: ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00'] };
    const plan = planReminders([many], [], [], now);
    expect(plan).toHaveLength(MAX_PENDING_REMINDERS);
    expect(plan[0].fireAt).toBe(at(15, 11));
  });

  describe('snoozes', () => {
    const snooze: Snooze = { medicationId: 'synthroid', date: '2025-03-15', time: '06:30', until: new Date(at(15, 10, 55)).toISOString() };

    it('adds a snoozed reminder, first in line', () => {
      const [first] = planReminders([synthroid], [], [snooze], now, { horizonDays: 1 });
      expect(first).toMatchObject({ id: 'snooze|synthroid|2025-03-15|06:30', fireAt: at(15, 10, 55), title: 'Time for Synthroid' });
    });
    it('drops a snooze that has passed, whose dose was logged, or whose medication has alerts off', () => {
      const later = new Date(at(15, 11));
      const logged: DoseLog[] = [{ ...snooze, outcome: 'taken', loggedAt: now.toISOString() }];
      const ids = (plan: { id: string }[]) => plan.map((r) => r.id).filter((id) => id.startsWith('snooze'));
      expect(ids(planReminders([synthroid], [], [snooze], later, { horizonDays: 1 }))).toEqual([]);
      expect(ids(planReminders([synthroid], logged, [snooze], now, { horizonDays: 1 }))).toEqual([]);
      expect(ids(planReminders([{ ...synthroid, alertsEnabled: false }], [], [snooze], now, { horizonDays: 1 }))).toEqual([]);
    });
    it('drops a snooze for a dose that is no longer scheduled, or a deleted medication', () => {
      const moved = { ...synthroid, times: ['07:00', '19:00'] };
      expect(planReminders([moved], [], [snooze], now, { horizonDays: 1 }).some((r) => r.id.startsWith('snooze'))).toBe(false);
      expect(planReminders([], [], [snooze], now)).toEqual([]);
    });
  });
});

describe('reconcileReminders', () => {
  const plan = planReminders([synthroid], [], [], now, { horizonDays: 1 }); // today 19:00 only
  const pending = (r: (typeof plan)[number]) => ({ id: r.id, title: r.title, body: r.body, fireAt: r.fireAt });

  it('schedules everything when nothing is pending', () => {
    expect(reconcileReminders([], plan)).toEqual({ cancel: [], schedule: plan });
  });
  it('changes nothing when the OS already matches', () => {
    expect(reconcileReminders(plan.map(pending), plan)).toEqual({ cancel: [], schedule: [] });
  });
  it('cancels reminders no longer wanted', () => {
    expect(reconcileReminders([{ id: 'dose|gone|2025-03-15|08:00', title: 'x', body: 'y', fireAt: 1 }], plan)).toEqual({
      cancel: ['dose|gone|2025-03-15|08:00'], schedule: plan,
    });
  });
  it('replaces a reminder whose text or time changed, as after renaming the medication', () => {
    const stale = { ...pending(plan[0]), title: 'Time for Old Name' };
    expect(reconcileReminders([stale], plan)).toEqual({ cancel: [plan[0].id], schedule: plan });
  });
  it('cancels a duplicate id', () => {
    expect(reconcileReminders([pending(plan[0]), pending(plan[0])], plan)).toEqual({ cancel: [plan[0].id], schedule: [] });
  });
});

describe('snoozing', () => {
  const dose = { medicationId: 'synthroid', date: '2025-03-15', time: '10:30' };

  it('only a due or overdue dose with alerts on can be snoozed', () => {
    expect(canSnooze('due', true)).toBe(true);
    expect(canSnooze('overdue', true)).toBe(true);
    for (const s of ['upcoming', 'missed', 'taken', 'skipped', 'locked'] as const) expect(canSnooze(s, true)).toBe(false);
    expect(canSnooze('due', false)).toBe(false);
  });

  it(`re-sends in ${SNOOZE_MINUTES} minutes from now, replacing an earlier snooze of the same dose`, () => {
    const first = snoozeDose([], dose, now);
    expect(first).toEqual([{ ...dose, until: new Date(at(15, 10, 55)).toISOString() }]);
    const again = snoozeDose(first, dose, new Date(at(15, 10, 50)));
    expect(again).toEqual([{ ...dose, until: new Date(at(15, 11)).toISOString() }]);
  });

  it('drops expired snoozes of other doses', () => {
    const old: Snooze = { ...dose, time: '06:30', until: new Date(at(15, 7)).toISOString() };
    expect(snoozeDose([old], dose, now)).toHaveLength(1);
  });

  it('reports when a snooze will ring, until it has', () => {
    const snoozes = snoozeDose([], dose, now);
    expect(snoozedUntil(snoozes, dose, now)).toBe(new Date(at(15, 10, 55)).toISOString());
    expect(snoozedUntil(snoozes, dose, new Date(at(15, 10, 56)))).toBeUndefined();
    expect(snoozedUntil(snoozes, { ...dose, time: '19:00' }, now)).toBeUndefined();
  });
});
