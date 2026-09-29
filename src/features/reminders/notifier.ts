import type { Reminder } from '@/domain/reminders';

// Web: browsers can't deliver a notification once the page is closed, so reminders are iOS only.
// `notifier.ios.ts` is the real one; Metro picks it on iOS.

/** Whether this device can deliver reminders. Hides Snooze where it would do nothing. */
export const remindersAvailable = false;

export async function applyReminders(_plan: Reminder[]): Promise<void> {}

/** Calls `onOpen` when the user taps a reminder. Returns an unsubscribe function. */
export function onReminderOpened(_onOpen: () => void): () => void {
  return () => {};
}
