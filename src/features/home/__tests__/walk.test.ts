import { distance, planWalk, STAIR_FOOT_X, STAIR_HEAD_X, stairX } from '../walk';

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
      { x: STAIR_HEAD_X, level: 2 }, { x: STAIR_FOOT_X, level: 1 }, { x: STAIR_HEAD_X, level: 1 }, { x: STAIR_FOOT_X, level: 0 }, { x: 100, level: 0 },
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
  it('runs from foot to head as the level rises', () => {
    expect(stairX(1)).toBe(STAIR_FOOT_X);
    expect(stairX(1.5)).toBe((STAIR_FOOT_X + STAIR_HEAD_X) / 2);
  });
  it('measures a flight along its slope', () => {
    expect(distance({ x: 0, level: 0 }, { x: 30, level: 1 }, 40)).toBe(50);
  });
});
