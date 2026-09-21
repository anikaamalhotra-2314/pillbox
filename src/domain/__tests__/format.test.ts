import { cabinetTitle, formatDays, formatTime, greetingFor, medicationSubtitle, localTimeOf, monthYearLabel, spokenDate, spokenTime, statusLabel, statusPhrase, weekdayShort } from '../format';

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

describe('date labels', () => {
  it('labels the month and the weekday like the Figma', () => {
    expect(monthYearLabel('2025-03-15')).toBe('March 2025');
    expect(weekdayShort('2025-03-12')).toBe('Wed');
    expect(weekdayShort('2025-03-15')).toBe('Sat');
  });
  it('speaks a full date and marks today', () => {
    expect(spokenDate('2025-03-15', false)).toBe('Saturday, March 15');
    expect(spokenDate('2025-03-15', true)).toBe('Saturday, March 15, today');
  });
  it('greets by time of day', () => {
    expect(greetingFor(new Date(2025, 2, 15, 6, 0))).toBe('Morning');
    expect(greetingFor(new Date(2025, 2, 15, 11, 59))).toBe('Morning');
    expect(greetingFor(new Date(2025, 2, 15, 12, 0))).toBe('Afternoon');
    expect(greetingFor(new Date(2025, 2, 15, 17, 0))).toBe('Evening');
  });
});

describe('formatDays', () => {
  it('summarizes common patterns and lists the rest in week order', () => {
    expect(formatDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).toBe('Every day');
    expect(formatDays(['fri', 'mon', 'thu', 'tue', 'wed'])).toBe('Weekdays');
    expect(formatDays(['sun', 'sat'])).toBe('Weekends');
    expect(formatDays(['wed', 'mon', 'fri'])).toBe('Mon, Wed, Fri');
    expect(formatDays(['sun'])).toBe('Sun');
  });
});

describe('medicationSubtitle / cabinetTitle', () => {
  it('joins notes and dosage, or shows the dosage alone', () => {
    expect(medicationSubtitle({ notes: '1 pill', dosage: '125mg' })).toBe('1 pill | 125mg');
    expect(medicationSubtitle({ dosage: '50mcg' })).toBe('50mcg');
    expect(medicationSubtitle({ notes: '', dosage: '50mcg' })).toBe('50mcg');
  });
  it('possessive title', () => {
    expect(cabinetTitle('Anika')).toBe('Anika’s Medicine Cabinet');
  });
});
