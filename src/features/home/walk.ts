// Where the person walks. Positions are in house units: `x` across, `level` up (0 is the ground floor).
// A level between two whole numbers means somewhere on the stairs. Pure, so it can be tested.

export interface Spot {
  x: number;
  level: number;
}

/** The stairs rise from the bottom-left of each floor's stairwell to the top-right, into the floor above. */
export const STAIR_FOOT_X = 24;
export const STAIR_HEAD_X = 66;

/** Where the stairs are at a given height: their x moves from foot to head as the level rises. */
export const stairX = (level: number) => STAIR_FOOT_X + (level - Math.floor(level)) * (STAIR_HEAD_X - STAIR_FOOT_X);

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

/** Distance along a walk, with a floor of stairs counted as its slope length. Used for pacing. */
export function distance(a: Spot, b: Spot, floorHeight: number): number {
  return Math.hypot(b.x - a.x, (b.level - a.level) * floorHeight);
}
