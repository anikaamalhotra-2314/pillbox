import { useState } from 'react';
import { View } from 'react-native';

import { BellIcon } from '@/design-system/icons/BellIcon';
import { Checkbox } from '@/design-system/primitives/Checkbox';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { space } from '@/design-system/tokens';
import type { LocalTime } from '@/domain/dates';
import { formatTime, spokenTime, statusLabel, statusPhrase } from '@/domain/format';
import type { DoseStatus } from '@/domain/types';
import { Pressable } from '@/design-system/primitives/Pressable';

type Props = {
  name: string;
  /** e.g. "1 pill | 125mg". Composed by the caller. */
  subtitle: string;
  time: LocalTime;
  status: DoseStatus;
  alertsEnabled: boolean;
  /** ISO timestamp of when the dose was logged. Shown as "Taken 6:42am". */
  loggedAt?: string;
  onOpen: () => void;
  onToggleTaken: () => void;
  /** When given, shows the "..." button that opens the dose actions (skip, snooze, edit). */
  onOpenMenu?: () => void;
  testID?: string;
};

const DIMMED: DoseStatus[] = ['taken', 'skipped', 'locked'];
const EMPHASIZED: DoseStatus[] = ['due', 'overdue', 'missed'];

/**
 * One scheduled dose on the home screen: time label above, stacked card below.
 * Three separate touch targets (open, check, menu) so none is nested inside another button.
 */
export function DoseCard({ name, subtitle, time, status, alertsEnabled, loggedAt, onOpen, onToggleTaken, onOpenMenu, testID }: Props) {
  const [down, setDown] = useState(false);
  const dimmed = DIMMED.includes(status);
  const tone = dimmed ? 'taken' : 'primary';
  const tag = statusLabel(status, loggedAt);
  const taken = status === 'taken';
  const spoken = spokenTime(time);

  return (
    <View testID={testID} style={{ gap: space[2] }}>
      {/* Its content is already part of the card's accessibility label. */}
      <View
        aria-hidden
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}
      >
        {alertsEnabled && <BellIcon />}
        <Text variant="title" accent bold={EMPHASIZED.includes(status)} tone={tone}>{formatTime(time)}</Text>
        {tag && <Text variant="label" accent tone={tone}>{tag}</Text>}
      </View>

      <StackedCard pressed={down} dimmed={dimmed} contentStyle={{ flexDirection: 'row', minHeight: 66 }}>
        <Pressable
          onPress={onOpen}
          onPressIn={() => setDown(true)}
          onPressOut={() => setDown(false)}
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${subtitle}, ${spoken}, ${statusPhrase(status, loggedAt)}`}
          accessibilityHint="Opens medication details"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space[3] }}
        >
          <Text variant="title" tone={tone} style={taken ? { textDecorationLine: 'line-through' } : undefined}>{name}</Text>
          <Text variant="subheading" tone={tone}>{subtitle}</Text>
        </Pressable>

        <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
          <Checkbox
            checked={taken}
            glyph={status === 'skipped' ? 'dash' : 'check'}
            dimmed={dimmed}
            disabled={status === 'locked'}
            onPress={onToggleTaken}
            accessibilityLabel={taken ? `Mark ${name} at ${spoken} as not taken` : `Mark ${name} at ${spoken} as taken`}
          />
        </View>

        {onOpenMenu && (
          <Pressable
            onPress={onOpenMenu}
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${name} at ${spoken}`}
            style={{ position: 'absolute', top: 0, left: 0, width: 44, height: 44, paddingTop: space[1], paddingLeft: space[2] }}
          >
            <Text variant="subheading" tone={tone}>···</Text>
          </Pressable>
        )}
      </StackedCard>
    </View>
  );
}
