import { isOwned, type HomeState } from '@/domain/home';
import { catalogEntry, itemsIn, ROOMS, type ItemId, type RoomId } from '@/domain/home-catalog';
import { ITEM_ART } from './art/items';
import { ROOM_WIDTH } from './art/rooms';

const owner = (home: HomeState) => (id: ItemId) => isOwned(home, id);

/** The piece this one sits on, if any (the duck on the tub, the cat on the sofa). */
export function parentOf(home: HomeState, id: ItemId): ItemId | undefined {
  return ITEM_ART[id].attachedTo?.(owner(home));
}

/** How far a piece has been slid, following whatever it sits on. `draft` overrides one piece while it's being dragged. */
export function offsetOf(home: HomeState, id: ItemId, draft?: { id: ItemId; dx: number }): number {
  const parent = parentOf(home, id);
  if (parent) return offsetOf(home, parent, draft);
  if (draft?.id === id) return draft.dx;
  return home.decor.items[id]?.dx ?? 0;
}

/** How far a piece can slide either way and stay inside its room. */
export function slideRange(id: ItemId): { min: number; max: number } {
  const entry = catalogEntry(id);
  if (entry.kind !== 'item') throw new Error(`${id} is not furniture`);
  const width = ROOM_WIDTH[ROOMS.find((r) => r.id === entry.room)!.side];
  const [x, , w] = ITEM_ART[id].box;
  return { min: -x, max: width - (x + w) };
}

export const clampSlide = (id: ItemId, dx: number) => {
  const { min, max } = slideRange(id);
  return Math.round(Math.min(max, Math.max(min, dx)));
};

/** Furniture you own in a room, back to front. Not the cat, which goes where it likes. */
export function ownedIn(home: HomeState, room: RoomId): ItemId[] {
  return itemsIn(room).map((i) => i.id).filter((id) => isOwned(home, id) && !ITEM_ART[id].roams).sort((a, b) => ITEM_ART[a].z - ITEM_ART[b].z);
}

/** Pieces that can be moved on their own: everything except what sits on something else. */
export function movableIn(home: HomeState, room: RoomId): ItemId[] {
  return ownedIn(home, room).filter((id) => !parentOf(home, id));
}

/** The front-most movable piece under a point in room units, if any. */
export function pieceAt(home: HomeState, room: RoomId, x: number, y: number): ItemId | undefined {
  return [...movableIn(home, room)].reverse().find((id) => {
    const [bx, by, bw, bh] = ITEM_ART[id].box;
    const left = bx + offsetOf(home, id);
    return x >= left && x <= left + bw && y >= by && y <= by + bh;
  });
}
