import { View } from 'react-native';

import { borderWidth, color } from '@/design-system/tokens';

// PLACEHOLDER. The Figma has a pixel-art bell; swap this for the exported artwork.
export function BellIcon({ size = 12 }: { size?: number }) {
  return (
    <View
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color.surface.action,
        borderWidth: borderWidth.default,
        borderColor: color.border.strong,
      }}
    />
  );
}
