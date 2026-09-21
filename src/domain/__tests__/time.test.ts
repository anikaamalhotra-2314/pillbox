import { from12h, parseHour12, parseMinute, to12h } from '../time';

describe('to12h / from12h', () => {
  it.each([
    ['00:00', { hour: 12, minute: 0, pm: false }],
    ['06:30', { hour: 6, minute: 30, pm: false }],
    ['12:00', { hour: 12, minute: 0, pm: true }],
    ['13:05', { hour: 1, minute: 5, pm: true }],
    ['23:59', { hour: 11, minute: 59, pm: true }],
  ])('round-trips %s', (time, parts) => {
    expect(to12h(time)).toEqual(parts);
    expect(from12h(parts)).toBe(time);
  });
});

describe('parseHour12 / parseMinute', () => {
  it('accepts valid input, with or without a leading zero', () => {
    expect(parseHour12('9')).toBe(9);
    expect(parseHour12('09')).toBe(9);
    expect(parseHour12('12')).toBe(12);
    expect(parseMinute('0')).toBe(0);
    expect(parseMinute('05')).toBe(5);
    expect(parseMinute('59')).toBe(59);
  });
  it('rejects out-of-range, empty, and non-numeric input', () => {
    for (const bad of ['', ' ', '0', '13', 'ab', '1.5', '-1', '123']) expect(parseHour12(bad)).toBeNull();
    for (const bad of ['', '60', '-1', 'x', '1.5', '100']) expect(parseMinute(bad)).toBeNull();
  });
});
