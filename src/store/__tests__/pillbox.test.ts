import { createPillboxStore, STORAGE_KEY } from '../create-store';
import { createSeedMedications } from '../seed';
import { toLocalDate } from '@/domain/dates';
import type { RawStorage } from '../storage';
import { coinBalance, emptyHome } from '@/domain/home';
import type { Dose, Medication } from '@/domain/types';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const raw: RawStorage = {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
  return { raw, data };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const NOW = 1_700_000_000_000;
const seedMedications = createSeedMedications(toLocalDate(new Date()));

const med: Medication = { id: 'levo', name: 'Levothyroxine', dosage: '50mcg', days: ['mon'], times: ['08:00'], graceMinutes: 15, alertsEnabled: false };
const dose: Dose = { medicationId: 'synthroid', date: '2025-03-15', time: '06:30' };
const at = new Date(2025, 2, 15, 6, 42);

const saved = (state: unknown) => JSON.stringify({ state, version: 1 });

describe('persistence', () => {
  it('starts from the sample data on first launch', async () => {
    const { raw } = memoryStorage();
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    expect(store.getState().medications).toEqual(seedMedications);
    expect(store.persist.hasHydrated()).toBe(true);
  });

  it('saves medications and restores them in a new store, as after an app restart', async () => {
    const { raw } = memoryStorage();
    const first = createPillboxStore(raw);
    await first.persist.rehydrate();
    first.getState().addMedication(med);
    await flush();

    const second = createPillboxStore(raw);
    await second.persist.rehydrate();
    expect(second.getState().medications.map((m) => m.id)).toEqual([...seedMedications.map((m) => m.id), 'levo']);
  });

  it('saves checked-off doses, and an undo is saved too', async () => {
    const { raw } = memoryStorage();
    const first = createPillboxStore(raw);
    await first.persist.rehydrate();
    first.getState().toggleTaken(dose, at);
    await flush();
    const second = createPillboxStore(raw);
    await second.persist.rehydrate();
    expect(second.getState().logs).toEqual([{ ...dose, outcome: 'taken', loggedAt: at.toISOString() }]);

    second.getState().toggleTaken(dose, at);
    await flush();
    const third = createPillboxStore(raw);
    await third.persist.rehydrate();
    expect(third.getState().logs).toEqual([]);
  });

  it('does not save the action functions or anything beyond the data', async () => {
    const { raw, data } = memoryStorage();
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    store.getState().addMedication(med);
    await flush();
    const stored = JSON.parse(data.get(STORAGE_KEY)!);
    expect(Object.keys(stored.state).sort()).toEqual(['home', 'logs', 'medications', 'snoozes', 'userName']);
    expect(stored.version).toBe(4);
  });

  it('survives corrupt JSON: starts from the sample data and keeps a copy of the bad text', async () => {
    const { raw, data } = memoryStorage({ [STORAGE_KEY]: '{"state": {oops' });
    const store = createPillboxStore(raw, () => NOW);
    await store.persist.rehydrate();
    expect(store.persist.hasHydrated()).toBe(true);
    // The store was given a fixed clock, so the sample data starts on that day.
    expect(store.getState().medications).toEqual(createSeedMedications(toLocalDate(new Date(NOW))));
    expect(data.get(`${STORAGE_KEY}:corrupt:${NOW}`)).toBe('{"state": {oops');
  });

  it('keeps the valid entries when some are invalid, and backs up the original', async () => {
    const stored = { userName: 'Sam', medications: [med, { ...med, id: 'bad', graceMinutes: -1 }], logs: [] };
    const { raw, data } = memoryStorage({ [STORAGE_KEY]: saved(stored) });
    const store = createPillboxStore(raw, () => NOW);
    await store.persist.rehydrate();
    await flush();
    expect(store.getState().userName).toBe('Sam');
    expect(store.getState().medications).toEqual([med]);
    expect(JSON.parse(data.get(`${STORAGE_KEY}:salvaged:${NOW}`)!).medications).toHaveLength(2);
  });

  it('falls back to the sample data when the saved value is not usable at all', async () => {
    const { raw } = memoryStorage({ [STORAGE_KEY]: saved('nonsense') });
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    expect(store.getState().medications).toEqual(seedMedications);
    expect(store.persist.hasHydrated()).toBe(true);
  });

  it('still finishes hydrating when reading storage throws', async () => {
    const { raw } = memoryStorage();
    const failing: RawStorage = { ...raw, getItem: async () => { throw new Error('storage unavailable'); } };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createPillboxStore(failing);
    await store.persist.rehydrate();
    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().medications).toEqual(seedMedications);
    warn.mockRestore();
  });

  it('keeps working in memory when writing fails', async () => {
    const { raw } = memoryStorage();
    const failing: RawStorage = { ...raw, setItem: async () => { throw new Error('quota exceeded'); } };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createPillboxStore(failing);
    await store.persist.rehydrate();
    expect(() => store.getState().addMedication(med)).not.toThrow();
    await flush();
    expect(store.getState().medications.map((m) => m.id)).toContain('levo');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('reset returns to the sample data and saves that', async () => {
    const { raw } = memoryStorage();
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    store.getState().addMedication(med);
    store.getState().reset();
    await flush();
    const again = createPillboxStore(raw);
    await again.persist.rehydrate();
    expect(again.getState().medications).toEqual(seedMedications);
  });
});

describe('editing and deleting', () => {
  const mk = async () => {
    const { raw } = memoryStorage();
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    return { store, raw };
  };

  it('updates a medication in place, keeping its position, and saves it', async () => {
    const { store, raw } = await mk();
    const original = store.getState().medications[1];
    store.getState().updateMedication({ ...original, dosage: '250mg', times: ['09:00'] });
    await flush();
    expect(store.getState().medications.map((m) => m.id)).toEqual(['synthroid', 'microgestin', 'calcium']);
    const again = createPillboxStore(raw);
    await again.persist.rehydrate();
    expect(again.getState().medications[1]).toMatchObject({ id: 'microgestin', dosage: '250mg', times: ['09:00'] });
  });

  it('deleting removes the medication and its history, and nothing else', async () => {
    const { store, raw } = await mk();
    store.getState().toggleTaken({ medicationId: 'synthroid', date: '2025-03-15', time: '06:30' }, at);
    store.getState().toggleTaken({ medicationId: 'calcium', date: '2025-03-15', time: '13:00' }, at);
    store.getState().deleteMedication('synthroid');
    await flush();
    expect(store.getState().medications.map((m) => m.id)).toEqual(['microgestin', 'calcium']);
    expect(store.getState().logs.map((l) => l.medicationId)).toEqual(['calcium']);
    const again = createPillboxStore(raw);
    await again.persist.rehydrate();
    expect(again.getState().medications).toHaveLength(2);
    expect(again.getState().logs).toHaveLength(1);
  });

  it('deleting an unknown id changes nothing', async () => {
    const { store } = await mk();
    store.getState().deleteMedication('nope');
    expect(store.getState().medications).toHaveLength(3);
  });
});

describe('skipping', () => {
  it('saves a skipped dose, and ignores a skip on a future day', async () => {
    const { raw } = memoryStorage();
    const first = createPillboxStore(raw);
    await first.persist.rehydrate();
    first.getState().toggleSkipped(dose, at);
    first.getState().toggleSkipped({ ...dose, date: '2025-03-16' }, at);
    await flush();
    const second = createPillboxStore(raw);
    await second.persist.rehydrate();
    expect(second.getState().logs).toEqual([{ ...dose, outcome: 'skipped', loggedAt: at.toISOString() }]);
  });
});

describe('snoozing', () => {
  const later = new Date(2025, 2, 15, 6, 50);

  it('saves a snooze, and taking the dose ends it', async () => {
    const { raw } = memoryStorage();
    const first = createPillboxStore(raw);
    await first.persist.rehydrate();
    first.getState().snooze(dose, at);
    await flush();
    const second = createPillboxStore(raw);
    await second.persist.rehydrate();
    expect(second.getState().snoozes).toEqual([{ ...dose, until: new Date(at.getTime() + 10 * 60_000).toISOString() }]);
    second.getState().toggleTaken(dose, later);
    expect(second.getState().snoozes).toEqual([]);
  });

  it('skipping the dose, or deleting its medication, ends the snooze too', async () => {
    const { raw } = memoryStorage();
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    store.getState().snooze(dose, at);
    store.getState().toggleSkipped(dose, later);
    expect(store.getState().snoozes).toEqual([]);
    store.getState().snooze(dose, at);
    store.getState().deleteMedication('synthroid');
    expect(store.getState().snoozes).toEqual([]);
  });

  it('migrates data saved by version 1: keeps everything and starts with no snoozes', async () => {
    const log = { ...dose, outcome: 'taken', loggedAt: at.toISOString() };
    const { raw } = memoryStorage({ [STORAGE_KEY]: saved({ userName: 'Sam', medications: [med], logs: [log] }) });
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    expect(store.getState()).toMatchObject({ userName: 'Sam', medications: [med], logs: [log], snoozes: [] });
  });
});

describe('coins and the home', () => {
  // Synthroid at 6:30 on the sample data has a 30 minute grace window.
  const onTime = new Date(2025, 2, 15, 6, 40);
  const late = new Date(2025, 2, 15, 9, 0);
  const mk = async () => {
    const { raw } = memoryStorage();
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    return { store, raw };
  };

  it('pays 5 coins for a dose taken on time, and saves them', async () => {
    const { store, raw } = await mk();
    store.getState().toggleTaken(dose, onTime);
    await flush();
    const again = createPillboxStore(raw);
    await again.persist.rehydrate();
    expect(coinBalance(again.getState().home)).toBe(5);
  });

  it('pays nothing for a late dose', async () => {
    const { store } = await mk();
    store.getState().toggleTaken(dose, late);
    expect(coinBalance(store.getState().home)).toBe(0);
  });

  it('takes the coins back when the dose is unchecked or skipped', async () => {
    const { store } = await mk();
    store.getState().toggleTaken(dose, onTime);
    store.getState().toggleTaken(dose, onTime);
    expect(coinBalance(store.getState().home)).toBe(0);
    store.getState().toggleTaken(dose, onTime);
    store.getState().toggleSkipped(dose, onTime);
    expect(coinBalance(store.getState().home)).toBe(0);
  });

  it('keeps the coins when the medication is deleted', async () => {
    const { store } = await mk();
    store.getState().toggleTaken(dose, onTime);
    store.getState().deleteMedication('synthroid');
    expect(coinBalance(store.getState().home)).toBe(5);
  });

  it('buys with the coins, saves the purchase, and refuses what it cannot afford', async () => {
    const { store, raw } = await mk();
    const days = ['2025-03-11', '2025-03-12', '2025-03-13', '2025-03-14'];
    for (const date of days) store.getState().toggleTaken({ ...dose, date }, new Date(`${date}T06:35:00`));
    expect(coinBalance(store.getState().home)).toBe(20);
    store.getState().buy('sofa', onTime);
    expect(store.getState().home.purchases).toEqual([]);
    store.getState().buy('rug', onTime);
    await flush();
    const again = createPillboxStore(raw);
    await again.persist.rehydrate();
    expect(again.getState().home.purchases.map((p) => p.id)).toEqual(['rug']);
    expect(coinBalance(again.getState().home)).toBe(0);
  });

  it('migrates data saved by version 2, paying for the on-time doses already logged', async () => {
    const log = { ...dose, outcome: 'taken', loggedAt: onTime.toISOString() };
    const synthroid = seedMedications[0];
    const v2 = JSON.stringify({ state: { userName: 'Sam', medications: [synthroid], logs: [log], snoozes: [] }, version: 2 });
    const { raw } = memoryStorage({ [STORAGE_KEY]: v2 });
    const store = createPillboxStore(raw);
    await store.persist.rehydrate();
    expect(store.getState()).toMatchObject({ userName: 'Sam', medications: [synthroid], logs: [log] });
    expect(coinBalance(store.getState().home)).toBe(5);
  });

  it('saves decorating, for free', async () => {
    const { store, raw } = await mk();
    store.getState().grantCoins(200);
    store.getState().buy('sofa', onTime);
    store.getState().decorateItem('sofa', { dx: -30, color: 'mint' });
    store.getState().decorateRoom('living', { wall: 'lilac', floor: 'walnut' });
    await flush();
    const again = createPillboxStore(raw);
    await again.persist.rehydrate();
    expect(again.getState().home.decor).toEqual({ items: { sofa: { dx: -30, color: 'mint' } }, rooms: { living: { wall: 'lilac', floor: 'walnut' } } });
    expect(coinBalance(again.getState().home)).toBe(80);
  });

  it('reset empties the home', async () => {
    const { store } = await mk();
    store.getState().toggleTaken(dose, onTime);
    store.getState().reset();
    expect(store.getState().home).toEqual(emptyHome());
  });
});
