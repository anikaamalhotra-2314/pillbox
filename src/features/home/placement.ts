import { isOwned, isPlaced, type HomeState } from '@/domain/home';
import { catalogEntry, itemsIn, ROOMS, type ItemId, type RoomId } from '@/domain/home-catalog';
import { ITEM_ART } from './art/items';
import { ROOM_X, STAIRWELL } from './layout';
import { floorTop, ROOM_HEIGHT, ROOM_WIDTH, wallBottom, WALL_HEIGHT } from './art/rooms';

const owner = (home: HomeState) => (id: ItemId) => isOwned(home, id);

export type Offset = { dx: number; dy: number };
/** One piece's position while it's being dragged, before it's saved. */
export type Draft = { id: ItemId } & Offset;

/** The piece this one sits on, if any (the duck on the tub, the cat on the sofa). */
export function parentOf(home: HomeState, id: ItemId): ItemId | undefined {
  return ITEM_ART[id].attachedTo?.(owner(home));
}

/** How far a piece has been moved, following whatever it sits on. `draft` overrides one piece while it's being dragged. */
export function offsetOf(home: HomeState, id: ItemId, draft?: Draft): Offset {
  const parent = parentOf(home, id);
  if (parent) return offsetOf(home, parent, draft);
  if (draft?.id === id) return { dx: draft.dx, dy: draft.dy };
  const decor = home.decor.items[id];
  return { dx: decor?.dx ?? 0, dy: decor?.dy ?? 0 };
}

const roomOf = (id: ItemId): RoomId => {
  const entry = catalogEntry(id);
  if (entry.kind !== 'item') throw new Error(`${id} is not furniture`);
  return entry.room;
};

/** Where a piece's feet are as it comes: the bottom of its box. */
const feet = (id: ItemId) => ITEM_ART[id].box[1] + ITEM_ART[id].box[3];

/** Stands on the floor, so it can go forward and back as well as sideways. Things on the wall or the ceiling only slide. */
export const standsOnFloor = (id: ItemId) => !ITEM_ART[id].hangs && feet(id) > WALL_HEIGHT;

/** Can go up and down as well as sideways: anything standing on the floor, and anything hung freely on the wall. */
export const movesUpAndDown = (id: ItemId) => standsOnFloor(id) || Boolean(ITEM_ART[id].hangs);

/**
 * Where a room's furniture can go from, in room units. The living room takes in the stairwell beside it (which is
 * drawn in the same style), so furniture can sit right up by the staircase; other rooms start at their own edge.
 */
export const roomStart = (room: RoomId) => (room === 'living' ? STAIRWELL.x - ROOM_X.left : 0);

/** How far a piece can move each way and stay inside its room: standing pieces on the floor, hung ones on the wall. */
export function moveRange(id: ItemId): { dx: { min: number; max: number }; dy: { min: number; max: number } } {
  const room = roomOf(id);
  const width = ROOM_WIDTH[ROOMS.find((r) => r.id === room)!.side];
  const [x, y, w] = ITEM_ART[id].box;
  // Fixed pieces stay where they come (they can still be repainted or put away).
  if (ITEM_ART[id].fixed) return { dx: { min: 0, max: 0 }, dy: { min: 0, max: 0 } };
  // Never so tight that where it came from is out of range (some pieces are drawn a little past the edge).
  const dy = standsOnFloor(id)
    ? { min: Math.min(0, Math.max(floorTop(room) - feet(id), -y)), max: Math.max(0, ROOM_HEIGHT - feet(id)) }
    : ITEM_ART[id].hangs
      ? { min: Math.min(0, -y), max: Math.max(0, wallBottom(room) - feet(id)) }
      : { min: 0, max: 0 };
  return { dx: { min: roomStart(room) - x, max: width - (x + w) }, dy };
}

const clamp = (v: number, { min, max }: { min: number; max: number }) => Math.round(Math.min(max, Math.max(min, v)));

export function clampMove(id: ItemId, { dx, dy }: Offset): Offset {
  const range = moveRange(id);
  return { dx: clamp(dx, range.dx), dy: clamp(dy, range.dy) };
}

/** In the room: placed, and if it sits on something, that's placed too (curtains go away with their window). */
function inRoom(home: HomeState, id: ItemId): boolean {
  const parent = parentOf(home, id);
  return isPlaced(home, id) && (!parent || inRoom(home, parent));
}

/**
 * Furniture you own and haven't put away in a room, back to front. Not the cat, which goes where it likes. Rugs go first, then things on
 * the walls, then standing pieces by how far forward their feet are, so whatever is nearer the front is drawn over
 * what's behind it. A piece sitting on another follows it. `draft` reorders a piece live as it's dragged.
 */
export function ownedIn(home: HomeState, room: RoomId, draft?: Draft): ItemId[] {
  const layer = (id: ItemId) => (ITEM_ART[id].flat ? 0 : standsOnFloor(id) ? 2 : 1);
  const depth = (id: ItemId): number => {
    const parent = parentOf(home, id);
    if (parent) return depth(parent);
    return standsOnFloor(id) ? feet(id) + offsetOf(home, id, draft).dy : 0;
  };
  return itemsIn(room)
    .map((i) => i.id)
    .filter((id) => inRoom(home, id) && !ITEM_ART[id].roams)
    .sort((a, b) => layer(a) - layer(b) || depth(a) - depth(b) || ITEM_ART[a].z - ITEM_ART[b].z);
}

/** Furniture for a room that you've put away, to bring back out. */
export function storedIn(home: HomeState, room: RoomId): ItemId[] {
  return itemsIn(room).map((i) => i.id).filter((id) => isOwned(home, id) && home.decor.items[id]?.stored);
}

/** Pieces that can be moved on their own: everything except what sits on something else. */
export function movableIn(home: HomeState, room: RoomId): ItemId[] {
  return ownedIn(home, room).filter((id) => !parentOf(home, id));
}

/** The front-most movable piece under a point in room units, if any. */
export function pieceAt(home: HomeState, room: RoomId, x: number, y: number): ItemId | undefined {
  return [...movableIn(home, room)].reverse().find((id) => {
    const [bx, by, bw, bh] = ITEM_ART[id].box;
    const { dx, dy } = offsetOf(home, id);
    return x >= bx + dx && x <= bx + dx + bw && y >= by + dy && y <= by + dy + bh;
  });
}
