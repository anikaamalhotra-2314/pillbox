import { router } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';

import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { space } from '@/design-system/tokens';

/** The yellow stacked button that opens the add form, styled like the form's own submit button. */
export function AddMedicationButton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <StackedCard
      tone="yellow"
      onPress={() => router.push('/add')}
      accessibilityLabel="Add medication"
      style={style}
      contentStyle={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], paddingVertical: space[3], paddingHorizontal: space[6] }}
    >
      <Text variant="title" aria-hidden>+</Text>
      <Text variant="title">Add medication</Text>
    </StackedCard>
  );
}
