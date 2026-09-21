import { parsePersistedState } from '../persist';

const med = { id: 'a', name: 'Synthroid', dosage: '125mg', days: ['mon', 'tue'], times: ['06:30'], graceMinutes: 30, alertsEnabled: true };
const log = { medicationId: 'a', date: '2025-03-15', time: '06:30', outcome: 'taken', loggedAt: '2025-03-15T13:42:00.000Z' };

describe('parsePersistedState', () => {
  it('accepts valid state unchanged', () => {
    expect(parsePersistedState({ userName: 'Anika', medications: [med], logs: [log] })).toEqual({
      state: { userName: 'Anika', medications: [med], logs: [log] }, dropped: 0,
    });
  });
  it('returns null when the value is not a state object', () => {
    for (const bad of [null, undefined, 42, 'text', [], {}, { medications: 'x', logs: [] }, { medications: [] }]) {
      expect(parsePersistedState(bad)).toBeNull();
    }
  });
  it('keeps valid medications and reports the invalid ones it dropped', () => {
    const bad = [
      { ...med, id: 'b', name: '' },
      { ...med, id: 'c', days: ['funday'] },
      { ...med, id: 'd', days: [] },
      { ...med, id: 'e', times: ['25:00'] },
      { ...med, id: 'f', graceMinutes: 0 },
      { ...med, id: 'g', graceMinutes: 181 },
      { ...med, id: 'h', graceMinutes: 1.5 },
      { ...med, id: 'i', alertsEnabled: 'yes' },
      { ...med, id: 'j', notes: 5 },
      'not an object',
      null,
    ];
    const parsed = parsePersistedState({ medications: [med, ...bad], logs: [] });
    expect(parsed?.state.medications).toEqual([med]);
    expect(parsed?.dropped).toBe(bad.length);
  });
  it('drops invalid logs, including impossible dates', () => {
    const bad = [
      { ...log, date: '2025-02-30' }, { ...log, date: 'yesterday' }, { ...log, time: '6:30' },
      { ...log, outcome: 'ignored' }, { ...log, loggedAt: 'not a date' }, { ...log, medicationId: '' },
    ];
    const parsed = parsePersistedState({ medications: [], logs: [log, ...bad] });
    expect(parsed?.state.logs).toEqual([log]);
    expect(parsed?.dropped).toBe(bad.length);
  });
  it('drops duplicates rather than trusting them', () => {
    const parsed = parsePersistedState({ medications: [med, { ...med, name: 'Other' }], logs: [log, { ...log, outcome: 'skipped' }] });
    expect(parsed?.state.medications).toHaveLength(1);
    expect(parsed?.state.logs).toHaveLength(1);
    expect(parsed?.dropped).toBe(2);
  });
  it('normalizes order and strips unknown fields', () => {
    const parsed = parsePersistedState({ medications: [{ ...med, days: ['tue', 'mon'], times: ['19:00', '06:30'], extra: 1 }], logs: [] });
    expect(parsed?.state.medications[0]).toEqual({ ...med, days: ['mon', 'tue'], times: ['06:30', '19:00'] });
  });
  it('keeps the medications when only the user name is bad', () => {
    const parsed = parsePersistedState({ userName: 7, medications: [med], logs: [] });
    expect(parsed?.state.userName).toBeUndefined();
    expect(parsed?.state.medications).toHaveLength(1);
    expect(parsed?.dropped).toBe(1);
  });
});
