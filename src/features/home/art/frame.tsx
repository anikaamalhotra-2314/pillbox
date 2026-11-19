import { Fragment } from 'react';
import { Rect } from 'react-native-svg';

import { scene } from '@/design-system/tokens';

// The house's frame and the ground, in the owner's pixel style: whole-unit rows and columns, lit from above, with a
// one-pixel outline, like their living room drawing. Patterns come from fixed arithmetic, so they never flicker.

const t = scene.timber;

/** A horizontal timber: outline top and bottom, a lit top edge, shade underneath. Joints every `joint` units. */
export function PixelBeam({ x, y, w, h, joint }: { x: number; y: number; w: number; h: number; joint?: { first: number; every: number } }) {
  const rows: string[] =
    h <= 3 ? [t.outline, t.body, t.outline].slice(0, h)
    : h === 4 ? [t.outline, t.light, t.dark, t.outline]
    : [t.outline, t.light, ...Array<string>(h - 5).fill(t.body), t.dark, t.dark, t.outline];
  const grain = h >= 8
    ? Array.from({ length: Math.floor(w / 13) }, (_, i) => ({ gx: x + ((i * 37) % w), gy: y + 3 + ((i * 5) % (h - 6)), len: 3 + ((i * 7) % 6) }))
    : [];
  const joints = joint ? Array.from({ length: Math.max(0, Math.floor((x + w - joint.first) / joint.every) + 1) }, (_, i) => joint.first + i * joint.every).filter((j) => j > x && j < x + w - 1) : [];
  return (
    <>
      {rows.map((fill, i) => <Rect key={i} x={x} y={y + i} width={w} height={1} fill={fill} />)}
      {grain.map(({ gx, gy, len }, i) => <Rect key={`g${i}`} x={gx} y={gy} width={Math.min(len, x + w - gx)} height={1} fill={t.grain} />)}
      {joints.map((j) => (
        <Fragment key={`j${j}`}>
          <Rect x={j} y={y + 1} width={1} height={h - 2} fill={t.seam} />
          <Rect x={j + 1} y={y + 1} width={1} height={h - 2} fill={t.light} />
        </Fragment>
      ))}
    </>
  );
}

/** An upright timber, seen end-on: outline either side, lit on the left, shaded on the right. */
export function PixelPost({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cols = w <= 4 ? [t.outline, t.light, t.dark, t.outline] : [t.outline, t.light, ...Array<string>(w - 4).fill(t.body), t.dark, t.outline];
  return <>{cols.slice(0, w).map((fill, i) => <Rect key={i} x={x + i} y={y} width={1} height={h} fill={fill} />)}</>;
}

/** Grass along the top of `y`, with tufts poking up, then soil below, darker just under the grass, with pebbles. */
export function PixelGround({ y, w, depth = 200 }: { y: number; w: number; depth?: number }) {
  const g = scene.grass;
  const s = scene.soil;
  const tufts = Array.from({ length: Math.floor(w / 5) }, (_, i) => i * 5 + ((i * 3) % 4)).filter((tx) => tx < w);
  const pebbles = Array.from({ length: Math.floor(w / 9) }, (_, i) => ({ px: (i * 9 + ((i * 5) % 7)) % w, py: y + 9 + ((i * 7) % Math.max(1, depth - 12)) }));
  return (
    <>
      {/* Soil: a dark band under the grass, a dithered edge, then the body */}
      <Rect x={0} y={y + 6} width={w} height={depth} fill={s.body} />
      <Rect x={0} y={y + 6} width={w} height={2} fill={s.dark} />
      {Array.from({ length: Math.ceil(w / 2) }, (_, i) => <Rect key={`d${i}`} x={i * 2 + 1} y={y + 8} width={1} height={1} fill={s.dark} />)}
      {pebbles.map(({ px, py }, i) => (
        <Fragment key={`p${i}`}>
          <Rect x={px} y={py} width={2} height={1} fill={i % 3 === 0 ? s.pebble : s.light} />
          <Rect x={px} y={py + 1} width={2} height={1} fill={s.dark} />
        </Fragment>
      ))}
      {/* Grass: a lit top row, the body flecked lighter, and shade where it meets the soil */}
      <Rect x={0} y={y} width={w} height={6} fill={g.body} />
      <Rect x={0} y={y} width={w} height={1} fill={g.light} />
      <Rect x={0} y={y + 4} width={w} height={2} fill={g.dark} />
      {Array.from({ length: Math.floor(w / 4) }, (_, i) => <Rect key={`f${i}`} x={i * 4 + (i % 2) * 2} y={y + 2} width={1} height={1} fill={g.light} />)}
      {tufts.map((tx, i) => (
        <Fragment key={`t${tx}`}>
          <Rect x={tx} y={y - 1} width={1} height={1} fill={g.body} />
          {i % 3 === 0 && <Rect x={tx + 1} y={y - 2} width={1} height={2} fill={g.tip} />}
        </Fragment>
      ))}
    </>
  );
}
