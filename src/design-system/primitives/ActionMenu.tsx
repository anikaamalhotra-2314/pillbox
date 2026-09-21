import { Modal, View } from 'react-native';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';

export type MenuAction = { label: string; onPress: () => void };

type Props = { visible: boolean; title: string; actions: MenuAction[]; onClose: () => void };

const line = { borderTopWidth: borderWidth.default, borderTopColor: color.border.strong } as const;

/** A short list of actions in a dialog. The last row always closes it. */
export function ActionMenu({ visible, title, actions, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: color.overlay.scrim, alignItems: 'center', justifyContent: 'center', padding: space[5] }}>
        <View
          accessibilityViewIsModal
          aria-modal
          style={{ width: '100%', maxWidth: 340, backgroundColor: color.surface.page, borderWidth: borderWidth.default, borderColor: color.border.strong }}
        >
          <View style={{ padding: space[4] }}>
            <Text variant="title" accessibilityRole="header">{title}</Text>
          </View>
          {[...actions, { label: 'Cancel', onPress: onClose }].map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              accessibilityRole="button"
              style={[line, { minHeight: 48, justifyContent: 'center', paddingHorizontal: space[4] }]}
            >
              <Text variant="title" accent>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
