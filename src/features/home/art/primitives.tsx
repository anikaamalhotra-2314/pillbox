import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Ellipse, G, Line, Polygon, Rect } from 'react-native-svg';

import { scene, type TimeOfDay } from '@/design-system/tokens';

export type Look = (typeof scene.time)[TimeOfDay];

/** What every drawing gets. `thumb` is true in the shop, where light cones and moving parts are left out. */
export interface ArtContext {
  look: Look;
  thumb: boolean;
}

const ink = scene.ink;

/**
 * The house's signature shape, same as the app's stacked cards: a deeper copy offset down-right,
 * then the face on top, both outlined.
 */
export function Block({ x, y, w, h, fill, shade, stroke = 1 }: { x: number; y: number; w: number; h: number; fill: string; shade?: string; stroke?: number }) {
  return (
    <>
      {shade && <Rect x={x + 2} y={y + 2} width={w} height={h} fill={shade} stroke={ink} strokeWidth={stroke} />}
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={ink} strokeWidth={stroke} />
    </>
  );
}

export function Ink({ x1, y1, x2, y2, w = 1, color = ink, opacity }: { x1: number; y1: number; x2: number; y2: number; w?: number; color?: string; opacity?: number }) {
  return <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} opacity={opacity} />;
}

export function Leaf({ cx, cy, rx, ry, light }: { cx: number; cy: number; rx: number; ry: number; light?: boolean }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={light ? scene.leafLight : scene.leaf} stroke={ink} strokeWidth={1} />;
}

// ── Animation ────────────────────────────────────────────────────────────────────────────────────
// One shared, stepped clock (like pixel-art sprites) rather than smooth tweens. Only the small pieces that
// read it re-render on each tick. When it isn't running (reduce motion, tab hidden) every piece holds still.

const FrameContext = createContext(0);
const TICK_MS = 600;

export function FrameClock({ running, children }: { running: boolean; children: ReactNode }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setFrame((f) => f + 1), TICK_MS);
    return () => clearInterval(id);
  }, [running]);
  return <FrameContext.Provider value={running ? frame : 0}>{children}</FrameContext.Provider>;
}

const useFrame = () => useContext(FrameContext);

/** A star or fairy light that dims every third beat, offset by `phase` so they don't blink together. */
export function Twinkle({ x, y, size = 1.5, color = scene.white, phase = 0, opacity = 1 }: { x: number; y: number; size?: number; color?: string; phase?: number; opacity?: number }) {
  const dim = (useFrame() + phase) % 3 === 0;
  return <Rect x={x} y={y} width={size} height={size} fill={color} opacity={opacity * (dim ? 0.35 : 1)} />;
}

/** A gentle one-unit bob, for the person. */
export function Bob({ children }: { children: ReactNode }) {
  const up = useFrame() % 2 === 1;
  return <G transform={`translate(0 ${up ? -0.8 : 0})`}>{children}</G>;
}

/** Two wisps of steam rising from (x, y). */
export function Steam({ x, y, thumb }: { x: number; y: number; thumb: boolean }) {
  const f = useFrame() % 3;
  if (thumb) return null;
  return (
    <>
      <Rect x={x} y={y - f * 2} width={1} height={4} fill={scene.white} opacity={0.9 - f * 0.3} />
      <Rect x={x + 2} y={y - 2 - ((f + 1) % 3) * 2} width={1} height={4} fill={scene.white} opacity={0.9 - ((f + 1) % 3) * 0.3} />
    </>
  );
}

/** A cone of lamp light. Only visible when the part of the day calls for it. */
export function LightCone({ points, look, thumb }: { points: string; look: Look; thumb: boolean }) {
  const strong = useFrame() % 4 < 2;
  if (thumb || look.glow === 0) return null;
  return <Polygon points={points} fill={scene.glow} opacity={look.glow * (strong ? 1 : 0.75)} />;
}

/**
 * A flat pixel oval of shade on the floor, centred on `cx` with its middle on `y` (where the piece's feet are).
 * Drawn before the piece, so the piece covers its top half. Whole-unit rows keep it crisp, like the pixel art.
 */
export function GroundShadow({ cx, y, w, h }: { cx: number; y: number; w: number; h: number }) {
  const rows = Array.from({ length: h }, (_, i) => {
    const t = (i + 0.5 - h / 2) / (h / 2);
    return Math.round((w / 2) * Math.sqrt(1 - t * t));
  });
  const top = Math.round(y - h / 2);
  return (
    <G opacity={scene.groundShadow.opacity}>
      {rows.map((half, i) => <Rect key={i} x={Math.round(cx) - half} y={top + i} width={half * 2} height={1} fill={scene.groundShadow.color} />)}
    </G>
  );
}

/** A color part way from `from` to `to` (0 is `from`, 1 is `to`), for deriving shades of a paint. */
export function mixColor(from: string, to: string, t: number): string {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = rgb(to);
  return `#${rgb(from).map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
