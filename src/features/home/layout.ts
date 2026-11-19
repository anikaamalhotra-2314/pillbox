import { isOwned, type HomeState } from '@/domain/home';
import { FLOORS, ROOM_SIDES, ROOMS, type FloorEntry, type RoomEntry, type RoomSide } from '@/domain/home-catalog';
import { ROOM_HEIGHT, ROOM_WIDTH } from './art/rooms';
import type { Spot } from './walk';

// Scene units. Across each floor, left to right: outer wall, stairwell, wall with a doorway, the left room,
// wall with a doorway, the right room, then on the two lower floors another doorway and the far room, and an
// outer wall. The garden is outside, past the ground floor's outer wall.
export const SCENE_WIDTH = 868;
export const WALL = 4;
export const HOUSE_LEFT = 12;
export const STAIRWELL = { x: 16, width: 56 } as const;
export const ROOM_X: Record<RoomSide, number> = { left: 76, right: 362, far: 528, yard: 694 };
export const DOOR_HEIGHT = 76;

export const SKY = 70;
/** Ceiling strip, room, then the beam under it. */
export const CEILING = 4;
export const BEAM = 16;
export const FLOOR_HEIGHT = CEILING + ROOM_HEIGHT + BEAM;
export const GHOST_HEIGHT = 34;
export const ROOF_HEIGHT = 80;
/** Grass and a thin strip of soil under the house. Kept short so the house fills the screen. */
export const GROUND = 14;

export interface PlacedRoom {
  room: RoomEntry;
  level: number;
  x: number;
  y: number;
  width: number;
  owned: boolean;
}

export interface PlacedFloor {
  floor: FloorEntry;
  /** Top of its ceiling strip. */
  y: number;
  /** Outside edge of its right outer wall. */
  right: number;
  /** Inner walls, each with a doorway. */
  innerWalls: number[];
  /** A doorway in the right outer wall, out to the garden. */
  backDoor: boolean;
}

export interface HouseLayout {
  height: number;
  /** Floors built so far, top first. */
  floors: PlacedFloor[];
  rooms: PlacedRoom[];
  /** The next floor to build, drawn as a dashed outline on the roof. Undefined once the attic is built. */
  ghost?: { floor: FloorEntry; y: number; right: number };
  /** Top of the roof, when every floor is built. */
  roofY?: number;
  groundY: number;
  /** Where feet touch the floor on a level (fractional levels are on the stairs). */
  floorLine: (level: number) => number;
  /** How far right the person can walk on a level: to the outer wall, or into the garden through the back door. */
  walkRight: (level: number) => number;
}

/** The indoor sides a floor has, in order. */
const indoorSides = (floor: FloorEntry) => ROOM_SIDES.filter((side) => side !== 'yard' && ROOMS.some((r) => r.floor === floor.id && r.side === side));
const rightEdge = (floor: FloorEntry) => {
  const last = indoorSides(floor).at(-1)!;
  return ROOM_X[last] + ROOM_WIDTH[last] + WALL;
};

/** Where everything goes, from what is owned. Floors stack upward from the ground. */
export function layoutHouse(home: HomeState): HouseLayout {
  const built = FLOORS.filter((f) => isOwned(home, f.id));
  const next = FLOORS.find((f) => !isOwned(home, f.id));
  const gardenOwned = isOwned(home, 'garden');
  const topper = next ? GHOST_HEIGHT + 6 : ROOF_HEIGHT;
  const firstFloorY = SKY + topper;
  const floors = [...built].reverse().map((floor, i) => {
    const sides = indoorSides(floor);
    return {
      floor,
      y: firstFloorY + i * FLOOR_HEIGHT,
      right: rightEdge(floor),
      innerWalls: [STAIRWELL.x + STAIRWELL.width, ...sides.slice(0, -1).map((s) => ROOM_X[s] + ROOM_WIDTH[s])],
      backDoor: floor.level === 0 && gardenOwned,
    };
  });
  const groundY = firstFloorY + built.length * FLOOR_HEIGHT;
  const rooms = floors.flatMap(({ floor, y }) =>
    ROOMS.filter((r) => r.floor === floor.id).map((room) => ({
      room, level: floor.level, x: ROOM_X[room.side], y: y + CEILING, width: ROOM_WIDTH[room.side], owned: isOwned(home, room.id),
    })),
  );
  const rightOf = new Map(floors.map((f) => [f.floor.level, f.right]));
  return {
    height: groundY + GROUND,
    floors,
    rooms,
    ghost: next && { floor: next, y: firstFloorY - GHOST_HEIGHT - 2, right: rightEdge(next) },
    roofY: next ? undefined : SKY,
    groundY,
    floorLine: (level) => groundY - BEAM - level * FLOOR_HEIGHT,
    walkRight: (level) =>
      level === 0 && gardenOwned ? ROOM_X.yard + ROOM_WIDTH.yard - MARGIN : (rightOf.get(level) ?? ROOM_X.far) - WALL - MARGIN,
  };
}

/** Half the person's width, so they stop short of walls. */
const MARGIN = 14;

/**
 * Where a tap on a level should send the person: the same x, kept inside the walls. Rooms you don't own yet
 * are greyed but still built, so the person can walk through them to reach the next room. The garden is
 * only reachable once it's yours.
 */
export function walkTarget(layout: HouseLayout, level: number, x: number): Spot {
  return { level, x: Math.round(Math.min(layout.walkRight(level), Math.max(STAIRWELL.x + MARGIN - 4, x))) };
}

/** Somewhere to wander to, anywhere in the home: a random spot in a random room you own, on any floor. */
export function wanderAnywhere(layout: HouseLayout, random: () => number = Math.random): Spot {
  const rooms = layout.rooms.filter((r) => r.owned);
  const room = rooms[Math.floor(random() * rooms.length)];
  const [min, max] = [room.x + MARGIN + 6, room.x + room.width - MARGIN - 6];
  return walkTarget(layout, room.level, Math.round(min + random() * (max - min)));
}

/** The part of a floor the person may wander in on their own: the owned room they're standing in. */
export function wanderSpan(layout: HouseLayout, spot: Spot): [number, number] | undefined {
  if (!Number.isInteger(spot.level)) return undefined;
  const room = layout.rooms.find((r) => r.level === spot.level && r.owned && spot.x >= r.x && spot.x <= r.x + r.width);
  return room && [room.x + MARGIN + 6, room.x + room.width - MARGIN - 6];
}
