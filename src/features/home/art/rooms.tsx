import type { ReactElement } from 'react';
import { Circle, Ellipse, Line, Polygon, Rect } from 'react-native-svg';

import { pillColors, scene } from '@/design-system/tokens';
import type { RoomDecor } from '@/domain/home';
import type { FloorStyle, RoomId } from '@/domain/home-catalog';
import { Block, Ink, Twinkle, type ArtContext } from './primitives';

// Room-local units: the wall runs from y 0 to 150, the floor from 150 to 190. A left room is 282 wide,
// the others 162. The house places each room; nothing here knows where it ends up.
export const ROOM_HEIGHT = 190;
export const WALL_HEIGHT = 150;
export const ROOM_WIDTH = { left: 282, right: 162, far: 162, yard: 162 } as const;

/** The floor each room comes with. */
export const DEFAULT_FLOOR: Record<RoomId, FloorStyle> = {
  living: 'honey', kitchen: 'blue-tile', dining: 'walnut', garden: 'honey',
  bedroom: 'honey', bathroom: 'blue-tile', office: 'honey', studio: 'honey', greenhouse: 'blue-tile',
};

const ink = scene.ink;
const range = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/** A floor in any of the styles: boards, tiles (boards plus a seam across), or a checkerboard. */
export function Floor({ w, style }: { w: number; style: FloorStyle }) {
  const f = scene.floors[style];
  if (f.pattern === 'checker') {
    const size = 10;
    return (
      <>
        <Rect x={0} y={WALL_HEIGHT} width={w} height={ROOM_HEIGHT - WALL_HEIGHT} fill={f.fill} />
        {range(0, w - 1, size).flatMap((x, i) => range(WALL_HEIGHT, ROOM_HEIGHT - 1, size).map((y, j) => (
          (i + j) % 2 ? <Rect key={`${x}-${y}`} x={x} y={y} width={Math.min(size, w - x)} height={size} fill={f.alt} /> : null
        )))}
        <Ink x1={0} y1={WALL_HEIGHT} x2={w} y2={WALL_HEIGHT} w={0.8} />
      </>
    );
  }
  return (
    <>
      <Rect x={0} y={WALL_HEIGHT} width={w} height={ROOM_HEIGHT - WALL_HEIGHT} fill={f.fill} />
      {range(8, w - 1, 14).map((x) => <Ink key={x} x1={x} y1={WALL_HEIGHT} x2={x} y2={ROOM_HEIGHT} w={0.6} color={f.line} />)}
      {f.pattern === 'tiles' && <Ink x1={0} y1={170} x2={w} y2={170} w={0.6} color={f.line} />}
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

/** A square window onto the sky, with stars at night. */
function Window({ x, y, w, h, look, thumb }: { x: number; y: number; w: number; h: number } & ArtContext) {
  return (
    <>
      <Block x={x} y={y} w={w} h={h} fill={look.sky} shade={scene.slate} />
      <Ink x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} />
      <Ink x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} />
      {!thumb && look.stars > 0 && (
        <>
          <Twinkle x={x + 7} y={y + 7} size={1.4} phase={1} />
          <Twinkle x={x + w - 12} y={y + h - 10} size={1.4} phase={2} />
        </>
      )}
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

function Living({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.left;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      <Ink x1={0} y1={40} x2={w} y2={40} color={scene.peachDeep} />
      <Floor w={w} style={floor} />
      <Window x={24} y={24} w={58} h={70} {...ctx} />
      <Ellipse cx={70} cy={36} rx={4} ry={4} fill={ctx.look.moon} />
      {/* Radiator under the sill */}
      <Rect x={28} y={102} width={52} height={4} fill={scene.peach} stroke={ink} strokeWidth={1} />
      <Block x={30} y={112} w={46} h={22} fill={scene.periwinkle} shade={scene.periwinkleDeep} />
      {range(34, 74, 5).map((x) => <Ink key={x} x1={x} y1={114} x2={x} y2={132} color={scene.periwinkleDeep} />)}
    </>
  );
}

function Kitchen({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.right;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      {/* Tiled splashback */}
      <Rect x={6} y={100} width={104} height={36} fill={scene.white} />
      {range(6, 110, 8).map((x) => <Ink key={`v${x}`} x1={x} y1={100} x2={x} y2={136} w={0.5} color={scene.periwinkleDeep} />)}
      {range(100, 136, 8).map((y) => <Ink key={`h${y}`} x1={6} y1={y} x2={110} y2={y} w={0.5} color={scene.periwinkleDeep} />)}
      <Floor w={w} style={floor} />
      <Window x={18} y={30} w={40} h={40} {...ctx} />
      {/* The counter comes with the kitchen */}
      <Block x={8} y={142} w={100} h={46} fill={scene.peach} shade={scene.peachDeep} />
      <Block x={6} y={136} w={104} h={6} fill={scene.periwinkle} shade={scene.periwinkleDeep} />
      <Ink x1={41} y1={142} x2={41} y2={188} color={scene.peachDeep} />
      <Ink x1={75} y1={142} x2={75} y2={188} color={scene.peachDeep} />
      {[22, 56, 90].map((x) => <Rect key={x} x={x} y={152} width={5} height={1.4} fill={ink} />)}
    </>
  );
}

function Bedroom({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.left;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      {/* Dotted wallpaper */}
      {range(14, w - 10, 24).flatMap((x) => range(14, 130, 24).map((y) => (
        <Rect key={`${x}-${y}`} x={x + ((y / 24) % 2) * 12} y={y} width={2} height={2} fill={scene.peachDeep} opacity={0.5} />
      )))}
      <Floor w={w} style={floor} />
      <Window x={160} y={30} w={44} h={50} {...ctx} />
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

function Studio({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.left;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      {/* The roof slopes in at both ends */}
      <Polygon points={`0,0 64,0 0,54`} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />
      <Polygon points={`${w},0 ${w - 64},0 ${w},54`} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />
      <Line x1={0} y1={30} x2={36} y2={0} stroke={scene.brick} strokeWidth={0.8} />
      <Line x1={w} y1={30} x2={w - 36} y2={0} stroke={scene.brick} strokeWidth={0.8} />
      <Floor w={w} style={floor} />
      <RoundWindow cx={141} cy={42} r={18} {...ctx} />
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

function Dining({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.far;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      {/* Panelled wainscot */}
      <Rect x={0} y={108} width={w} height={42} fill={scene.peach} />
      <Ink x1={0} y1={108} x2={w} y2={108} />
      {range(12, w - 12, 30).map((x) => <Rect key={x} x={x} y={114} width={22} height={30} fill="none" stroke={scene.peachDeep} strokeWidth={0.8} />)}
      <Floor w={w} style={floor} />
      <Window x={100} y={26} w={44} h={44} {...ctx} />
    </>
  );
}

function Office({ wall, painted, floor, ...ctx }: ShellProps) {
  const w = ROOM_WIDTH.far;
  return (
    <>
      <Wall w={w} color={wall} painted={painted} look={ctx.look} />
      <Ink x1={0} y1={30} x2={w} y2={30} color={scene.periwinkleDeep} />
      <Floor w={w} style={floor} />
      <Window x={110} y={40} w={40} h={46} {...ctx} />
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
      <Rect x={0} y={ROOM_HEIGHT} width={w} height={16} fill={scene.peachDeep} />
    </>
  );
}

const SHELLS: Record<RoomId, (props: ShellProps) => ReactElement> = {
  living: Living, kitchen: Kitchen, dining: Dining, garden: Garden,
  bedroom: Bedroom, bathroom: Bathroom, office: Office, studio: Studio, greenhouse: Greenhouse,
};

/** Left rooms use the main wall color, right rooms the alternate, as in the mockup; the far rooms the main again. */
const MAIN_WALL: RoomId[] = ['living', 'dining', 'bedroom', 'office', 'studio'];

/** The wall color a room comes with, before any paint. */
export const defaultWall = (id: RoomId, look: ArtContext['look']) => (MAIN_WALL.includes(id) ? look.wall : look.wallAlt);

/** The room itself: walls, floor, windows and anything that comes built in. Furniture goes on top. */
export function RoomShell({ id, decor, ...ctx }: { id: RoomId; decor?: RoomDecor } & ArtContext) {
  const Shell = SHELLS[id];
  const wall = decor?.wall ? pillColors[decor.wall].fill : defaultWall(id, ctx.look);
  return <Shell {...ctx} wall={wall} painted={Boolean(decor?.wall)} floor={decor?.floor ?? DEFAULT_FLOOR[id]} />;
}
