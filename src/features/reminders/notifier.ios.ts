import * as Notifications from 'expo-notifications';

import { reconcileReminders, type PendingReminder, type Reminder } from '@/domain/reminders';

export const remindersAvailable = true;

// A reminder that arrives while the app is open still shows as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Asks once, the first time there is something to remind about. A refusal is respected. */
async function canNotify(): Promise<boolean> {
  const allowed = (p: Notifications.NotificationPermissionsStatus) =>
    p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  const current = await Notifications.getPermissionsAsync();
  if (allowed(current)) return true;
  if (!current.canAskAgain) return false;
  return allowed(await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } }));
}

function toPending(request: Notifications.NotificationRequest): PendingReminder {
  const fireAt = request.content.data?.fireAt;
  return {
    id: request.identifier,
    title: request.content.title,
    body: request.content.body,
    fireAt: typeof fireAt === 'number' ? fireAt : undefined,
  };
}

/** Makes the pending notifications match `plan`, touching only what differs. */
export async function applyReminders(plan: Reminder[]): Promise<void> {
  const pending = (await Notifications.getAllScheduledNotificationsAsync()).map(toPending);
  const { cancel, schedule } = reconcileReminders(pending, plan);
  await Promise.all(cancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  if (schedule.length === 0 || !(await canNotify())) return;
  await Promise.all(
    schedule.map((r) =>
      Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, sound: 'default', data: { fireAt: r.fireAt, ...r.dose } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.fireAt },
      }),
    ),
  );
}

export function onReminderOpened(onOpen: () => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) onOpen();
  });
  return () => sub.remove();
}
