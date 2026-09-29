import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { planReminders } from '@/domain/reminders';
import { usePillbox } from '@/store/pillbox';
import { applyReminders, onReminderOpened, remindersAvailable } from './notifier';

/** Waits for a burst of changes (for example several quick check-offs) before touching the OS. */
const SETTLE_MS = 300;

/**
 * Keeps the OS's pending reminders in line with the saved data: after loading, after any change to
 * medications, logs or snoozes, and whenever the app returns to the foreground (which also moves
 * the planning window forward). Call once, from the root layout, after hydration.
 */
export function useReminderSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !remindersAvailable) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running: Promise<void> = Promise.resolve();

    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // One run at a time, so two runs never schedule the same reminder twice.
        running = running.then(async () => {
          const { medications, logs, snoozes } = usePillbox.getState();
          try {
            await applyReminders(planReminders(medications, logs, snoozes, new Date()));
          } catch (error) {
            console.warn(`[pillbox] Could not update reminders: ${String(error)}`);
          }
        });
      }, SETTLE_MS);
    };

    sync();
    const offStore = usePillbox.subscribe((state, prev) => {
      if (state.medications !== prev.medications || state.logs !== prev.logs || state.snoozes !== prev.snoozes) sync();
    });
    const offApp = AppState.addEventListener('change', (s) => s === 'active' && sync());
    const offOpened = onReminderOpened(() => router.navigate('/'));
    return () => {
      clearTimeout(timer);
      offStore();
      offApp.remove();
      offOpened();
    };
  }, [enabled]);
}
