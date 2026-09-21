import { useState, type Ref } from 'react';
import { Pressable as RNPressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';

import { shouldShowFocusRing } from '@/design-system/focus-visible';
import { color } from '@/design-system/tokens';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; ref?: Ref<View> };

const ring: ViewStyle = { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.border.strong, outlineOffset: 2 };

/** Pressable with a visible focus ring for keyboard users. Use this instead of React Native's. */
export function Pressable({ style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <RNPressable
      {...rest}
      onFocus={(e) => {
        setFocused(shouldShowFocusRing());
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[style, focused && ring]}
    />
  );
}
