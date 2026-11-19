import { Text as RNText, type TextProps } from 'react-native';

import { color, fontFamily, fontSize } from '@/design-system/tokens';

export type TextVariant = keyof typeof fontSize;
type TextTone = keyof typeof color.text;

type Props = TextProps & {
  variant?: TextVariant;
  /** Italic accent: greeting name, status tags, month, form labels. */
  accent?: boolean;
  tone?: TextTone;
};


export function Text({ variant = 'title', accent = false, tone = 'primary', style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: accent ? fontFamily.italic : fontFamily.regular, fontSize: fontSize[variant], color: color.text[tone] }, style]}
    />
  );
}
