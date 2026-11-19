import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon, type TabIconName } from '@/design-system/icons/TabIcons';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';

// The active tab is a colored pixel glyph with an ink label; inactive tabs recede to taupe.
// Label color is not the only cue: the glyph's fill and outline change too.
const label = (title: string) =>
  function TabLabel({ focused }: { focused: boolean }) {
    return <Text variant="subheading" accent={focused} tone={focused ? 'primary' : 'taken'}>{title}</Text>;
  };

const icon = (name: TabIconName) =>
  function TabBarIcon({ focused }: { focused: boolean }) {
    return <TabIcon name={name} focused={focused} />;
  };

// Room for a 24pt glyph, its label and some air; the default bar is sized for a system icon and clips them.
const BAR_HEIGHT = 64;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.surface.page },
        tabBarStyle: {
          backgroundColor: color.surface.page,
          borderTopWidth: borderWidth.default,
          borderTopColor: color.border.strong,
          height: BAR_HEIGHT + insets.bottom,
          paddingTop: space[2],
        },
        tabBarItemStyle: { gap: space[1] },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('today'), tabBarLabel: label('Today'), tabBarAccessibilityLabel: 'Today' }} />
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home'), tabBarLabel: label('Home'), tabBarAccessibilityLabel: 'Your home' }} />
      <Tabs.Screen name="cabinet" options={{ title: 'Cabinet', tabBarIcon: icon('cabinet'), tabBarLabel: label('Cabinet'), tabBarAccessibilityLabel: 'Medicine cabinet' }} />
    </Tabs>
  );
}
