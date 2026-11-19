import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { toLocalDate } from '@/domain/dates';
import { doseKey } from '@/domain/day';
import type { Avatar } from '@/domain/avatar';
import { changeAvatar, decorateItem, decorateRoom, emptyHome, grantCoins, purchase, settleDose, type ItemChange } from '@/domain/home';
import type { CatalogId, FloorStyle, ItemId, RoomId, WallPaint } from '@/domain/home-catalog';
import { toggleSkipped, toggleTaken } from '@/domain/logs';
import { parsePersistedState, type PersistedState } from '@/domain/persist';
import { snoozeDose } from '@/domain/reminders';
import type { Dose, Medication } from '@/domain/types';
import { createSeedMedications } from './seed';
import { createSafeStorage, type RawStorage } from './storage';

export const STORAGE_KEY = 'pillbox';
// Bump this when the stored shape changes AND extend `migrate`. Without a migrate function, zustand
// ignores data saved under a different version, which would silently discard the user's medications.
export const STORAGE_VERSION = 4;

export interface PillboxState extends PersistedState {
  toggleTaken: (dose: Dose, now: Date) => void;
  toggleSkipped: (dose: Dose, now: Date) => void;
  /** Re-sends the dose's reminder in a few minutes (decision 0026). */
  snooze: (dose: Dose, now: Date) => void;
  /** Spends coins on a floor, room or piece of furniture. Does nothing if it isn't available. */
  buy: (id: CatalogId, now: Date) => void;
  /** Moves or repaints owned furniture. Free. null puts a choice back to the original. */
  decorateItem: (id: ItemId, change: ItemChange) => void;
  /** Repaints a room's walls or changes its floor. Free. */
  decorateRoom: (id: RoomId, change: { wall?: WallPaint | null; floor?: FloorStyle | null }) => void;
  changeAvatar: (change: Partial<Avatar>) => void;
  /** Development only: free coins, to try out the shop. */
  grantCoins: (amount: number) => void;
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
  snoozes: [],
  home: emptyHome(),
});

/** Logging a dose ends its snooze: there is nothing left to remind about. */
const withoutSnooze = (state: PillboxState, dose: Dose) => state.snoozes.filter((s) => doseKey(s) !== doseKey(dose));

/** After a dose's log changes: its coins follow (paid on time, taken back on undo or skip), and its snooze ends. */
function afterLogChange(state: PillboxState, dose: Dose, logs: PillboxState['logs']): Partial<PillboxState> {
  const log = logs.find((l) => doseKey(l) === doseKey(dose));
  const grace = state.medications.find((m) => m.id === dose.medicationId)?.graceMinutes;
  const earned = grace === undefined ? state.home.earned : settleDose(state.home.earned, dose, log, grace);
  return { logs, snoozes: withoutSnooze(state, dose), home: earned === state.home.earned ? state.home : { ...state.home, earned } };
}

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
            snoozes: state.snoozes.filter((s) => s.medicationId !== id),
          })),
        // Deleting a medication keeps its coins: they were earned.
        toggleTaken: (dose, at) =>
          set((state) => (dose.date > toLocalDate(at) ? state : afterLogChange(state, dose, toggleTaken(state.logs, dose, at)))),
        toggleSkipped: (dose, at) =>
          set((state) => (dose.date > toLocalDate(at) ? state : afterLogChange(state, dose, toggleSkipped(state.logs, dose, at)))),
        snooze: (dose, at) => set((state) => ({ snoozes: snoozeDose(state.snoozes, dose, at) })),
        buy: (id, at) => set((state) => ({ home: purchase(state.home, id, at) })),
        decorateItem: (id, change) => set((state) => ({ home: decorateItem(state.home, id, change) })),
        decorateRoom: (id, change) => set((state) => ({ home: decorateRoom(state.home, id, change) })),
        changeAvatar: (change) => set((state) => ({ home: changeAvatar(state.home, change) })),
        grantCoins: (amount) => set((state) => ({ home: grantCoins(state.home, amount) })),
        reset: () => set(initial(now)),
      }),
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage: createSafeStorage<PersistedState>(raw, now),
        partialize: (state) => ({ userName: state.userName, medications: state.medications, logs: state.logs, snoozes: state.snoozes, home: state.home }),
        // Hydrate from the root layout, on the client only: the static web export runs in Node, with no storage.
        skipHydration: true,
        // One step per version bump. The casts are safe because `merge` below validates whatever comes out.
        migrate: (persisted, version) => {
          const state = { ...(persisted as Record<string, unknown>) };
          if (version < 2) state.snoozes = []; // 2: snoozes added
          // 3: the home added. Left missing on purpose: `parsePersistedState` then backfills coins from the logs.
          // 4: decorating added. Missing decor parses as nothing changed, so there is nothing to do here either.
          return state as unknown as PersistedState;
        },
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
