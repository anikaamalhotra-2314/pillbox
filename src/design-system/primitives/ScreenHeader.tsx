import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { Pressable } from '@/design-system/primitives/Pressable';

/** Back button in a ruled box, then the title, then an optional trailing control. */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const rule = { borderBottomWidth: borderWidth.default, borderBottomColor: color.border.strong };
  return (
    <View style={[{ paddingTop: insets.top }, rule]}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', minHeight: 56, borderTopWidth: borderWidth.default, borderTopColor: color.border.strong }}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRightWidth: borderWidth.default, borderRightColor: color.border.strong }}
        >
          <Text variant="heading">←</Text>
        </Pressable>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space[4] }}>
          <Text variant="heading" accessibilityRole="header" numberOfLines={1}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}
