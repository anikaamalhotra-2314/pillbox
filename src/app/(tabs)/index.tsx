import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { toLocalDate } from '@/domain/dates';
import { buildDay, doseKey } from '@/domain/day';
import { greetingFor, monthYearLabel } from '@/domain/format';
import { DoseCard } from '@/features/today/DoseCard';
import { WeekStrip } from '@/features/today/WeekStrip';
import { useNow } from '@/hooks/use-now';
import { usePillbox } from '@/store/pillbox';

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

  const entries = useMemo(() => buildDay(medications, logs, selected, now), [medications, logs, selected, now]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
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
            subtitle={e.medication.notes ? `${e.medication.notes} | ${e.medication.dosage}` : e.medication.dosage}
            time={e.dose.time}
            status={e.status}
            alertsEnabled={e.medication.alertsEnabled}
            loggedAt={e.log?.loggedAt}
            onOpen={() => router.push({ pathname: '/medication/[id]', params: { id: e.medication.id } })}
            onToggleTaken={() => toggleTaken(e.dose, now)}
          />
        )}
      />
    </View>
  );
}
