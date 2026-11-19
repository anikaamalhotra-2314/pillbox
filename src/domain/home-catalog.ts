import { PILL_COLORS, type PillColor } from './pill-icon';

// Everything the little home can contain, in the order it is drawn and listed. Prices are in coins.
// A price of 0 means it comes with the home. Prices are proposals, tuned for 5 coins per on-time dose.

export type FloorId = 'floor-1' | 'floor-2' | 'floor-3';
export type RoomId = 'living' | 'kitchen' | 'dining' | 'garden' | 'bedroom' | 'bathroom' | 'office' | 'studio' | 'greenhouse';
export type ItemId =
  | 'curtains' | 'gallery' | 'pendant' | 'bookshelf' | 'fig' | 'floor-lamp' | 'rug' | 'sofa' | 'coffee-table' | 'cat'
  | 'jar-shelf' | 'herbs' | 'fridge' | 'kettle'
  | 'chandelier' | 'sideboard' | 'dining-table'
  | 'string-lights' | 'wardrobe' | 'mirror' | 'bed' | 'nightstand'
  | 'bath-mirror' | 'towels' | 'tub' | 'duck'
  | 'corkboard' | 'filing-cabinet' | 'computer-desk'
  | 'flower-bed' | 'birdbath' | 'apple-tree' | 'bench'
  | 'easel' | 'armchair' | 'desk' | 'telescope'
  | 'hanging-plants' | 'lemon-tree' | 'planters';
export type CatalogId = FloorId | RoomId | ItemId;

export interface FloorEntry {
  kind: 'floor';
  id: FloorId;
  name: string;
  price: number;
  /** 0 is the ground floor. */
  level: number;
}

export type RoomSide = 'left' | 'right' | 'far' | 'yard';
export const ROOM_SIDES: readonly RoomSide[] = ['left', 'right', 'far', 'yard'];

export interface RoomEntry {
  kind: 'room';
  id: RoomId;
  name: string;
  price: number;
  floor: FloorId;
  /**
   * Each floor has a wide room on the left and a narrow one on the right. The two lower floors also have a
   * third, narrow room past that one (`far`); the attic doesn't. The garden is outside, past the ground floor (`yard`).
   */
  side: RoomSide;
  /** Outside: no walls or floor to change, and the person gets there through a back door. */
  outdoor?: boolean;
  /** A room that has to be built first. Without it, a room needs only its floor. */
  needs?: RoomId;
}

export interface ItemEntry {
  kind: 'item';
  id: ItemId;
  name: string;
  price: number;
  room: RoomId;
  /** Another item it sits on. Without it, the item needs only its room. */
  needs?: ItemId;
}

export type CatalogEntry = FloorEntry | RoomEntry | ItemEntry;

export const FLOORS: readonly FloorEntry[] = [
  { kind: 'floor', id: 'floor-1', name: 'Ground floor', price: 0, level: 0 },
  { kind: 'floor', id: 'floor-2', name: 'Second floor', price: 600, level: 1 },
  { kind: 'floor', id: 'floor-3', name: 'Attic', price: 1000, level: 2 },
];

export const ROOMS: readonly RoomEntry[] = [
  { kind: 'room', id: 'living', name: 'Living room', price: 0, floor: 'floor-1', side: 'left' },
  { kind: 'room', id: 'kitchen', name: 'Kitchen', price: 250, floor: 'floor-1', side: 'right' },
  { kind: 'room', id: 'dining', name: 'Dining room', price: 300, floor: 'floor-1', side: 'far' },
  // Its back door is in the dining room, so the dining room comes first.
  { kind: 'room', id: 'garden', name: 'Garden', price: 400, floor: 'floor-1', side: 'yard', outdoor: true, needs: 'dining' },
  { kind: 'room', id: 'bedroom', name: 'Bedroom', price: 300, floor: 'floor-2', side: 'left' },
  { kind: 'room', id: 'bathroom', name: 'Bathroom', price: 250, floor: 'floor-2', side: 'right' },
  { kind: 'room', id: 'office', name: 'Office', price: 350, floor: 'floor-2', side: 'far' },
  { kind: 'room', id: 'studio', name: 'Studio', price: 400, floor: 'floor-3', side: 'left' },
  { kind: 'room', id: 'greenhouse', name: 'Greenhouse', price: 350, floor: 'floor-3', side: 'right' },
];

// Back to front within each room: wall pieces first, then furniture, then what sits on it.
export const ITEMS: readonly ItemEntry[] = [
  { kind: 'item', id: 'rug', name: 'Rug', price: 20, room: 'living' },
  { kind: 'item', id: 'fig', name: 'Fiddle-leaf fig', price: 30, room: 'living' },
  { kind: 'item', id: 'pendant', name: 'Pendant light', price: 35, room: 'living' },
  { kind: 'item', id: 'floor-lamp', name: 'Floor lamp', price: 40, room: 'living' },
  { kind: 'item', id: 'gallery', name: 'Gallery wall', price: 45, room: 'living' },
  { kind: 'item', id: 'curtains', name: 'Curtains', price: 50, room: 'living' },
  { kind: 'item', id: 'coffee-table', name: 'Coffee table', price: 60, room: 'living' },
  { kind: 'item', id: 'bookshelf', name: 'Bookshelf', price: 90, room: 'living' },
  { kind: 'item', id: 'sofa', name: 'Sofa', price: 120, room: 'living' },
  { kind: 'item', id: 'cat', name: 'A cat', price: 200, room: 'living' },

  { kind: 'item', id: 'kettle', name: 'Kettle', price: 25, room: 'kitchen' },
  { kind: 'item', id: 'herbs', name: 'Herb pots', price: 30, room: 'kitchen' },
  { kind: 'item', id: 'jar-shelf', name: 'Jar shelf', price: 40, room: 'kitchen' },
  { kind: 'item', id: 'fridge', name: 'Fridge', price: 80, room: 'kitchen' },

  { kind: 'item', id: 'chandelier', name: 'Chandelier', price: 60, room: 'dining' },
  { kind: 'item', id: 'sideboard', name: 'Sideboard', price: 70, room: 'dining' },
  { kind: 'item', id: 'dining-table', name: 'Dining table', price: 110, room: 'dining' },

  { kind: 'item', id: 'flower-bed', name: 'Flower bed', price: 30, room: 'garden' },
  { kind: 'item', id: 'birdbath', name: 'Birdbath', price: 45, room: 'garden' },
  { kind: 'item', id: 'bench', name: 'Bench', price: 60, room: 'garden' },
  { kind: 'item', id: 'apple-tree', name: 'Apple tree', price: 100, room: 'garden' },

  { kind: 'item', id: 'string-lights', name: 'String lights', price: 35, room: 'bedroom' },
  { kind: 'item', id: 'mirror', name: 'Mirror', price: 40, room: 'bedroom' },
  { kind: 'item', id: 'nightstand', name: 'Nightstand', price: 45, room: 'bedroom' },
  { kind: 'item', id: 'wardrobe', name: 'Wardrobe', price: 110, room: 'bedroom' },
  { kind: 'item', id: 'bed', name: 'Bed', price: 150, room: 'bedroom' },

  { kind: 'item', id: 'towels', name: 'Towel rail', price: 25, room: 'bathroom' },
  { kind: 'item', id: 'bath-mirror', name: 'Sink and mirror', price: 70, room: 'bathroom' },
  { kind: 'item', id: 'tub', name: 'Bathtub', price: 120, room: 'bathroom' },
  { kind: 'item', id: 'duck', name: 'Rubber duck', price: 15, room: 'bathroom', needs: 'tub' },

  { kind: 'item', id: 'corkboard', name: 'Corkboard', price: 30, room: 'office' },
  { kind: 'item', id: 'filing-cabinet', name: 'Filing cabinet', price: 50, room: 'office' },
  { kind: 'item', id: 'computer-desk', name: 'Computer desk', price: 100, room: 'office' },

  { kind: 'item', id: 'easel', name: 'Easel', price: 70, room: 'studio' },
  { kind: 'item', id: 'armchair', name: 'Armchair', price: 80, room: 'studio' },
  { kind: 'item', id: 'desk', name: 'Desk', price: 90, room: 'studio' },
  { kind: 'item', id: 'telescope', name: 'Telescope', price: 120, room: 'studio' },

  { kind: 'item', id: 'hanging-plants', name: 'Hanging plants', price: 35, room: 'greenhouse' },
  { kind: 'item', id: 'planters', name: 'Planter boxes', price: 40, room: 'greenhouse' },
  { kind: 'item', id: 'lemon-tree', name: 'Lemon tree', price: 90, room: 'greenhouse' },
];

export const CATALOG: readonly CatalogEntry[] = [...FLOORS, ...ROOMS, ...ITEMS];

/** The order the home grows in: each floor, then its rooms, from the ground up. */
export const BUILD_ORDER: readonly (FloorEntry | RoomEntry)[] = FLOORS.flatMap((f) => [f, ...ROOMS.filter((r) => r.floor === f.id)]);

const byId = new Map<string, CatalogEntry>(CATALOG.map((e) => [e.id, e]));

export function isCatalogId(id: unknown): id is CatalogId {
  return typeof id === 'string' && byId.has(id);
}

export function catalogEntry(id: CatalogId): CatalogEntry {
  return byId.get(id)!;
}

/** What has to be owned first: the floor below, the room's floor (or the room it opens from), the item's room or the item it sits on. */
export function prerequisite(entry: CatalogEntry): CatalogId | undefined {
  switch (entry.kind) {
    case 'floor': return FLOORS.find((f) => f.level === entry.level - 1)?.id;
    case 'room': return entry.needs ?? entry.floor;
    case 'item': return entry.needs ?? entry.room;
  }
}

export function roomsOn(floor: FloorId): RoomEntry[] {
  return ROOMS.filter((r) => r.floor === floor);
}

export function itemsIn(room: RoomId): ItemEntry[] {
  return ITEMS.filter((i) => i.room === room);
}

// ── Decorating ──
// Paint for furniture and walls uses the pill icon colors, so the home matches the rest of the app.
export const PAINTS = PILL_COLORS;
export type Paint = PillColor;

export const FLOOR_STYLES = [
  { id: 'honey', name: 'Honey boards' },
  { id: 'walnut', name: 'Walnut boards' },
  { id: 'blue-tile', name: 'Blue tiles' },
  { id: 'mint-tile', name: 'Mint tiles' },
  { id: 'checker', name: 'Checkerboard' },
] as const;
export type FloorStyle = (typeof FLOOR_STYLES)[number]['id'];

export const isPaint = (v: unknown): v is Paint => PAINTS.some((p) => p.id === v);
export const isFloorStyle = (v: unknown): v is FloorStyle => FLOOR_STYLES.some((f) => f.id === v);
