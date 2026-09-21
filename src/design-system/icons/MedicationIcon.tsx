import { View } from 'react-native';

import { borderWidth, color } from '@/design-system/tokens';

// PLACEHOLDER. The Figma has a pixel-art pill icon (and a picker for others); swap in the exported art.
export function MedicationIcon({ size = 72 }: { size?: number }) {
  return (
    <View
      aria-hidden
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: color.surface.selected, borderWidth: 2, borderColor: color.border.strong,
      }}
    >
      <View style={{ width: size * 0.72, height: borderWidth.default * 2, backgroundColor: color.border.strong, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}
