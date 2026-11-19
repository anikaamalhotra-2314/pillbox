// Where the person walks. Positions are in house units: `x` across, `level` up (0 is the ground floor).
// A level between two whole numbers means somewhere on the stairs. Pure, so it can be tested.

export interface Spot {
  x: number;
  level: number;
}

/**
 * The stairs are a spiral round a pole in the middle of the stairwell, turning twice per floor. You step on at the
 * left of the pole and step off at the left on the floor above. `STAIR_RADIUS` is where you stand on a tread.
 */
export const STAIR_CENTER_X = 44;
export const STAIR_RADIUS = 14;
export const STAIR_TURNS = 2;

/** Which way round the spiral you are at a fraction `f` of the way up a floor, in radians: 0 is straight ahead. */
export const stairAngle = (f: number) => -Math.PI / 2 + f * 2 * Math.PI * STAIR_TURNS;

/** Where you are across the stairwell at a given height: going round the pole as the level rises. */
export const stairX = (level: number) => STAIR_CENTER_X + STAIR_RADIUS * Math.sin(stairAngle(level - Math.floor(level)));

/** Where you get on and off: the same spot, at the left of the pole, on each floor. */
export const STAIR_FOOT_X = STAIR_CENTER_X - STAIR_RADIUS;
export const STAIR_HEAD_X = STAIR_FOOT_X;

/**
 * The corners of a walk from `from` to `to`, not including `from`. On the same floor it is a straight walk
 * (doorways are open); otherwise it goes to the stairs, climbs or descends one floor at a time, then walks over.
 * A walk that starts on the stairs first finishes the flight in whichever direction the destination lies.
 */
export function planWalk(from: Spot, to: Spot): Spot[] {
  const path: Spot[] = [];
  let level = from.level;
  if (!Number.isInteger(level)) {
    level = to.level > level ? Math.ceil(level) : Math.floor(level);
    path.push({ x: level > from.level ? STAIR_HEAD_X : STAIR_FOOT_X, level });
  }
  while (level < to.level) {
    path.push({ x: STAIR_FOOT_X, level }, { x: STAIR_HEAD_X, level: level + 1 });
    level++;
  }
  while (level > to.level) {
    path.push({ x: STAIR_HEAD_X, level }, { x: STAIR_FOOT_X, level: level - 1 });
    level--;
  }
  path.push(to);
  // Drop corners that don't move anywhere (already at the stairs, or the destination is the stairs).
  return path.filter((p, i) => {
    const prev = i === 0 ? from : path[i - 1];
    return p.x !== prev.x || p.level !== prev.level;
  });
}

/** Distance along a walk, with a floor of stairs counted along the spiral (round and up). Used for pacing. */
export function distance(a: Spot, b: Spot, floorHeight: number): number {
  const climb = Math.abs(b.level - a.level);
  if (!climb) return Math.abs(b.x - a.x);
  return Math.abs(b.x - a.x) + Math.hypot(climb * 2 * Math.PI * STAIR_RADIUS * STAIR_TURNS, climb * floorHeight);
}
