import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusedScene } from '@/design-system/primitives/FocusedScene';
import { PillIcon } from '@/design-system/icons/PillIcon';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { cabinetTitle, medicationSubtitle } from '@/domain/format';
import { sortMedications } from '@/domain/medication';
import { pillIconOf } from '@/domain/pill-icon';
import { AddMedicationButton } from '@/features/medication-form/AddMedicationButton';
import { usePillbox } from '@/store/pillbox';

export default function Cabinet() {
  const insets = useSafeAreaInsets();
  const userName = usePillbox((s) => s.userName);
  const medications = usePillbox((s) => s.medications);
  const sorted = useMemo(() => sortMedications(medications), [medications]);
  const rule = { borderColor: color.border.strong } as const;

  return (
    <FocusedScene style={{ flex: 1, paddingTop: insets.top }}>
      <View style={[rule, { padding: space[5], borderBottomWidth: borderWidth.default }]}>
        <Text variant="title" accent accessibilityRole="header">{cabinetTitle(userName)}</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: space[5], gap: space[5], flexGrow: 1 }}
        ListEmptyComponent={<Text variant="subheading" tone="placeholder">Your cabinet is empty. Add your first medication below.</Text>}
        renderItem={({ item: m }) => (
          <StackedCard
            tone="periwinkle"
            onPress={() => router.push({ pathname: '/medication/[id]', params: { id: m.id } })}
            accessibilityLabel={`${m.name}, ${medicationSubtitle(m)}`}
            accessibilityHint="Opens medication details"
            contentStyle={{ minHeight: 66, alignItems: 'center', justifyContent: 'center', paddingVertical: space[3] }}
          >
            {/* A cream backing, so a periwinkle pill does not vanish into the periwinkle card. */}
            <View style={{ position: 'absolute', left: space[2], top: 0, bottom: 0, justifyContent: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface.page, alignItems: 'center', justifyContent: 'center' }}>
                <PillIcon icon={pillIconOf(m)} size={32} />
              </View>
            </View>
            <Text variant="title">{m.name}</Text>
            <Text variant="subheading">{medicationSubtitle(m)}</Text>
          </StackedCard>
        )}
      />

      <View style={[rule, { borderTopWidth: borderWidth.default, paddingHorizontal: space[5], paddingTop: space[4], paddingBottom: space[3] }]}>
        <AddMedicationButton />
      </View>
    </FocusedScene>
  );
}
