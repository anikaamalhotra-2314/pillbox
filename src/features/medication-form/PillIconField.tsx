import { useState } from 'react';
import { Modal, View } from 'react-native';

import { PillIcon } from '@/design-system/icons/PillIcon';
import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { PILL_COLORS, PILL_SHAPES, pillIconName, type PillIcon as PillIconValue } from '@/domain/pill-icon';

type Props = { value: PillIconValue; onChange: (icon: PillIconValue) => void };

/** The "Medication Icon" field: shows the current icon, and opens the picker. */
export function PillIconField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="label" accent>Medication Icon</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Medication icon: ${pillIconName(value)}. Change`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], alignSelf: 'flex-start', padding: space[2], borderWidth: borderWidth.default, borderColor: color.border.strong }}
      >
        <PillIcon icon={value} size={48} />
        <Text variant="subheading" accent>Change</Text>
      </Pressable>
      <PillIconPicker visible={open} value={value} onChange={onChange} onClose={() => setOpen(false)} />
    </View>
  );
}

const OPTION = 44; // a 44pt touch target
const line = { borderColor: color.border.strong } as const;

function Option({ icon, label, selected, onPress }: { icon: PillIconValue; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      aria-checked={selected}
      // A heavier ring marks the choice, so it never depends on color (decision 0009).
      style={[line, { width: OPTION, height: OPTION, alignItems: 'center', justifyContent: 'center', borderWidth: selected ? 2 : 0 }]}
    >
      <PillIcon icon={icon} size={32} />
    </Pressable>
  );
}

/** Pick a shape and a color; the preview and its spoken name update as you go. */
function PillIconPicker({ visible, value, onChange, onClose }: Props & { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: color.overlay.scrim, alignItems: 'center', justifyContent: 'center', padding: space[5] }}>
        <View
          accessibilityViewIsModal
          aria-modal
          style={[line, { width: '100%', maxWidth: 340, gap: space[4], padding: space[5], backgroundColor: color.surface.page, borderWidth: borderWidth.default }]}
        >
          <Text variant="title" accessibilityRole="header">Choose an icon</Text>

          <View style={{ alignItems: 'center', gap: space[2] }}>
            <PillIcon icon={value} size={80} />
            {/* A status region, so a screen reader announces the new name after each choice. */}
            <Text variant="subheading" accent role="status">{pillIconName(value)}</Text>
          </View>

          <View style={{ gap: space[2] }}>
            <Text variant="label" accent>Shape</Text>
            <View role="radiogroup" aria-label="Shape" style={{ flexDirection: 'row', gap: space[1] }}>
              {PILL_SHAPES.map((s) => (
                <Option key={s.id} icon={{ shape: s.id, color: value.color }} label={s.name} selected={s.id === value.shape} onPress={() => onChange({ ...value, shape: s.id })} />
              ))}
            </View>
          </View>

          <View style={{ gap: space[2] }}>
            <Text variant="label" accent>Color</Text>
            <View role="radiogroup" aria-label="Color" style={{ flexDirection: 'row', gap: space[1] }}>
              {PILL_COLORS.map((c) => (
                <Option key={c.id} icon={{ shape: value.shape, color: c.id }} label={c.name} selected={c.id === value.color} onPress={() => onChange({ ...value, color: c.id })} />
              ))}
            </View>
          </View>

          <Pressable onPress={onClose} accessibilityRole="button" style={[line, { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: borderWidth.default }]}>
            <Text variant="title">Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
