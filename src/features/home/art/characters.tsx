import { useMemo } from 'react';
import { G, Rect } from 'react-native-svg';

import { PixelSprite, type Sprite } from '@/design-system/icons/PixelArt';
import { scene } from '@/design-system/tokens';
import { DEFAULT_AVATAR, type Avatar } from '@/domain/avatar';
import { Block, Bob } from './primitives';
import { catSit, catSleep, catWalkA, catWalkB } from './sprites/cat';
import { PERSON_FRAMES } from './sprites/person-frames';


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

/** The colors each role in the person's drawing takes, for how they've chosen to look. */
export function avatarPaint(avatar: Avatar): Record<string, string> {
  const a = scene.avatar;
  const [s, S] = a.skin[avatar.skin];
  const [h, H, j] = a.hair[avatar.hair];
  const [t, T, u] = a.top[avatar.top];
  const [b, B] = a.bottom[avatar.bottom];
  return { o: a.outline, e: a.eyes, m: a.mouth, w: a.socks, f: a.shoes[0], F: a.shoes[1], s, S, h, H, j, t, T, u, b, B };
}

/**
 * You, in the owner's pixel style (after their reference): a chibi with a bob, a T-shirt and shorts, 26 by 50
 * units, in the colors chosen for skin, hair, top and bottoms. A standing frame and two walking frames, drawn
 * facing right with the feet at `feetY` and mirrored to face left.
 */
export function Person({ x, feetY, facing = 1, walking = false, stride = 0, avatar = DEFAULT_AVATAR }: PersonProps & { avatar?: Avatar }) {
  const paint = useMemo(() => avatarPaint(avatar), [avatar]);
  const rows = PERSON_FRAMES[walking ? (stride === 0 ? 'a' : 'b') : 'stand'];
  const sprite = useMemo(() => ({ rows, paint }), [rows, paint]);
  const body = (
    <G transform={`translate(${x} ${feetY}) scale(${facing} 1)`}>
      <PixelSprite sprite={sprite} x={-13} y={-49} />
    </G>
  );
  return walking ? body : <Bob>{body}</Bob>;
}

// ── The cat ──
// A black cat with yellow eyes, a pink nose and a peach collar with a bell, in the owner's pixel style. Each pose is
// drawn around the point where it touches the ground (or the sofa), facing right; `facing` -1 mirrors it.

type CatProps = { x: number; y: number; facing?: 1 | -1 };

function CatPose({ sprite, x, y, facing = 1 }: CatProps & { sprite: Sprite }) {
  const w = sprite.rows[0].length;
  return (
    <G transform={`translate(${x} ${y}) scale(${facing} 1)`}>
      <PixelSprite sprite={sprite} x={-Math.round(w / 2)} y={-sprite.rows.length} />
    </G>
  );
}

export function SleepingCat(props: CatProps) {
  return <CatPose {...props} sprite={catSleep} />;
}

export function SittingCat(props: CatProps) {
  return <CatPose {...props} sprite={catSit} />;
}

export function WalkingCat({ stride = 0, ...props }: CatProps & { stride?: 0 | 1 }) {
  return <CatPose {...props} sprite={stride ? catWalkB : catWalkA} />;
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
