import { formatTime, localTimeOf, spokenTime, statusLabel, statusPhrase } from '../format';

describe('formatTime / spokenTime', () => {
  it.each([
    ['00:00', '12:00am', '12:00 AM'],
    ['06:30', '6:30am', '6:30 AM'],
    ['12:00', '12:00pm', '12:00 PM'],
    ['13:05', '1:05pm', '1:05 PM'],
    ['23:59', '11:59pm', '11:59 PM'],
  ])('%s', (time, shown, spoken) => {
    expect(formatTime(time)).toBe(shown);
    expect(spokenTime(time)).toBe(spoken);
  });
  it('rejects malformed times', () => {
    expect(() => formatTime('6:30')).toThrow();
  });
});

describe('statusLabel / statusPhrase', () => {
  const loggedAt = new Date(2025, 2, 15, 6, 42).toISOString();
  it('reads the local time an ISO timestamp falls on', () => {
    expect(localTimeOf(loggedAt)).toBe('06:42');
  });
  it('shows a visible tag for every state that needs one', () => {
    expect(statusLabel('due')).toBe('Due now');
    expect(statusLabel('overdue')).toBe('Overdue');
    expect(statusLabel('missed')).toBe('Missed');
    expect(statusLabel('skipped')).toBe('Skipped');
    expect(statusLabel('taken', loggedAt)).toBe('Taken 6:42am');
    expect(statusLabel('taken')).toBe('Taken');
    expect(statusLabel('upcoming')).toBeUndefined();
    expect(statusLabel('locked')).toBeUndefined();
  });
  it('speaks every state', () => {
    expect(statusPhrase('taken', loggedAt)).toBe('taken at 6:42 AM');
    expect(statusPhrase('locked')).toBe('scheduled, cannot be marked yet');
    expect(statusPhrase('due')).toBe('due now');
  });
});
