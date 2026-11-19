import { useEffect, useState } from 'react';
import { Modal, TextInput, View } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, fontFamily, fontSize, space } from '@/design-system/tokens';
import type { LocalTime } from '@/domain/dates';
import { from12h, parseHour12, parseMinute, to12h } from '@/domain/time';
import { Pressable } from '@/design-system/primitives/Pressable';

type Props = {
  visible: boolean;
  /** The time being edited. Omit to add a new one. */
  initial?: LocalTime;
  onCancel: () => void;
  onConfirm: (time: LocalTime) => void;
  /** Return a message to block a time (for example a duplicate). */
  validate?: (time: LocalTime) => string | undefined;
};

const pad = (n: number) => String(n).padStart(2, '0');
const rule = { borderWidth: borderWidth.default, borderColor: color.border.strong } as const;
// A fixed width: on web an <input> keeps a wide intrinsic width and would push AM/PM off screen.
const input = { width: 64, minHeight: 48, textAlign: 'center', color: color.text.primary, fontFamily: fontFamily.regular, fontSize: fontSize.heading, ...rule } as const;

/** Type the hour and minute, pick AM or PM. Typed input keeps every minute reachable and works with a keyboard. */
export function TimeModal({ visible, initial, onCancel, onConfirm, validate }: Props) {
  const [hour, setHour] = useState('8');
  const [minute, setMinute] = useState('00');
  const [pm, setPm] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible) return;
    const t = initial ? to12h(initial) : { hour: 8, minute: 0, pm: false };
    setHour(String(t.hour));
    setMinute(pad(t.minute));
    setPm(t.pm);
    setError(undefined);
  }, [visible, initial]);

  const confirm = () => {
    const h = parseHour12(hour);
    const m = parseMinute(minute);
    if (h === null) return setError('Hour must be 1 to 12.');
    if (m === null) return setError('Minutes must be 0 to 59.');
    const time = from12h({ hour: h, minute: m, pm });
    const problem = validate?.(time);
    if (problem) return setError(problem);
    onConfirm(time);
  };

  const headerButton = { width: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center' } as const;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: color.overlay.scrim, alignItems: 'center', justifyContent: 'center', padding: space[5] }}>
        <View accessibilityViewIsModal aria-modal style={{ width: '100%', maxWidth: 340, backgroundColor: color.surface.page, ...rule }}>
          <View style={{ flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: borderWidth.default, borderBottomColor: color.border.strong }}>
            <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel" style={[headerButton, { borderRightWidth: borderWidth.default, borderRightColor: color.border.strong }]}>
              <Text variant="title">✕</Text>
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="title" accessibilityRole="header">Select Time</Text>
            </View>
            <Pressable onPress={confirm} accessibilityRole="button" accessibilityLabel="Save time" style={[headerButton, { borderLeftWidth: borderWidth.default, borderLeftColor: color.border.strong }]}>
              <Text variant="title">✓</Text>
            </Pressable>
          </View>

          <View style={{ padding: space[5], gap: space[3], alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
              <TextInput value={hour} onChangeText={(v) => { setHour(v); setError(undefined); }} keyboardType="number-pad" maxLength={2} selectTextOnFocus autoFocus accessibilityLabel="Hour" style={input} />
              <Text variant="heading">:</Text>
              <TextInput value={minute} onChangeText={(v) => { setMinute(v); setError(undefined); }} keyboardType="number-pad" maxLength={2} selectTextOnFocus accessibilityLabel="Minutes" style={input} />
              <View role="radiogroup" aria-label="AM or PM" style={{ flexDirection: 'row', marginLeft: space[2] }}>
                {(['AM', 'PM'] as const).map((half) => {
                  const on = (half === 'PM') === pm;
                  return (
                    <Pressable
                      key={half}
                      onPress={() => { setPm(half === 'PM'); setError(undefined); }}
                      accessibilityRole="radio"
                      accessibilityLabel={half}
                      aria-checked={on}
                      style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? color.surface.selected : 'transparent', borderWidth: on ? 2 : borderWidth.default, borderColor: color.border.strong }}
                    >
                      <Text variant="title">{half}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {error && <Text variant="subheading" role="alert">{error}</Text>}
          </View>
        </View>
      </View>
    </Modal>
  );
}
