import { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

import { scene } from '@/design-system/tokens';
import { Block, Bob } from './primitives';

const ink = scene.ink;

/** Scale of the person in scene units. Their feet are 20 units below the waist before scaling. */
export const PERSON_SCALE = 1.6;
const FEET = 20 * PERSON_SCALE;

type PersonProps = {
  x: number;
  /** Where their feet touch the floor. */
  feetY: number;
  /** 1 faces right, -1 faces left. */
  facing?: 1 | -1;
  /** While walking, which foot is forward; the bob only plays while standing still. */
  walking?: boolean;
  stride?: 0 | 1;
};

/** You, in a cosy sweater. From the mockup, with a two-frame walk. */
export function Person({ x, feetY, facing = 1, walking = false, stride = 0 }: PersonProps) {
  const lift = (foot: 0 | 1) => (walking && stride === foot ? -1.2 : 0);
  const body = (
    <G transform={`translate(${x} ${feetY - FEET}) scale(${PERSON_SCALE * facing} ${PERSON_SCALE})`}>
      <Rect x={-5.5} y={9} width={11} height={8.5} fill={scene.peach} stroke={ink} strokeWidth={1} />
      <Line x1={0} y1={11} x2={0} y2={17.5} stroke={ink} strokeWidth={0.8} />
      <Ellipse cx={walking && stride === 0 ? -1.5 : -3} cy={18.6 + lift(0)} rx={3} ry={1.4} fill={ink} />
      <Ellipse cx={walking && stride === 1 ? 4.5 : 3} cy={18.6 + lift(1)} rx={3} ry={1.4} fill={ink} />
      <Rect x={-10} y={-4} width={4} height={11} rx={2} fill={scene.periwinkle} stroke={ink} strokeWidth={1} />
      <Rect x={6} y={-4} width={4} height={11} rx={2} fill={scene.periwinkle} stroke={ink} strokeWidth={1} />
      <Circle cx={-8} cy={8} r={1.6} fill={scene.skin} stroke={ink} strokeWidth={0.8} />
      <Circle cx={8} cy={8} r={1.6} fill={scene.skin} stroke={ink} strokeWidth={0.8} />
      <Rect x={-7.5} y={-5} width={15} height={15} rx={4} fill={scene.periwinkle} stroke={ink} strokeWidth={1} />
      <Line x1={-7} y1={7} x2={7} y2={7} stroke={scene.periwinkleDeep} strokeWidth={1} />
      <Rect x={-2} y={-6.5} width={4} height={2.5} fill={scene.skin} />
      <Circle cx={0} cy={-12} r={6.2} fill={scene.skin} stroke={ink} strokeWidth={1} />
      <Path
        d="M-6.4 -12.5 Q-6.8 -19.5 0 -19.2 Q6.8 -19.5 6.4 -12.5 Q4.5 -15.5 2 -14.6 Q0 -16.6 -2.4 -14.6 Q-4.6 -15.6 -6.4 -12.5 Z"
        fill={scene.hair} stroke={ink} strokeWidth={0.8} strokeLinejoin="round"
      />
      <Rect x={-3} y={-11.6} width={1.4} height={1.6} fill={ink} />
      <Rect x={1.6} y={-11.6} width={1.4} height={1.6} fill={ink} />
      <Rect x={-5} y={-9} width={2} height={1} fill={scene.blush} opacity={0.7} />
      <Rect x={3} y={-9} width={2} height={1} fill={scene.blush} opacity={0.7} />
      <Path d="M-1.2 -8.4 q1.2 1.1 2.4 0" fill="none" stroke={ink} strokeWidth={0.7} strokeLinecap="round" />
    </G>
  );
  return walking ? body : <Bob>{body}</Bob>;
}

// ── The cat ──
// A black cat with yellow eyes, a pink nose and a peach collar with a bell. Each pose is drawn around the point
// where it touches the ground (or the sofa), facing right; `facing` -1 mirrors it.

const catEye = scene.glow;
const catPink = scene.blush;
const whisker = scene.slate;

function Collar({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y} width={4.4} height={1.2} fill={scene.peach} />
      <Circle cx={x + 2.2} cy={y + 2} r={0.8} fill={scene.glow} stroke={ink} strokeWidth={0.3} />
    </>
  );
}

/** Two pointed ears with pink insides, for a head centred at (cx, cy) with radius r. */
function Ears({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <Polygon points={`${cx - r},${cy - r * 0.4} ${cx - r * 0.7},${cy - r * 1.6} ${cx - r * 0.1},${cy - r * 0.9}`} fill={ink} />
      <Polygon points={`${cx + r},${cy - r * 0.4} ${cx + r * 0.7},${cy - r * 1.6} ${cx + r * 0.1},${cy - r * 0.9}`} fill={ink} />
      <Polygon points={`${cx - r * 0.75},${cy - r * 0.6} ${cx - r * 0.65},${cy - r * 1.2} ${cx - r * 0.35},${cy - r * 0.85}`} fill={catPink} />
      <Polygon points={`${cx + r * 0.75},${cy - r * 0.6} ${cx + r * 0.65},${cy - r * 1.2} ${cx + r * 0.35},${cy - r * 0.85}`} fill={catPink} />
    </>
  );
}

/** Open eyes with slit pupils, a pink nose and whiskers, for a face centred at (cx, cy). */
function AwakeFace({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      {[-1.7, 1.7].map((dx) => (
        <G key={dx}>
          <Ellipse cx={cx + dx} cy={cy - 0.6} rx={1.2} ry={1.3} fill={catEye} />
          <Rect x={cx + dx - 0.2} y={cy - 1.6} width={0.45} height={2} fill={ink} />
        </G>
      ))}
      <Polygon points={`${cx - 0.6},${cy + 1.1} ${cx + 0.6},${cy + 1.1} ${cx},${cy + 1.8}`} fill={catPink} />
      {[-1, 1].map((side) => (
        <G key={side}>
          <Line x1={cx + side * 1.4} y1={cy + 1.6} x2={cx + side * 5.5} y2={cy + 0.8} stroke={whisker} strokeWidth={0.35} />
          <Line x1={cx + side * 1.4} y1={cy + 2} x2={cx + side * 5.5} y2={cy + 2.6} stroke={whisker} strokeWidth={0.35} />
        </G>
      ))}
    </>
  );
}

type CatProps = { x: number; y: number; facing?: 1 | -1 };

/** Curled up asleep: closed eyes, tail wrapped round, a little "z". */
export function SleepingCat({ x, y, facing = 1 }: CatProps) {
  return (
    <G transform={`translate(${x} ${y}) scale(${facing} 1)`}>
      <Ellipse cx={0} cy={-4} rx={9} ry={4} fill={ink} />
      <Path d="M-8 -2 Q-7 1.5 3 0.2" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
      <Ears cx={8} cy={-6} r={3.5} />
      <Circle cx={8} cy={-6} r={3.5} fill={ink} />
      <Path d="M5.6 -6.4 q0.7 0.6 1.4 0 M8.8 -6.4 q0.7 0.6 1.4 0" fill="none" stroke={whisker} strokeWidth={0.5} strokeLinecap="round" />
      <Polygon points="10.6,-4.6 11.6,-4.6 11.1,-4" fill={catPink} />
      <Collar x={4.6} y={-3.4} />
      <Polyline points="12,-13 14.5,-13 12,-10 14.5,-10" fill="none" stroke={whisker} strokeWidth={0.6} />
    </G>
  );
}

/** Sitting up, looking out, tail curled round its feet. */
export function SittingCat({ x, y, facing = 1 }: CatProps) {
  return (
    <G transform={`translate(${x} ${y}) scale(${facing} 1)`}>
      <Path d="M-3 -0.8 Q-10 0 -8.5 -6" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx={0} cy={-6} rx={5} ry={6} fill={ink} />
      <Rect x={1} y={-5} width={1.6} height={5} fill={ink} />
      <Rect x={3.4} y={-5} width={1.6} height={5} fill={ink} />
      <Ears cx={2} cy={-14} r={4.4} />
      <Circle cx={2} cy={-14} r={4.4} fill={ink} />
      <AwakeFace cx={2} cy={-14} />
      <Collar x={-0.2} y={-10.2} />
    </G>
  );
}

/** Mid-stride, tail up. `stride` swaps which legs are forward. */
export function WalkingCat({ x, y, facing = 1, stride = 0 }: CatProps & { stride?: 0 | 1 }) {
  const legs = stride ? [-6.5, -2.5, 4.5, 7.5] : [-5.5, -3.5, 3.5, 8];
  return (
    <G transform={`translate(${x} ${y}) scale(${facing} 1)`}>
      <Path d={stride ? 'M-8 -8 Q-14 -10 -13 -18' : 'M-8 -8 Q-13 -12 -11 -19'} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {legs.map((lx, i) => <Rect key={i} x={lx} y={-5} width={1.6} height={5} fill={ink} />)}
      <Ellipse cx={0} cy={-7} rx={9} ry={4} fill={ink} />
      <Ears cx={10} cy={-11} r={4.2} />
      <Circle cx={10} cy={-11} r={4.2} fill={ink} />
      <AwakeFace cx={10.6} cy={-11} />
      <Collar x={5.6} y={-9.4} />
    </G>
  );
}

/** Still packed: what the living room has until a few things are bought. */
export function MovingBoxes() {
  const tape = (x: number, y: number, h: number) => <Rect x={x} y={y} width={3} height={h} fill={scene.cardboardDeep} opacity={0.6} />;
  return (
    <>
      <Block x={38} y={164} w={26} h={24} fill={scene.cardboard} shade={scene.cardboardDeep} />
      {tape(49.5, 164, 24)}
      <Block x={62} y={170} w={22} h={18} fill={scene.cardboard} shade={scene.cardboardDeep} />
      {tape(71.5, 170, 18)}
      <Block x={44} y={150} w={18} h={14} fill={scene.cardboard} shade={scene.cardboardDeep} />
      {tape(51.5, 150, 14)}
    </>
  );
}
