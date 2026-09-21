import type { PersistStorage, StorageValue } from 'zustand/middleware';

/** The small async key-value interface that AsyncStorage (and a test double) provide. */
export interface RawStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Persist storage that never throws and never loses data silently:
 * - a read that fails is treated as "nothing saved", so the app still starts;
 * - text that is not valid JSON is copied to `<key>:corrupt:<time>` before anything can overwrite it;
 * - a failed write is logged and the app keeps working from memory.
 */
export function createSafeStorage<S>(raw: RawStorage, now: () => number = Date.now): PersistStorage<S> {
  return {
    getItem: async (name) => {
      let text: string | null;
      try {
        text = await raw.getItem(name);
      } catch (error) {
        console.warn(`[pillbox] Could not read saved data: ${String(error)}`);
        return null;
      }
      if (text === null) return null;
      try {
        return JSON.parse(text) as StorageValue<S>;
      } catch {
        try {
          await raw.setItem(`${name}:corrupt:${now()}`, text);
        } catch {
          /* nothing more we can do */
        }
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await raw.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.warn(`[pillbox] Could not save data: ${String(error)}`);
      }
    },
    removeItem: async (name) => {
      try {
        await raw.removeItem(name);
      } catch (error) {
        console.warn(`[pillbox] Could not clear data: ${String(error)}`);
      }
    },
  };
}
