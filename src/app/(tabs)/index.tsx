import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { toLocalDate } from '@/domain/dates';
import { buildDay, doseKey, type DayEntry } from '@/domain/day';
import { formatTime, greetingFor, medicationSubtitle, monthYearLabel } from '@/domain/format';
import { canSnooze, snoozedUntil, SNOOZE_MINUTES } from '@/domain/reminders';
import { doseActions, type DoseAction } from '@/domain/status';
import { remindersAvailable } from '@/features/reminders/notifier';
import { DoseCard } from '@/features/today/DoseCard';
import { WeekStrip } from '@/features/today/WeekStrip';
import { useNow } from '@/hooks/use-now';
import { usePillbox } from '@/store/pillbox';
import { FocusedScene } from '@/design-system/primitives/FocusedScene';
import { Pressable } from '@/design-system/primitives/Pressable';
import { ActionMenu } from '@/design-system/primitives/ActionMenu';

const ACTION_LABELS: Record<DoseAction, string> = {
  skip: 'Skip this dose',
  unskip: 'Undo skip',
  snooze: `Snooze ${SNOOZE_MINUTES} minutes`,
  edit: 'Edit medication',
};

const rule = { borderBottomWidth: borderWidth.default, borderBottomColor: color.border.strong } as const;

export default function Today() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const today = toLocalDate(now);
  const [selected, setSelected] = useState(today);

  const userName = usePillbox((s) => s.userName);
  const medications = usePillbox((s) => s.medications);
  const logs = usePillbox((s) => s.logs);
  const toggleTaken = usePillbox((s) => s.toggleTaken);
  const toggleSkipped = usePillbox((s) => s.toggleSkipped);
  const snooze = usePillbox((s) => s.snooze);
  const snoozes = usePillbox((s) => s.snoozes);
  const [menuFor, setMenuFor] = useState<DayEntry | null>(null);

  const entries = useMemo(() => buildDay(medications, logs, selected, now), [medications, logs, selected, now]);

  return (
    <FocusedScene style={{ flex: 1, paddingTop: insets.top }}>
      <View style={[rule, { padding: space[5] }]}>
        <Text variant="heading">
          {`Good ${greetingFor(now)}, `}
          <Text variant="heading" accent>{userName}</Text>
          {'.'}
        </Text>
      </View>

      <View style={[rule, { flexDirection: 'row', alignItems: 'stretch' }]}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space[5], paddingVertical: space[2] }}>
          <Text variant="label" accent>{monthYearLabel(selected)}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/add')}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
          style={{ width: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: borderWidth.default, borderLeftColor: color.border.strong }}
        >
          <Text variant="heading">+</Text>
        </Pressable>
      </View>

      <View style={rule}>
        <WeekStrip today={today} selected={selected} onSelect={setSelected} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => doseKey(e.dose)}
        contentContainerStyle={{ padding: space[5], gap: space[5], flexGrow: 1 }}
        ListEmptyComponent={<Text variant="subheading" tone="placeholder">No doses scheduled for this day.</Text>}
        renderItem={({ item: e }) => (
          <DoseCard
            name={e.medication.name}
            subtitle={medicationSubtitle(e.medication)}
            time={e.dose.time}
            status={e.status}
            alertsEnabled={e.medication.alertsEnabled}
            loggedAt={e.log?.loggedAt}
            snoozedUntil={snoozedUntil(snoozes, e.dose, now)}
            onOpen={() => router.push({ pathname: '/medication/[id]', params: { id: e.medication.id } })}
            onToggleTaken={() => toggleTaken(e.dose, now)}
            onOpenMenu={() => setMenuFor(e)}
          />
        )}
      />

      <ActionMenu
        visible={menuFor !== null}
        title={menuFor ? `${menuFor.medication.name}, ${formatTime(menuFor.dose.time)}` : ''}
        actions={menuFor ? doseActions(menuFor.status, {
          snoozable: remindersAvailable && canSnooze(menuFor.status, menuFor.medication.alertsEnabled),
        }).map((action) => ({
          label: ACTION_LABELS[action],
          onPress: () => {
            setMenuFor(null);
            if (action === 'edit') {
              router.push({ pathname: '/medication/[id]', params: { id: menuFor.medication.id, edit: '1' } });
            } else if (action === 'snooze') {
              snooze(menuFor.dose, new Date());
            } else {
              toggleSkipped(menuFor.dose, new Date());
            }
          },
        })) : []}
        onClose={() => setMenuFor(null)}
      />
    </FocusedScene>
  );
}
