import { View } from 'react-native';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, radius, space } from '@/design-system/tokens';

export const coinsLabel = (coins: number) => `${coins} ${Math.abs(coins) === 1 ? 'coin' : 'coins'}`;

const chip = {
  minHeight: 32, justifyContent: 'center', paddingHorizontal: space[3],
  backgroundColor: color.surface.action, borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card,
} as const;

/** The coin balance, in yellow. With `onPress` it is a button (44pt target) that leads to the home. */
export function CoinChip({ coins, onPress, accessibilityHint }: { coins: number; onPress?: () => void; accessibilityHint?: string }) {
  const face = <View style={chip}><Text variant="subheading">{coinsLabel(coins)}</Text></View>;
  if (!onPress) return <View accessible accessibilityLabel={coinsLabel(coins)}>{face}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={coinsLabel(coins)}
      accessibilityHint={accessibilityHint}
      hitSlop={6}
      style={{ minHeight: 44, justifyContent: 'center' }}
    >
      {face}
    </Pressable>
  );
}
