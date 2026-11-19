import { useState } from 'react';
import { View } from 'react-native';

import { BellIcon } from '@/design-system/icons/BellIcon';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import type { LocalTime } from '@/domain/dates';
import { formatTime, spokenTime } from '@/domain/format';
import { withTime } from '@/domain/medication';
import { TimeModal } from './TimeModal';
import { Pressable } from '@/design-system/primitives/Pressable';

type Props = { times: LocalTime[]; onChange: (times: LocalTime[]) => void; error?: string };

const rule = { borderColor: color.border.strong, borderWidth: borderWidth.default } as const;

/** The "Daily Times" section: a ruled header with a "+", then one row per time. */
export function TimeList({ times, onChange, error }: Props) {
  // null = closed; { } = adding; { time } = editing that time.
  const [editing, setEditing] = useState<{ time?: LocalTime } | null>(null);

  return (
    <View style={{ gap: space[3] }}>
      <View style={[{ flexDirection: 'row', alignItems: 'stretch' }, rule]}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space[3] }}>
          <Text variant="label" accent>Daily Times *</Text>
        </View>
        <Pressable
          onPress={() => setEditing({})}
          accessibilityRole="button"
          accessibilityLabel="Add a time"
          style={{ width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: borderWidth.default, borderLeftColor: color.border.strong }}
        >
          <Text variant="heading">+</Text>
        </Pressable>
      </View>

      {times.map((time) => (
        <View key={time} style={[{ flexDirection: 'row', alignItems: 'center' }, rule]}>
          <Pressable
            onPress={() => setEditing({ time })}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${spokenTime(time)}`}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: 48, paddingHorizontal: space[3] }}
          >
            <BellIcon />
            <Text variant="title">{formatTime(time)}</Text>
          </Pressable>
          <Pressable
            onPress={() => onChange(times.filter((t) => t !== time))}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${spokenTime(time)}`}
            style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[3] }}
          >
            <Text variant="label" accent>Remove</Text>
          </Pressable>
        </View>
      ))}

      {error && <Text variant="subheading" role="alert">{error}</Text>}

      <TimeModal
        visible={editing !== null}
        initial={editing?.time}
        validate={(t) => (times.includes(t) && t !== editing?.time ? 'That time is already added.' : undefined)}
        onCancel={() => setEditing(null)}
        onConfirm={(t) => {
          onChange(withTime(times, t, editing?.time));
          setEditing(null);
        }}
      />
    </View>
  );
}
