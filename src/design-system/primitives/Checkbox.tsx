import { Pressable, View } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color } from '@/design-system/tokens';

type Props = {
  checked: boolean;
  /** Mark drawn when the box is filled. A dash is used for "skipped". */
  glyph?: 'check' | 'dash';
  dimmed?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
};

const SIZE = 24;

/** 24pt box with a 44pt touch target (hit slop), so the visual matches the design. */
export function Checkbox({ checked, glyph = 'check', dimmed, disabled, onPress, accessibilityLabel }: Props) {
  const ink = dimmed ? color.border.dimmed : color.border.strong;
  const filled = checked || glyph === 'dash';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderWidth: borderWidth.default,
          borderColor: ink,
          borderRadius: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {filled && glyph === 'check' && <Text variant="numeral" style={{ color: ink }}>✓</Text>}
        {filled && glyph === 'dash' && <View style={{ width: 12, height: 2, backgroundColor: ink }} />}
      </View>
    </Pressable>
  );
}
