import { Text as RNText, type TextProps } from 'react-native';

import { color, fontFamily, fontSize } from '@/design-system/tokens';

export type TextVariant = keyof typeof fontSize;
type TextTone = keyof typeof color.text;

type Props = TextProps & {
  variant?: TextVariant;
  /** Italic accent: greeting name, time labels, month, form labels. */
  accent?: boolean;
  bold?: boolean;
  tone?: TextTone;
};

function familyFor(accent: boolean, bold: boolean) {
  if (bold) return accent ? fontFamily.boldItalic : fontFamily.bold;
  return accent ? fontFamily.italic : fontFamily.regular;
}

export function Text({ variant = 'title', accent = false, bold = false, tone = 'primary', style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: familyFor(accent, bold), fontSize: fontSize[variant], color: color.text[tone] }, style]}
    />
  );
}
