import { distance, planWalk, STAIR_CENTER_X, STAIR_FOOT_X, STAIR_HEAD_X, STAIR_RADIUS, STAIR_TURNS, stairX } from '../walk';

describe('planWalk', () => {
  it('walks straight across a floor, through the doorways', () => {
    expect(planWalk({ x: 100, level: 0 }, { x: 400, level: 0 })).toEqual([{ x: 400, level: 0 }]);
  });
  it('goes up one floor by the stairs', () => {
    expect(planWalk({ x: 200, level: 0 }, { x: 300, level: 1 })).toEqual([
      { x: STAIR_FOOT_X, level: 0 }, { x: STAIR_HEAD_X, level: 1 }, { x: 300, level: 1 },
    ]);
  });
  it('goes down two floors, one flight at a time', () => {
    expect(planWalk({ x: 300, level: 2 }, { x: 100, level: 0 })).toEqual([
      // The spiral's head and foot are the same spot, so it goes straight on down the next flight.
      { x: STAIR_HEAD_X, level: 2 }, { x: STAIR_FOOT_X, level: 1 }, { x: STAIR_FOOT_X, level: 0 }, { x: 100, level: 0 },
    ]);
  });
  it('finishes the flight it is on, toward the destination', () => {
    const halfway = { x: stairX(0.5), level: 0.5 };
    expect(planWalk(halfway, { x: 200, level: 1 })).toEqual([{ x: STAIR_HEAD_X, level: 1 }, { x: 200, level: 1 }]);
    expect(planWalk(halfway, { x: 200, level: 0 })).toEqual([{ x: STAIR_FOOT_X, level: 0 }, { x: 200, level: 0 }]);
  });
  it('skips corners it is already at, and returns nothing when already there', () => {
    expect(planWalk({ x: STAIR_FOOT_X, level: 0 }, { x: 200, level: 1 })).toEqual([{ x: STAIR_HEAD_X, level: 1 }, { x: 200, level: 1 }]);
    expect(planWalk({ x: 100, level: 1 }, { x: 100, level: 1 })).toEqual([]);
  });
});

describe('stairs', () => {
  it('goes round the pole as the level rises, getting on and off at the same spot', () => {
    expect(stairX(1)).toBeCloseTo(STAIR_FOOT_X);
    expect(stairX(1.25)).toBeCloseTo(STAIR_CENTER_X + STAIR_RADIUS);
    expect(stairX(1.5)).toBeCloseTo(STAIR_FOOT_X);
    expect(STAIR_HEAD_X).toBe(STAIR_FOOT_X);
  });
  it('measures a floor of stairs along the spiral, and a level walk straight', () => {
    const round = 2 * Math.PI * STAIR_RADIUS * STAIR_TURNS;
    expect(distance({ x: 0, level: 0 }, { x: 0, level: 1 }, 40)).toBeCloseTo(Math.hypot(round, 40));
    expect(distance({ x: 0, level: 0 }, { x: 30, level: 0 }, 40)).toBe(30);
  });
});
