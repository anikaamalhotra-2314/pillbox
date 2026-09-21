import { useEffect, useState } from 'react';

import { usePillbox } from './pillbox';

/** Last resort: if hydration never reports back, show the app anyway rather than an endless splash. */
const GIVE_UP_AFTER_MS = 5000;

/** Loads saved data once, and reports when it is ready. Call from the root layout only. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(usePillbox.persist.hasHydrated());
  useEffect(() => {
    if (usePillbox.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const off = usePillbox.persist.onFinishHydration(() => setHydrated(true));
    const timer = setTimeout(() => {
      console.warn('[pillbox] Saved data did not load in time; starting without it.');
      setHydrated(true);
    }, GIVE_UP_AFTER_MS);
    void usePillbox.persist.rehydrate();
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);
  return hydrated;
}
