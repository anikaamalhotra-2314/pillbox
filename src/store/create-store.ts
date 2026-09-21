import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { toLocalDate } from '@/domain/dates';
import { toggleTaken } from '@/domain/logs';
import { parsePersistedState, type PersistedState } from '@/domain/persist';
import type { Dose, Medication } from '@/domain/types';
import { createSeedMedications } from './seed';
import { createSafeStorage, type RawStorage } from './storage';

export const STORAGE_KEY = 'pillbox';
// Bump this when the stored shape changes AND extend `migrate`. Without a migrate function, zustand
// ignores data saved under a different version, which would silently discard the user's medications.
export const STORAGE_VERSION = 1;

export interface PillboxState extends PersistedState {
  toggleTaken: (dose: Dose, now: Date) => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (medication: Medication) => void;
  /** Removes the medication and its dose history. */
  deleteMedication: (id: string) => void;
  /** Back to the sample data. For development and tests. */
  reset: () => void;
}

// First launch starts with the sample data from the Figma, until there is a real empty state.
const initial = (now: () => number): PersistedState => ({
  userName: 'Anika',
  medications: createSeedMedications(toLocalDate(new Date(now()))),
  logs: [],
});

/** A store that saves to `raw`. Separate from the default instance so tests can pass an in-memory `raw`. */
export function createPillboxStore(raw: RawStorage, now: () => number = Date.now) {
  return create<PillboxState>()(
    persist<PillboxState, [], [], PersistedState>(
      (set) => ({
        ...initial(now),
        addMedication: (medication) => set((state) => ({ medications: [...state.medications, medication] })),
        updateMedication: (medication) =>
          set((state) => ({ medications: state.medications.map((m) => (m.id === medication.id ? medication : m)) })),
        deleteMedication: (id) =>
          set((state) => ({
            medications: state.medications.filter((m) => m.id !== id),
            logs: state.logs.filter((l) => l.medicationId !== id),
          })),
        toggleTaken: (dose, at) =>
          set((state) => (dose.date > toLocalDate(at) ? state : { logs: toggleTaken(state.logs, dose, at) })),
        reset: () => set(initial(now)),
      }),
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage: createSafeStorage<PersistedState>(raw, now),
        partialize: (state) => ({ userName: state.userName, medications: state.medications, logs: state.logs }),
        // Hydrate from the root layout, on the client only: the static web export runs in Node, with no storage.
        skipHydration: true,
        // Version 1 is the only shape so far. Add steps here when it changes. The cast is safe because
        // `merge` below validates whatever comes out.
        migrate: (state) => state as PersistedState,
        merge: (persisted, current) => {
          try {
            const parsed = parsePersistedState(persisted);
            if (!parsed) return current;
            if (parsed.dropped > 0) {
              // Keep the original so nothing the user entered is lost for good.
              raw.setItem(`${STORAGE_KEY}:salvaged:${now()}`, JSON.stringify(persisted)).catch(() => {});
            }
            return { ...current, ...parsed.state };
          } catch {
            return current;
          }
        },
      },
    ),
  );
}
