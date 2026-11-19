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
import { coinBalance } from '@/domain/home';
import { doseActions, type DoseAction } from '@/domain/status';
import { CoinChip } from '@/features/home/CoinChip';
import { remindersAvailable } from '@/features/reminders/notifier';
import { AddMedicationButton } from '@/features/medication-form/AddMedicationButton';
import { DoseCard } from '@/features/today/DoseCard';
import { WeekStrip } from '@/features/today/WeekStrip';
import { useNow } from '@/hooks/use-now';
import { usePillbox } from '@/store/pillbox';
import { FocusedScene } from '@/design-system/primitives/FocusedScene';
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
  // When the date rolls over (app left open overnight, or reopened on a new day), go back to today.
  // Done during render, React's pattern for adjusting state to a changed value, not in an effect.
  const [shownToday, setShownToday] = useState(today);
  if (shownToday !== today) {
    setShownToday(today);
    setSelected(today);
  }

  const userName = usePillbox((s) => s.userName);
  const medications = usePillbox((s) => s.medications);
  const logs = usePillbox((s) => s.logs);
  const toggleTaken = usePillbox((s) => s.toggleTaken);
  const toggleSkipped = usePillbox((s) => s.toggleSkipped);
  const snooze = usePillbox((s) => s.snooze);
  const snoozes = usePillbox((s) => s.snoozes);
  const home = usePillbox((s) => s.home);
  const [menuFor, setMenuFor] = useState<DayEntry | null>(null);

  const entries = useMemo(() => buildDay(medications, logs, selected, now), [medications, logs, selected, now]);

  return (
    <FocusedScene style={{ flex: 1, paddingTop: insets.top }}>
      <View style={[rule, { padding: space[5], flexDirection: 'row', alignItems: 'center', gap: space[3] }]}>
        <Text variant="heading" style={{ flex: 1 }}>
          {`Good ${greetingFor(now)}, `}
          <Text variant="heading" accent>{userName}</Text>
          {'.'}
        </Text>
        <CoinChip coins={coinBalance(home)} onPress={() => router.navigate('/home')} accessibilityHint="Opens your home" />
      </View>

      <View style={[rule, { paddingHorizontal: space[5], paddingVertical: space[3] }]}>
        <Text variant="label" accent>{monthYearLabel(selected)}</Text>
      </View>

      <View style={rule}>
        <WeekStrip today={today} selected={selected} onSelect={setSelected} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => doseKey(e.dose)}
        contentContainerStyle={{ padding: space[5], gap: space[5], flexGrow: 1 }}
        ListEmptyComponent={medications.length === 0 ? (
          <View style={{ gap: space[4] }}>
            <Text variant="subheading" tone="placeholder">No medications yet. Add one to see its doses here.</Text>
            <AddMedicationButton style={{ alignSelf: 'flex-start' }} />
          </View>
        ) : (
          <Text variant="subheading" tone="placeholder">No doses scheduled for this day.</Text>
        )}
        renderItem={({ item: e }) => (
          <DoseCard
            name={e.medication.name}
            subtitle={medicationSubtitle(e.medication)}
            time={e.dose.time}
            status={e.status}
            alertsEnabled={e.medication.alertsEnabled}
            loggedAt={e.log?.loggedAt}
            coins={home.earned[doseKey(e.dose)]}
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
