import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { color as ui, pillColors, palette } from '@/design-system/tokens';
import type { PillIcon as PillIconValue } from '@/domain/pill-icon';
import { GRID, pillBitmaps } from './pill-shapes';

type Props = { icon: PillIconValue; size?: number };

// Each run overlaps its neighbours by a hair, so fractional display scales (browser zoom, some monitors)
// don't leave light seams between pixel rows. Later runs paint over earlier ones, so nothing visibly bleeds.
const OVERLAP = 0.05;

/**
 * A pixel-art pill. Use a size that is a multiple of 16 (32, 48, 64, 80) so every grid cell lands on whole
 * device pixels and the edges stay crisp.
 * Decorative: it is hidden from screen readers, and the medication's name and the
 * picker's labels carry the meaning. Rows are merged into runs so a pill is a few dozen rectangles, not 256.
 */
export function PillIcon({ icon, size = 48 }: Props) {
  const rects = useMemo(() => {
    const { fill, shade } = pillColors[icon.color];
    const paint: Record<string, string> = { '#': ui.border.strong, o: fill, d: shade, x: shade, h: palette.cream };
    const out: { key: string; x: number; y: number; w: number; fill: string }[] = [];
    pillBitmaps[icon.shape].forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let end = x;
        while (end + 1 < row.length && row[end + 1] === ch) end++;
        if (ch !== '.') out.push({ key: `${y}-${x}`, x, y, w: end - x + 1, fill: paint[ch] });
        x = end + 1;
      }
    });
    return out;
  }, [icon.shape, icon.color]);

  return (
    <View aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${GRID} ${GRID}`}>
        {rects.map((r) => (
          <Rect key={r.key} x={r.x} y={r.y} width={r.w + OVERLAP} height={1 + OVERLAP} fill={r.fill} />
        ))}
      </Svg>
    </View>
  );
}
