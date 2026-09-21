import { addDays, scheduledInstant, toLocalDate, weekdayOf } from '../dates';

describe('weekdayOf', () => {
  it('maps the Figma week (March 15, 2025 is a Saturday)', () => {
    expect(weekdayOf('2025-03-12')).toBe('wed');
    expect(weekdayOf('2025-03-15')).toBe('sat');
    expect(weekdayOf('2025-03-16')).toBe('sun');
    expect(weekdayOf('2025-03-17')).toBe('mon');
  });
  it('rejects malformed dates', () => {
    expect(() => weekdayOf('15/03/2025')).toThrow();
  });
});

describe('scheduledInstant / toLocalDate', () => {
  it('round-trips a local wall-clock time', () => {
    const d = scheduledInstant('2025-03-15', '13:00');
    expect(toLocalDate(d)).toBe('2025-03-15');
    expect(d.getHours()).toBe(13);
    expect(d.getMinutes()).toBe(0);
  });
  it('yields a valid date for a time that does not exist on a DST spring-forward day', () => {
    expect(Number.isNaN(scheduledInstant('2026-03-08', '02:30').getTime())).toBe(false);
  });
  it('rejects malformed times', () => {
    expect(() => scheduledInstant('2025-03-15', '9:5')).toThrow();
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2025-03-31', 1)).toBe('2025-04-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
  });
  it('handles leap years and negative offsets', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-03-15', -60)).toBe('2025-01-14');
  });
  it('does not skip or repeat a day across a DST change', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });
});
