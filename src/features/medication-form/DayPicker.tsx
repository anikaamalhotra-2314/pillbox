import { View } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { WEEKDAYS, type Weekday } from '@/domain/dates';
import { weekdayName } from '@/domain/format';
import { Pressable } from '@/design-system/primitives/Pressable';

const SIZE = 36;

type Props = { value: Weekday[]; onChange: (days: Weekday[]) => void; error?: string };

/** Seven day toggles. Two-letter labels (Mo Tu We Th Fr Sa Su), each announced as its full weekday (decision 0009). */
export function DayPicker({ value, onChange, error }: Props) {
  const toggle = (day: Weekday) => onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="label" accent>Days *</Text>
      <View accessibilityRole="none" role="group" aria-label="Days" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {WEEKDAYS.map((day) => {
          const on = value.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggle(day)}
              hitSlop={4}
              accessibilityRole="checkbox"
              accessibilityLabel={weekdayName(day)}
              aria-checked={on}
              style={{
                width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? color.surface.selected : 'transparent',
                // A heavier ring plus a bold label, so selection never depends on fill alone (decision 0009).
                borderWidth: on ? 2 : borderWidth.default,
                borderColor: color.border.strong,
              }}
            >
              <Text variant="subheading" bold={on}>{weekdayName(day).slice(0, 2)}</Text>
            </Pressable>
          );
        })}
      </View>
      {error && <Text variant="subheading" role="alert">{error}</Text>}
    </View>
  );
}
