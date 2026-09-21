import { scheduledInstant, toLocalDate, weekdayOf } from '../dates';

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
