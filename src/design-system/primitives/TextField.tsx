import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, fontFamily, fontSize, space } from '@/design-system/tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  required?: boolean;
  /** Shown when the field is invalid. Also thickens the outline, so it never relies on color. */
  error?: string;
  hint?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField({ label, required, error, hint, ...input }, ref) {
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="label" accent>{required ? `${label} *` : label}</Text>
      <TextInput
        ref={ref}
        {...input}
        accessibilityLabel={required ? `${label}, required` : label}
        accessibilityHint={error}
        aria-invalid={Boolean(error)}
        placeholderTextColor={color.text.placeholder}
        style={{
          minHeight: 44,
          paddingHorizontal: space[3],
          borderWidth: error ? 2 : borderWidth.default,
          borderColor: color.border.strong,
          color: color.text.primary,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.numeral, // 16 or larger stops iOS Safari zooming the page on focus
        }}
      />
      {error ? (
        <Text variant="subheading" role="alert">{error}</Text>
      ) : hint ? (
        <Text variant="subheading" tone="placeholder">{hint}</Text>
      ) : null}
    </View>
  );
});
