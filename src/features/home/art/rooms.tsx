import { Fragment, useMemo, type ReactElement } from 'react';
import { Circle, Line, Polygon, Rect } from 'react-native-svg';

import { scene } from '@/design-system/tokens';
import type { RoomDecor } from '@/domain/home';
import type { FloorStyle, RoomId } from '@/domain/home-catalog';
import { PixelSprite, type Sprite } from '@/design-system/icons/PixelArt';
import { Ink, mixColor, Twinkle, type ArtContext, type Look } from './primitives';
import { livingRoom } from './sprites/living-room';
import { roomNarrow } from './sprites/room-narrow';
import { kitchenCounter } from './sprites/kitchen-counter';
import { kitchenTiles } from './sprites/kitchen-tiles';
import { windowFrame } from './sprites/window-frame';
import { windowSquare } from './sprites/window-square';

// Room-local units: the wall runs from y 0 to 150, the floor from 150 to 190. A left room is 282 wide,
// the others 162. The house places each room; nothing here knows where it ends up.
export const ROOM_HEIGHT = 190;
export const WALL_HEIGHT = 150;
export const ROOM_WIDTH = { left: 282, right: 162, far: 162, yard: 162 } as const;
/** In the living room drawing the wall stops above the baseboard at y 139, and the planks start at 145. */
const LIVING_WALL_HEIGHT = 139;

/** Where a room's wall ends, above the baseboard: the lowest that something hung on it can go. */
/**
 * Rooms drawn in the living room's style: the owner's wall, baseboard and floorboards (the kitchen and the
 * wood-floored rooms).
 * Their floor is part of the drawing, so it can't be swapped; their wall can still be painted.
 */
const LIVING_STYLE: readonly RoomId[] = ['living', 'kitchen', 'dining', 'bedroom', 'office', 'studio'];
export const inLivingStyle = (id: RoomId) => LIVING_STYLE.includes(id);

export const wallBottom = (id: RoomId) => (inLivingStyle(id) ? LIVING_WALL_HEIGHT : WALL_HEIGHT - BASEBOARD);

/** Where a room's floor starts: the highest that a standing piece's feet can go. */
export const floorTop = (id: RoomId) => (inLivingStyle(id) ? 145 : WALL_HEIGHT);

/** The floor each room comes with. */
export const DEFAULT_FLOOR: Record<RoomId, FloorStyle> = {
  living: 'honey', kitchen: 'blue-tile', dining: 'walnut', garden: 'honey',
  bedroom: 'honey', bathroom: 'blue-tile', office: 'honey', studio: 'honey', greenhouse: 'blue-tile',
};

const ink = scene.ink;
const range = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/** Planks run across the room in rows this tall, each row's joints shifted so they never line up. */
const PLANK = 8;
const PLANK_LENGTH = 46;
const BASEBOARD = 4;

/** Horizontal wood planks: row seams, staggered butt joints, and every few boards a shade darker. */
function Planks({ w, line }: { w: number; line: string }) {
  const rows = range(WALL_HEIGHT, ROOM_HEIGHT - 1, PLANK);
  return (
    <>
      {rows.flatMap((y, row) => {
        const shift = (row * 17) % PLANK_LENGTH;
        const joints = range(shift - PLANK_LENGTH, w, PLANK_LENGTH);
        return joints.map((x, i) => {
          const left = Math.max(0, x);
          const right = Math.min(w, x + PLANK_LENGTH);
          if (right <= left) return null;
          return (
            <Fragment key={`${y}-${x}`}>
              {(row + i) % 3 === 0 && <Rect x={left} y={y} width={right - left} height={PLANK} fill={line} opacity={0.18} />}
              {x > 0 && <Ink x1={x} y1={y} x2={x} y2={y + PLANK} w={0.6} color={line} />}
            </Fragment>
          );
        });
      })}
      {rows.slice(1).map((y) => <Ink key={`r${y}`} x1={0} y1={y} x2={w} y2={y} w={0.6} color={line} />)}
    </>
  );
}

/** A floor in any of the styles (wood planks, tiles or a checkerboard), with a baseboard along the foot of the wall. */
export function Floor({ w, style }: { w: number; style: FloorStyle }) {
  const f = scene.floors[style];
  return (
    <>
      <Rect x={0} y={WALL_HEIGHT} width={w} height={ROOM_HEIGHT - WALL_HEIGHT} fill={f.fill} />
      {f.pattern === 'boards' && <Planks w={w} line={f.line} />}
      {f.pattern === 'tiles' && (
        <>
          {range(8, w - 1, 14).map((x) => <Ink key={x} x1={x} y1={WALL_HEIGHT} x2={x} y2={ROOM_HEIGHT} w={0.6} color={f.line} />)}
          <Ink x1={0} y1={170} x2={w} y2={170} w={0.6} color={f.line} />
        </>
      )}
      {f.pattern === 'checker' && range(0, w - 1, 10).flatMap((x, i) => range(WALL_HEIGHT, ROOM_HEIGHT - 1, 10).map((y, j) => (
        (i + j) % 2 ? <Rect key={`${x}-${y}`} x={x} y={y} width={Math.min(10, w - x)} height={10} fill={f.alt} /> : null
      )))}
      <Rect x={0} y={WALL_HEIGHT - BASEBOARD} width={w} height={BASEBOARD} fill={f.base} />
      <Ink x1={0} y1={WALL_HEIGHT - BASEBOARD} x2={w} y2={WALL_HEIGHT - BASEBOARD} w={0.6} />
      <Ink x1={0} y1={WALL_HEIGHT} x2={w} y2={WALL_HEIGHT} w={0.8} />
    </>
  );
}

/** The back wall: the time of day's color, or the chosen paint (dimmed a touch at night). */
function Wall({ w, color, painted, look }: { w: number; color: string; painted: boolean } & Pick<ArtContext, 'look'>) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={WALL_HEIGHT} fill={color} />
      {painted && look.stars > 0 && <Rect x={0} y={0} width={w} height={WALL_HEIGHT} fill={scene.nightVeil.color} opacity={scene.nightVeil.opacity} />}
    </>
  );
}

function RoundWindow({ cx, cy, r, look }: { cx: number; cy: number; r: number } & ArtContext) {
  return (
    <>
      <Circle cx={cx + 2} cy={cy + 2} r={r} fill={scene.slate} stroke={ink} strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={r} fill={look.sky} stroke={ink} strokeWidth={1} />
      <Ink x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
      <Ink x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
    </>
  );
}

type ShellProps = ArtContext & { wall: string; painted: boolean; floor: FloorStyle };

/**
 * The living room drawing's wall: its color, and the two shades of it toward the ceiling, by the baseboard and
 * behind the windows, each with how far it was mixed toward the ground-shadow color. Paint replaces all three.
 * These are the drawing's own colors (see assets/home/items/living-room.png), so they're matched by value: the
 * generator can hand out different letters each time it runs.
 */
const LIVING_WALL_COLOR = '#d9c0b4';
const LIVING_WALL = { [LIVING_WALL_COLOR]: 0, '#cbb2a6': 0.08, '#bda499': 0.16 } as Record<string, number>;

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (from: string, to: string, t: number) => {
  const b = toRgb(to);
  return `#${toRgb(from).map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

/**
 * A drawing in the living room's style (the room itself, or the stairwell beside it), with its wall in `wall`
 * when painted: the wall's color and both its shades are swapped, and it's dimmed a touch at night.
 */
export function LivingBackdrop({ sprite, x, y, wall, look }: { sprite: Sprite; x: number; y: number; wall?: string; look: Look }) {
  const shown = useMemo(() => {
    if (!wall) return sprite;
    const paint = Object.fromEntries(Object.entries(sprite.paint).map(([ch, hex]) => {
      const t = LIVING_WALL[hex];
      return [ch, t === undefined ? hex : mix(wall, scene.groundShadow.color, t)];
    }));
    return { ...sprite, paint };
  }, [sprite, wall]);
  const width = sprite.rows[0]?.length ?? 0;
  return (
    <>
      <PixelSprite sprite={shown} x={x} y={y} />
      {wall && look.stars > 0 && <Rect x={x} y={y} width={width} height={LIVING_WALL_HEIGHT} fill={scene.nightVeil.color} opacity={scene.nightVeil.opacity} />}
    </>
  );
}

/** The paint on a room's wall, if any, as a color. The stairwell beside a floor's left room is painted to match. */
export const wallPaintOf = (decor: RoomDecor | undefined) => (decor?.wall ? scene.wallPaints[decor.wall] : undefined);

/** Where the kitchen's window is, so things that go with it (the herbs, the café curtains) can line up. */
export const KITCHEN_WINDOW = { x: 14, y: 30 } as const;
/** The top of the kitchen counter (and stove), which stands back against the wall. */
export const KITCHEN_COUNTER_TOP = 113;

/** A window that comes with a room: the owner's window (or its shorter square version), with its shadow on the wall. */
function BuiltInWindow({ x, y, sprite = windowFrame, look, thumb }: { x: number; y: number; sprite?: Sprite } & ArtContext) {
  const w = sprite.rows[0].length;
  const h = sprite.rows.length;
  return (
    <>
      <Rect x={x + 3} y={y + 2} width={w - 1} height={h} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />
      <WindowView sprite={sprite} x={x} y={y} look={look} thumb={thumb} />
    </>
  );
}

/** The sky and clouds as drawn in the owner's windows, which the time of day's sky replaces. */
const DRAWN_SKY = { base: '#b6d6ee', shade: '#a5bed3', glint: '#d7e8f6', cloud: '#ffffff', cloudShade: '#eeeceb' };

/**
 * One of the owner's windows, showing the sky as it is now: the time of day's color (shaded under the frame, with
 * glints on the glass), the clouds dimmed in the evening, and stars twinkling through the panes at night.
 */
export function WindowView({ sprite, x, y, look, thumb }: { sprite: Sprite; x: number; y: number } & ArtContext) {
  const shown = useMemo(() => {
    const night = look.stars > 0;
    const swap: Record<string, string> = {
      [DRAWN_SKY.base]: look.sky,
      [DRAWN_SKY.shade]: mixColor(look.sky, scene.groundShadow.color, 0.12),
      [DRAWN_SKY.glint]: mixColor(look.sky, scene.white, night ? 0.15 : 0.45),
      [DRAWN_SKY.cloud]: night ? mixColor(DRAWN_SKY.cloud, look.sky, 0.6) : DRAWN_SKY.cloud,
      [DRAWN_SKY.cloudShade]: night ? mixColor(DRAWN_SKY.cloudShade, look.sky, 0.7) : DRAWN_SKY.cloudShade,
    };
    return { rows: sprite.rows, paint: Object.fromEntries(Object.entries(sprite.paint).map(([ch, hex]) => [ch, swap[hex] ?? hex])) };
  }, [sprite, look.sky, look.stars]);
  const w = sprite.rows[0].length;
  return (
    <>
      <PixelSprite sprite={shown} x={x} y={y} />
      {!thumb && look.stars > 0 && (
        <>
          <Twinkle x={x + Math.round(w * 0.25)} y={y + 9} size={1.2} phase={1} />
          <Twinkle x={x + Math.round(w * 0.72)} y={y + 16} size={1.2} phase={2} />
        </>
      )}
    </>
  );
}

/** The owner's own drawing. Its wall takes the chosen paint, shading and all; the sky and floor are fixed. */
function Living({ wall, painted, look }: ShellProps) {
  return <LivingBackdrop sprite={livingRoom} x={0} y={0} wall={painted ? wall : undefined} look={look} />;
}

function Kitchen({ wall, painted, look, thumb }: ShellProps) {
  return (
    <>
      <LivingBackdrop sprite={roomNarrow} x={0} y={0} wall={painted ? wall : undefined} look={look} />
      {/* Tiles all the way across, from just under the window down to the baseboard, which runs on along the bottom */}
      <PixelSprite sprite={kitchenTiles} x={0} y={81} />
      <BuiltInWindow x={KITCHEN_WINDOW.x} y={KITCHEN_WINDOW.y} sprite={windowSquare} look={look} thumb={thumb} />
      {/* The counter comes with the kitchen: two teak cabinets and a stove, back against the wall */}
      <PixelSprite sprite={kitchenCounter} x={8} y={KITCHEN_COUNTER_TOP} />
    </>
  );
}

function Bedroom({ wall, painted, look, thumb }: ShellProps) {
  return (
    <>
      <LivingBackdrop sprite={livingRoom} x={0} y={0} wall={painted ? wall : undefined} look={look} />
      <BuiltInWindow x={226} y={30} look={look} thumb={thumb} />
    </>
  );
}

function Bathroom({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.right;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      <Rect x={0} y={84} width={w} height={66} fill={scene.white} />
      {range(0, w, 10).map((x) => <Ink key={`v${x}`} x1={x} y1={84} x2={x} y2={WALL_HEIGHT} w={0.5} color={scene.periwinkleDeep} />)}
      {range(84, WALL_HEIGHT, 10).map((y) => <Ink key={`h${y}`} x1={0} y1={y} x2={w} y2={y} w={0.5} color={scene.periwinkleDeep} />)}
      <Ink x1={0} y1={84} x2={w} y2={84} />
      <Floor w={w} style={floor} />
      <RoundWindow cx={124} cy={40} r={13} {...ctx} />
    </>
  );
}

function Studio({ wall, painted, look, thumb }: ShellProps) {
  return (
    <>
      <LivingBackdrop sprite={livingRoom} x={0} y={0} wall={painted ? wall : undefined} look={look} />
      <BuiltInWindow x={117} y={20} look={look} thumb={thumb} />
    </>
  );
}

function Greenhouse({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.right;
  return (
    <>
      {/* Glass walls: the sky shows through, or the paint does if one is chosen. */}
      <Rect x={0} y={0} width={w} height={WALL_HEIGHT} fill={painted ? wall : ctx.look.sky} />
      <Rect x={0} y={0} width={w} height={WALL_HEIGHT} fill={scene.glass} opacity={0.55} />
      {range(0, w, 27).map((x) => <Ink key={`v${x}`} x1={x} y1={0} x2={x} y2={WALL_HEIGHT} color={scene.white} w={1.4} />)}
      {range(0, WALL_HEIGHT, 30).map((y) => <Ink key={`h${y}`} x1={0} y1={y} x2={w} y2={y} color={scene.white} w={1.4} />)}
      <Floor w={w} style={floor} />
    </>
  );
}

function Dining({ wall, painted, look, thumb }: ShellProps) {
  return (
    <>
      <LivingBackdrop sprite={roomNarrow} x={0} y={0} wall={painted ? wall : undefined} look={look} />
      <BuiltInWindow x={98} y={26} look={look} thumb={thumb} />
    </>
  );
}

function Office({ wall, painted, look, thumb }: ShellProps) {
  return (
    <>
      <LivingBackdrop sprite={roomNarrow} x={0} y={0} wall={painted ? wall : undefined} look={look} />
      <BuiltInWindow x={104} y={34} look={look} thumb={thumb} />
    </>
  );
}

/** Outside: open sky (drawn by the house), a picket fence along the back, grass, and soil down to the ground. */
function Garden() {
  const w = ROOM_WIDTH.yard;
  return (
    <>
      <Ink x1={0} y1={128} x2={w} y2={128} w={2} color={scene.white} />
      <Ink x1={0} y1={142} x2={w} y2={142} w={2} color={scene.white} />
      {range(4, w - 6, 12).map((x) => (
        <Polygon key={x} points={`${x},150 ${x},122 ${x + 3},118 ${x + 6},122 ${x + 6},150`} fill={scene.white} stroke={ink} strokeWidth={0.8} />
      ))}
      <Rect x={0} y={WALL_HEIGHT} width={w} height={ROOM_HEIGHT - WALL_HEIGHT} fill={scene.leaf} />
      {range(5, w - 3, 9).map((x, i) => (
        <Line key={x} x1={x} y1={160 + (i % 3) * 9} x2={x + 2} y2={156 + (i % 3) * 9} stroke={scene.stem} strokeWidth={1} />
      ))}
      <Ink x1={0} y1={WALL_HEIGHT} x2={w} y2={WALL_HEIGHT} w={0.8} />
      {/* Soil under the grass, level with the beam under the house */}
      <Rect x={0} y={ROOM_HEIGHT} width={w} height={16} fill={scene.soil.body} />
    </>
  );
}

const SHELLS: Record<RoomId, (props: ShellProps) => ReactElement> = {
  living: Living, kitchen: Kitchen, dining: Dining, garden: Garden,
  bedroom: Bedroom, bathroom: Bathroom, office: Office, studio: Studio, greenhouse: Greenhouse,
};

/** Left rooms use the main wall color, right rooms the alternate, as in the mockup; the far rooms the main again. */
const MAIN_WALL: RoomId[] = ['living', 'dining', 'bedroom', 'office', 'studio'];

/** The wall color a room comes with, before any paint. The living room's is the owner's drawing's own. */
export const defaultWall = (id: RoomId, look: ArtContext['look']) =>
  inLivingStyle(id) ? LIVING_WALL_COLOR : MAIN_WALL.includes(id) ? look.wall : look.wallAlt;

/** Rooms whose floor is part of a drawing, so it can't be swapped for another style. */
export const hasFloorChoice = (id: RoomId) => !inLivingStyle(id);

/** The room itself: walls, floor, windows and anything that comes built in. Furniture goes on top. */
export function RoomShell({ id, decor, ...ctx }: { id: RoomId; decor?: RoomDecor } & ArtContext) {
  const Shell = SHELLS[id];
  const wall = decor?.wall ? scene.wallPaints[decor.wall] : defaultWall(id, ctx.look);
  return <Shell {...ctx} wall={wall} painted={Boolean(decor?.wall)} floor={decor?.floor ?? DEFAULT_FLOOR[id]} />;
}
