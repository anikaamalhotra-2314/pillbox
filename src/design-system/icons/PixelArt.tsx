import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';

/** A grid of single-character cells; '.' is transparent. Each other character takes its color from `paint`. */
export interface Sprite {
  rows: readonly string[];
  paint: Readonly<Record<string, string>>;
}

type Props = Sprite & {
  size: number;
};

type Run = { key: string; x: number; y: number; w: number; h: number; fill: string };

/**
 * Cells merged into rectangles: a row's cells into runs, then a run into the one above it when it spans the same
 * cells in the same color, so a solid area is one rectangle.
 */
function toRuns({ rows, paint }: Sprite): Run[] {
  const out: Run[] = [];
  // Runs that reached the row above, by their start, end and color, so a matching run below can extend them.
  let open = new Map<string, Run>();
  rows.forEach((row, y) => {
    const next = new Map<string, Run>();
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x;
      while (end + 1 < row.length && row[end + 1] === ch) end++;
      if (ch !== '.') {
        const id = `${x}-${end}-${ch}`;
        let run = open.get(id);
        if (run) run.h++;
        else out.push((run = { key: `${y}-${x}`, x, y, w: end - x + 1, h: 1, fill: paint[ch] }));
        next.set(id, run);
      }
      x = end + 1;
    }
    open = next;
  });
  return out;
}

/**
 * At fractional scales the browser and iOS soften each rectangle's edges, and where two meet the background shows
 * through as a faint line. So the runs are drawn twice: first each one stretched a cell right and down into
 * whatever is drawn there, then exactly. A softened edge on top then blends with a neighbour's color, never the
 * background. Stretching only into filled cells keeps the outline where it was.
 */
function Runs({ rows, paint }: Sprite) {
  const { runs, backing } = useMemo(() => {
    const filled = (x: number, y: number) => (rows[y]?.[x] ?? '.') !== '.';
    const runs = toRuns({ rows, paint });
    const backing = runs.map((r) => {
      let right = true;
      for (let y = r.y; y < r.y + r.h && right; y++) right = filled(r.x + r.w, y);
      let down = true;
      for (let x = r.x; x < r.x + r.w && down; x++) down = filled(x, r.y + r.h);
      return { ...r, w: r.w + (right ? 1 : 0), h: r.h + (down ? 1 : 0) };
    });
    return { runs, backing };
  }, [rows, paint]);

  return (
    <>
      {backing.map((r) => <Rect key={`b${r.key}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />)}
      {runs.map((r) => <Rect key={r.key} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />)}
    </>
  );
}

/**
 * Pixel art from a square character grid. Use a size that is a multiple of the grid so every cell lands on whole
 * device pixels and the edges stay crisp. Decorative: hidden from screen readers.
 */
export function PixelArt({ rows, paint, size }: Props) {
  return (
    <View aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${rows.length} ${rows.length}`}>
        <Runs rows={rows} paint={paint} />
      </Svg>
    </View>
  );
}

/** A sprite inside an existing drawing, its top-left cell at (x, y), one cell per unit. */
export function PixelSprite({ sprite, x, y }: { sprite: Sprite; x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Runs rows={sprite.rows} paint={sprite.paint} />
    </G>
  );
}
