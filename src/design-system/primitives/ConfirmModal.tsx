import { Modal, View } from 'react-native';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const box = { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: borderWidth.default, borderColor: color.border.strong } as const;

/** Confirms something that cannot be undone. Cancel comes first, so it is what keyboard focus lands on. */
export function ConfirmModal({ visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: color.overlay.scrim, alignItems: 'center', justifyContent: 'center', padding: space[5] }}>
        <View
          accessibilityViewIsModal
          aria-modal
          role="alertdialog"
          style={{ width: '100%', maxWidth: 340, gap: space[4], padding: space[5], backgroundColor: color.surface.page, borderWidth: borderWidth.default, borderColor: color.border.strong }}
        >
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <Text variant="subheading">{message}</Text>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <Pressable onPress={onCancel} accessibilityRole="button" style={box}>
              <Text variant="title">{cancelLabel}</Text>
            </Pressable>
            {/* Inverted so the destructive choice reads differently without relying on color. */}
            <Pressable onPress={onConfirm} accessibilityRole="button" style={[box, { backgroundColor: color.border.strong }]}>
              <Text variant="title" style={{ color: color.surface.page }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
