import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { space } from '@/design-system/tokens';

/** Stand-in for screens that are designed but not built yet. Delete as each is implemented. */
export function PlaceholderScreen({ title, note, back }: { title: string; note: string; back?: boolean }) {
  return (
    <View style={{ flex: 1, padding: space[5], paddingTop: 64, gap: space[3] }}>
      {back && (
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Text variant="title">← Back</Text>
        </Pressable>
      )}
      <Text variant="heading">{title}</Text>
      <Text variant="subheading" tone="placeholder">{note}</Text>
    </View>
  );
}
