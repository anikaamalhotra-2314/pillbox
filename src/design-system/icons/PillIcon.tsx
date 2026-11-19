import { useMemo } from 'react';

import { color as ui, pillColors, palette } from '@/design-system/tokens';
import type { PillIcon as PillIconValue } from '@/domain/pill-icon';
import { PixelArt } from './PixelArt';
import { pillBitmaps } from './pill-shapes';

type Props = { icon: PillIconValue; size?: number };

/**
 * A pixel-art pill. Use a size that is a multiple of 16 (32, 48, 64, 80) so the edges stay crisp.
 * Decorative: the medication's name and the picker's labels carry the meaning.
 */
export function PillIcon({ icon, size = 48 }: Props) {
  const paint = useMemo(() => {
    const { fill, shade } = pillColors[icon.color];
    return { '#': ui.border.strong, o: fill, d: shade, x: shade, h: palette.cream };
  }, [icon.color]);

  return <PixelArt rows={pillBitmaps[icon.shape]} paint={paint} size={size} />;
}
