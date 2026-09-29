import type { Reminder } from '@/domain/reminders';

// A fake OS: pending notifications and permission state, behind the expo-notifications API.
const os = {
  pending: [] as { identifier: string; content: { title: string | null; body: string | null; data: Record<string, unknown> } }[],
  permission: { granted: false, canAskAgain: true, ios: { status: 0 } },
  grantOnAsk: true,
};

jest.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => os.permission),
  requestPermissionsAsync: jest.fn(async () => {
    os.permission = os.grantOnAsk
      ? { granted: true, canAskAgain: true, ios: { status: 2 } }
      : { granted: false, canAskAgain: false, ios: { status: 1 } };
    return os.permission;
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => os.pending),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    os.pending = os.pending.filter((p) => p.identifier !== id);
  }),
  scheduleNotificationAsync: jest.fn(async ({ identifier, content }) => {
    os.pending.push({ identifier, content });
    return identifier;
  }),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// eslint-disable-next-line import/first
import * as Notifications from 'expo-notifications';
// eslint-disable-next-line import/first
import { applyReminders } from '../notifier.ios';

const mocked = jest.mocked(Notifications);
const reminder = (time: string, fireAt: number): Reminder => ({
  id: `dose|synthroid|2025-03-15|${time}`, fireAt, title: 'Time for Synthroid', body: `${time} · 1 pill | 125mg`,
  dose: { medicationId: 'synthroid', date: '2025-03-15', time },
});
const evening = reminder('19:00', new Date(2025, 2, 15, 19).getTime());
const morning = reminder('06:30', new Date(2025, 2, 16, 6, 30).getTime());

beforeEach(() => {
  os.pending = [];
  os.permission = { granted: false, canAskAgain: true, ios: { status: 0 } };
  os.grantOnAsk = true;
  jest.clearAllMocks();
});

it('asks for permission the first time there is something to schedule, then schedules one-time reminders', async () => {
  await applyReminders([evening]);
  expect(mocked.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: evening.id,
    content: { title: evening.title, body: evening.body, sound: 'default', data: { fireAt: evening.fireAt, ...evening.dose } },
    trigger: { type: 'date', date: evening.fireAt },
  });
});

it('does not ask when there is nothing to remind about', async () => {
  await applyReminders([]);
  expect(mocked.getPermissionsAsync).not.toHaveBeenCalled();
  expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
});

it('leaves matching reminders alone and changes only the difference', async () => {
  await applyReminders([evening, morning]);
  jest.clearAllMocks();
  await applyReminders([evening, morning]);
  expect(mocked.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();

  await applyReminders([morning]); // the evening dose was taken
  expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith(evening.id);
  expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(os.pending.map((p) => p.identifier)).toEqual([morning.id]);
});

it('respects a refusal: never asks again, schedules nothing, but still cancels', async () => {
  os.grantOnAsk = false;
  await applyReminders([evening]);
  expect(os.pending).toEqual([]);
  os.pending = [{ identifier: 'dose|old|2025-03-14|08:00', content: { title: 'x', body: 'y', data: {} } }];
  jest.clearAllMocks();
  await applyReminders([evening]);
  expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('dose|old|2025-03-14|08:00');
  expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('treats provisional permission as allowed', async () => {
  os.permission = { granted: false, canAskAgain: true, ios: { status: 3 } };
  await applyReminders([evening]);
  expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});
