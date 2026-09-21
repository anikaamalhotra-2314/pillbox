import { createPillboxStore, STORAGE_KEY } from '../create-store';
import { seedMedications } from '../seed';
import type { RawStorage } from '../storage';
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
    expect(Object.keys(stored.state).sort()).toEqual(['logs', 'medications', 'userName']);
    expect(stored.version).toBe(1);
  });

  it('survives corrupt JSON: starts from the sample data and keeps a copy of the bad text', async () => {
    const { raw, data } = memoryStorage({ [STORAGE_KEY]: '{"state": {oops' });
    const store = createPillboxStore(raw, () => NOW);
    await store.persist.rehydrate();
    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().medications).toEqual(seedMedications);
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
