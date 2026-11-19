import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';

export interface SwatchOption<T extends string> {
  /** null is "Original": back to how it came. */
  id: T | null;
  label: string;
  /** What the swatch shows: a fill color, or a small drawing (floors). */
  fill?: string;
  preview?: ReactNode;
}

const SIZE = 40;

/**
 * A row of color or pattern choices, one of which is chosen. The chosen one gets a heavy ring and an offset
 * outline, so it never depends on color alone (decision 0009), and its name is written above the row.
 */
export function SwatchRow<T extends string>({ title, options, value, onChange }: {
  title: string;
  options: SwatchOption<T>[];
  value: T | null;
  onChange: (id: T | null) => void;
}) {
  const chosen = options.find((o) => o.id === value) ?? options[0];
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="subheading">
        {`${title}: `}
        <Text variant="subheading" accent>{chosen.label}</Text>
      </Text>
      <View role="radiogroup" accessibilityLabel={title} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
        {options.map((o) => {
          const on = o.id === chosen.id;
          return (
            <Pressable
              key={o.id ?? 'original'}
              onPress={() => onChange(o.id)}
              role="radio"
              aria-checked={on}
              accessibilityLabel={o.label}
              style={{
                width: SIZE + 8, height: SIZE + 8, alignItems: 'center', justifyContent: 'center', borderRadius: 6,
                borderWidth: on ? 2 : 0, borderColor: color.border.strong, borderStyle: on ? 'solid' : undefined,
              }}
            >
              <View
                style={{
                  width: SIZE, height: SIZE, borderRadius: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: o.fill, borderWidth: on ? 2 : borderWidth.default, borderColor: color.border.strong,
                }}
              >
                {o.preview}
                {o.id === null && <Text variant="subheading" accent>orig</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
