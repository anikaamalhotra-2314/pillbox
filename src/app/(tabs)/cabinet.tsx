import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusedScene } from '@/design-system/primitives/FocusedScene';
import { Pressable } from '@/design-system/primitives/Pressable';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { cabinetTitle, medicationSubtitle } from '@/domain/format';
import { sortMedications } from '@/domain/medication';
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
        ListEmptyComponent={<Text variant="subheading" tone="placeholder">Your cabinet is empty. Add a medication with the + button.</Text>}
        renderItem={({ item: m }) => (
          <StackedCard
            tone="periwinkle"
            onPress={() => router.push({ pathname: '/medication/[id]', params: { id: m.id } })}
            accessibilityLabel={`${m.name}, ${medicationSubtitle(m)}`}
            accessibilityHint="Opens medication details"
            contentStyle={{ minHeight: 66, alignItems: 'center', justifyContent: 'center', paddingVertical: space[3] }}
          >
            <Text variant="title">{m.name}</Text>
            <Text variant="subheading">{medicationSubtitle(m)}</Text>
          </StackedCard>
        )}
      />

      <View style={[rule, { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: borderWidth.default }]}>
        <Pressable
          onPress={() => router.push('/add')}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
          style={[rule, { width: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: borderWidth.default }]}
        >
          <Text variant="heading">+</Text>
        </Pressable>
      </View>
    </FocusedScene>
  );
}
