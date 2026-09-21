import { Tabs } from 'expo-router';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, fontSize } from '@/design-system/tokens';

// PLACEHOLDER labels: the design uses pixel icons (house, capsule). Swap in the exported art.
const label = (title: string) =>
  function TabLabel({ focused }: { focused: boolean }) {
    return <Text variant="label" accent bold={focused}>{title}</Text>;
  };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.surface.page },
        tabBarStyle: { backgroundColor: color.surface.page, borderTopWidth: borderWidth.default, borderTopColor: color.border.strong },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: fontSize.label },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarLabel: label('Today'), tabBarAccessibilityLabel: 'Today' }} />
      <Tabs.Screen name="cabinet" options={{ title: 'Cabinet', tabBarLabel: label('Cabinet'), tabBarAccessibilityLabel: 'Medicine cabinet' }} />
    </Tabs>
  );
}
