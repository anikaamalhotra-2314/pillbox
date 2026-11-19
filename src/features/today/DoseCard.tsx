import { useState } from 'react';
import { View } from 'react-native';

import { BellIcon } from '@/design-system/icons/BellIcon';
import { Checkbox } from '@/design-system/primitives/Checkbox';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { space } from '@/design-system/tokens';
import type { LocalTime } from '@/domain/dates';
import { formatTime, localTimeOf, spokenTime, statusLabel, statusPhrase } from '@/domain/format';
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
  /** Coins this dose earned for being taken on time. Shown beside the status as "+5 coins". */
  coins?: number;
  /** ISO timestamp the reminder was snoozed to. Shown beside the status as "snoozed 10:55am". */
  snoozedUntil?: string;
  /** Without it, the card is plain information (for example on the details screen itself). */
  onOpen?: () => void;
  onToggleTaken: () => void;
  /** When given, shows the "..." button that opens the dose actions (skip, snooze, edit). */
  onOpenMenu?: () => void;
  testID?: string;
};

const DIMMED: DoseStatus[] = ['taken', 'skipped', 'locked'];

/**
 * One scheduled dose on the home screen: time label above, stacked card below.
 * Three separate touch targets (open, check, menu) so none is nested inside another button.
 */
export function DoseCard({ name, subtitle, time, status, alertsEnabled, loggedAt, coins, snoozedUntil, onOpen, onToggleTaken, onOpenMenu, testID }: Props) {
  const [down, setDown] = useState(false);
  const dimmed = DIMMED.includes(status);
  const tone = dimmed ? 'taken' : 'primary';
  const snoozedTo = snoozedUntil && localTimeOf(snoozedUntil);
  const tag = statusLabel(status, loggedAt);
  const taken = status === 'taken';
  const spoken = spokenTime(time);
  const snoozePhrase = snoozedTo ? `, reminder snoozed until ${spokenTime(snoozedTo)}` : '';
  const coinPhrase = coins ? `, earned ${coins} coins` : '';
  const label = `${name}, ${subtitle}, ${spoken}, ${statusPhrase(status, loggedAt)}${coinPhrase}${snoozePhrase}`;
  const text = (
    <>
      <Text variant="title" tone={tone} style={taken ? { textDecorationLine: 'line-through' } : undefined}>{name}</Text>
      <Text variant="subheading" tone={tone}>{subtitle}</Text>
    </>
  );
  const textBox = { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space[3] } as const;

  return (
    <View testID={testID} style={{ gap: space[2] }}>
      {/* When the card is a button, its label already includes this row. */}
      <View
        aria-hidden={Boolean(onOpen)}
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space[2] }}
      >
        {alertsEnabled && <BellIcon />}
        <Text variant="title" tone={tone}>{formatTime(time)}</Text>
        {tag && <Text variant="label" accent tone={tone}>{tag}</Text>}
        {coins ? <Text variant="label" accent tone={tone}>{`+${coins} coins`}</Text> : null}
        {/* Its own piece, so on a narrow screen it moves to the next line whole instead of breaking mid-phrase. */}
        {snoozedTo && <Text variant="label" accent tone={tone}>{`snoozed ${formatTime(snoozedTo)}`}</Text>}
      </View>

      <StackedCard pressed={down} dimmed={dimmed} contentStyle={{ flexDirection: 'row', minHeight: 66 }}>
        {onOpen ? (
          <Pressable
            onPress={onOpen}
            onPressIn={() => setDown(true)}
            onPressOut={() => setDown(false)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Opens medication details"
            style={textBox}
          >
            {text}
          </Pressable>
        ) : (
          <View style={textBox}>{text}</View>
        )}

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
