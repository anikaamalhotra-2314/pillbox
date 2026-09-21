import { useState, type ReactNode } from 'react';
import { View, type AccessibilityState, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, color, radius, stackedShadow } from '@/design-system/tokens';
import { Pressable } from '@/design-system/primitives/Pressable';

export type StackedCardTone = 'peach' | 'periwinkle' | 'yellow';

// Pressed fill is always the shadow color (see color.surface.cardPressed), so each tone
// only needs a fill and a shadow. The yellow shadow reuses the action-pressed olive.
const tones = {
  peach: { fill: color.surface.card, shadow: color.surface.cardShadow },
  periwinkle: { fill: color.surface.cabinetCard, shadow: color.surface.cabinetCardShadow },
  yellow: { fill: color.surface.action, shadow: color.surface.actionPressed },
} as const;

type Props = {
  tone?: StackedCardTone;
  children: ReactNode;
  /** Without `onPress` the card is static: no button semantics, no press state. */
  onPress?: () => void;
  /** Force the pressed look (galleries, tests). */
  pressed?: boolean;
  disabled?: boolean;
  /** Softer outline for resolved or locked cards. */
  dimmed?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  /** Style for the outer box (margins, width). */
  style?: StyleProp<ViewStyle>;
  /** Style for the card face (padding, alignment). */
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The signature card: a face over a second outlined layer offset down and right.
 * Not a blur shadow, so it is built from two views. The outer box reserves the offset
 * so the shadow never spills into the neighbouring layout.
 */
export function StackedCard({
  tone = 'peach',
  children,
  onPress,
  pressed: pressedProp,
  disabled,
  dimmed,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  style,
  contentStyle,
  testID,
}: Props) {
  const [down, setDown] = useState(false);
  const t = tones[tone];
  const isPressed = pressedProp ?? (down && !disabled);
  const { offset, pressTravel } = stackedShadow;

  const layer = { borderWidth: borderWidth.default, borderColor: dimmed ? color.border.dimmed : color.border.strong, borderRadius: radius.card } as const;

  const body = (
    <>
      {!isPressed && (
        <View
          pointerEvents="none"
          style={[layer, { position: 'absolute', top: offset, left: offset, right: 0, bottom: 0, backgroundColor: t.shadow }]}
        />
      )}
      <View
        style={[
          layer,
          { backgroundColor: isPressed ? t.shadow : t.fill },
          isPressed && { transform: [{ translateX: pressTravel }, { translateY: pressTravel }] },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </>
  );

  const box: ViewStyle = { paddingRight: offset, paddingBottom: offset };

  if (!onPress) {
    return (
      <View testID={testID} style={[box, style]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      aria-disabled={disabled}
      accessibilityState={accessibilityState}
      style={[box, style]}
    >
      {body}
    </Pressable>
  );
}
