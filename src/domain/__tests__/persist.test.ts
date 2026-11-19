import { emptyHome } from '../home';
import { parsePersistedState } from '../persist';

const med = { id: 'a', name: 'Synthroid', dosage: '125mg', days: ['mon', 'tue'], times: ['06:30'], graceMinutes: 30, alertsEnabled: true };
const log = { medicationId: 'a', date: '2025-03-15', time: '06:30', outcome: 'taken', loggedAt: '2025-03-15T13:42:00.000Z' };

describe('parsePersistedState', () => {
  it('accepts valid state unchanged', () => {
    expect(parsePersistedState({ userName: 'Anika', medications: [med], logs: [log], home: emptyHome() })).toEqual({
      state: { userName: 'Anika', medications: [med], logs: [log], snoozes: [], home: emptyHome() }, dropped: 0,
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

describe('startDate', () => {
  it('is kept when valid and optional when absent', () => {
    expect(parsePersistedState({ medications: [{ ...med, startDate: '2025-03-15' }], logs: [] })?.state.medications[0].startDate).toBe('2025-03-15');
    expect(parsePersistedState({ medications: [med], logs: [] })?.state.medications[0]).not.toHaveProperty('startDate');
  });
  it('drops a medication whose start date is invalid', () => {
    const parsed = parsePersistedState({ medications: [{ ...med, startDate: '2025-02-30' }, { ...med, id: 'b', startDate: 5 }], logs: [] });
    expect(parsed?.state.medications).toEqual([]);
    expect(parsed?.dropped).toBe(2);
  });
});

describe('icon', () => {
  it('keeps a valid icon and works without one', () => {
    const withIcon = { ...med, icon: { shape: 'capsule', color: 'mint' } };
    expect(parsePersistedState({ medications: [withIcon], logs: [] })?.state.medications[0].icon).toEqual({ shape: 'capsule', color: 'mint' });
    expect(parsePersistedState({ medications: [med], logs: [] })?.state.medications[0]).not.toHaveProperty('icon');
  });
  it('ignores an unknown icon without dropping the medication', () => {
    const parsed = parsePersistedState({ medications: [{ ...med, icon: { shape: 'star', color: 'mint' } }, { ...med, id: 'b', icon: 'capsule' }], logs: [] });
    expect(parsed?.state.medications).toHaveLength(2);
    expect(parsed?.state.medications[0]).not.toHaveProperty('icon');
    expect(parsed?.dropped).toBe(0);
  });
});

describe('snoozes (storage version 2)', () => {
  const snooze = { medicationId: 'a', date: '2025-03-15', time: '06:30', until: '2025-03-15T13:40:00.000Z' };
  it('treats missing snoozes, as saved by version 1, as none', () => {
    expect(parsePersistedState({ medications: [med], logs: [] })?.state.snoozes).toEqual([]);
  });
  it('keeps valid snoozes and drops invalid ones', () => {
    const parsed = parsePersistedState({ medications: [], logs: [], snoozes: [snooze, { ...snooze, until: 'soon' }, { ...snooze, time: '6:30' }, 7] });
    expect(parsed).toEqual({ state: { medications: [], logs: [], snoozes: [snooze], home: emptyHome() }, dropped: 3 });
  });
  it('counts a snoozes value that is not a list as dropped', () => {
    expect(parsePersistedState({ medications: [], logs: [], snoozes: 'x' })).toEqual({ state: { medications: [], logs: [], snoozes: [], home: emptyHome() }, dropped: 1 });
  });
});

describe('home (storage version 3)', () => {
  const at = '2025-03-15T12:00:00.000Z';
  const home = { earned: { 'a|2025-03-15|06:30': 5 }, purchases: [{ id: 'rug', price: 20, at }], decor: { items: {}, rooms: {} } };

  it('keeps a valid home as saved, without backfilling', () => {
    expect(parsePersistedState({ medications: [med], logs: [log], home })?.state.home).toEqual(home);
    expect(parsePersistedState({ medications: [med], logs: [log], home: emptyHome() })?.state.home).toEqual(emptyHome());
  });
  it('backfills coins from the history when the home is missing, as saved by version 2', () => {
    const late = { ...log, time: '01:00', loggedAt: new Date(2025, 2, 15, 9, 0).toISOString() };
    const onTime = { ...log, time: '09:00', loggedAt: new Date(2025, 2, 15, 9, 10).toISOString() };
    const skipped = { ...onTime, time: '10:00', outcome: 'skipped', loggedAt: new Date(2025, 2, 15, 10, 0).toISOString() };
    const parsed = parsePersistedState({ medications: [med], logs: [late, onTime, skipped] });
    expect(parsed?.state.home).toEqual({ ...emptyHome(), earned: { 'a|2025-03-15|09:00': 5 } });
    expect(parsed?.dropped).toBe(0);
  });
  it('drops invalid ledger entries and purchases, and counts them', () => {
    const parsed = parsePersistedState({
      medications: [], logs: [],
      home: {
        earned: { 'a|2025-03-15|06:30': 5, 'nonsense': 5, 'a|2025-03-15|06:45': 0, 'a|2025-03-15|07:00': 'five' },
        purchases: [
          { id: 'rug', price: 20, at }, { id: 'rug', price: 20, at }, { id: 'spaceship', price: 5, at },
          { id: 'sofa', price: -1, at }, { id: 'sofa', price: 120, at: 'later' }, 7,
        ],
      },
    });
    expect(parsed?.state.home).toEqual({ ...emptyHome(), earned: { 'a|2025-03-15|06:30': 5 }, purchases: [{ id: 'rug', price: 20, at }] });
    expect(parsed?.dropped).toBe(8);
  });
  it('starts an empty home when the saved one is not an object, and counts it', () => {
    expect(parsePersistedState({ medications: [], logs: [], home: 'x' })).toMatchObject({ state: { home: emptyHome() }, dropped: 1 });
  });
});

describe('decor (storage version 4)', () => {
  const base = { earned: {}, purchases: [] };
  const parse = (decor: unknown) => parsePersistedState({ medications: [], logs: [], home: { ...base, decor } });

  it('treats missing decor, as saved by version 3, as nothing changed', () => {
    expect(parsePersistedState({ medications: [], logs: [], home: base })?.state.home.decor).toEqual({ items: {}, rooms: {} });
  });
  it('keeps valid choices, rounding moves', () => {
    const decor = { items: { sofa: { dx: -12.6, color: 'mint' }, rug: { color: 'rose' } }, rooms: { living: { wall: 'lilac', floor: 'checker' } } };
    expect(parse(decor)?.state.home.decor).toEqual({
      items: { sofa: { dx: -13, color: 'mint' }, rug: { color: 'rose' } }, rooms: { living: { wall: 'lilac', floor: 'checker' } },
    });
  });
  it('ignores anything unrecognised without counting it as lost, since it is only cosmetic', () => {
    const decor = {
      items: { sofa: { dx: 'left', color: 'plaid' }, kitchen: { dx: 5 }, spaceship: { dx: 5 }, rug: { dx: 9999 }, bed: 'x' },
      rooms: { living: { wall: 'plaid', floor: 'lava' }, sofa: { wall: 'mint' } },
    };
    expect(parse(decor)).toMatchObject({ state: { home: { decor: { items: {}, rooms: {} } } }, dropped: 0 });
  });
});
