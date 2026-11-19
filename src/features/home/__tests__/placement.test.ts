import { emptyHome, type HomeState } from '@/domain/home';
import type { ItemId } from '@/domain/home-catalog';
import { ITEM_ART } from '../art/items';
import { floorTop, ROOM_HEIGHT, wallBottom } from '../art/rooms';
import { clampMove, movableIn, moveRange, offsetOf, ownedIn, pieceAt, roomStart, standsOnFloor, storedIn } from '../placement';

const owning = (ids: ItemId[], items: HomeState['decor']['items'] = {}): HomeState => ({
  ...emptyHome(),
  purchases: ids.map((id) => ({ id, price: 0, at: '2026-01-01T00:00:00.000Z' })),
  decor: { items, rooms: {} },
});
const feet = (id: ItemId) => ITEM_ART[id].box[1] + ITEM_ART[id].box[3];

describe('placement', () => {
  it('lets standing pieces go forward and back, and keeps wall pieces on the wall', () => {
    expect(standsOnFloor('sofa')).toBe(true);
    expect(standsOnFloor('towels')).toBe(false);
    expect(moveRange('towels').dy).toEqual({ min: 0, max: 0 });
  });
  it('hangs the window anywhere on the wall, and the curtains go with it', () => {
    expect(standsOnFloor('window')).toBe(false);
    const up = clampMove('window', { dx: 0, dy: -500 });
    const down = clampMove('window', { dx: 0, dy: 500 });
    expect(ITEM_ART.window.box[1] + up.dy).toBe(0);
    expect(ITEM_ART.window.box[1] + ITEM_ART.window.box[3] + down.dy).toBe(wallBottom('living'));
    const home = owning(['curtains'], { window: { dx: 30, dy: 10 } });
    expect(offsetOf(home, 'curtains')).toEqual({ dx: 30, dy: 10 });
    expect(movableIn(home, 'living')).toEqual(['window']);
  });
  it('leaves out furniture that is put away, and what hangs on it, until it comes back out', () => {
    const home = owning(['sofa', 'curtains'], { sofa: { stored: true }, window: { stored: true } });
    expect(ownedIn(home, 'living')).toEqual([]);
    expect(storedIn(home, 'living')).toEqual(['window', 'sofa']);
  });
  it('lets living room furniture go into the stairwell beside it, but not past its outer wall', () => {
    const x = ITEM_ART.sofa.box[0];
    expect(x + clampMove('sofa', { dx: -999, dy: 0 }).dx).toBe(roomStart('living'));
    expect(roomStart('living')).toBeLessThan(0);
    expect(x + clampMove('fridge', { dx: -999, dy: 0 }).dx + (ITEM_ART.fridge.box[0] - x)).toBe(0);
  });
  it('keeps the café curtains on the kitchen window', () => {
    expect(moveRange('cafe-curtains')).toEqual({ dx: { min: 0, max: 0 }, dy: { min: 0, max: 0 } });
  });
  it('keeps a standing piece’s feet on the floor', () => {
    const back = clampMove('coffee-table', { dx: 0, dy: -500 });
    const front = clampMove('coffee-table', { dx: 0, dy: 500 });
    expect(feet('coffee-table') + back.dy).toBe(floorTop('living'));
    expect(feet('coffee-table') + front.dy).toBe(ROOM_HEIGHT);
  });
  it('never puts where a piece came from out of range', () => {
    for (const id of Object.keys(ITEM_ART) as ItemId[]) {
      if (ITEM_ART[id].roams) continue;
      const { dx, dy } = moveRange(id);
      expect([dx.min <= 0 && dx.max >= 0, dy.min <= 0 && dy.max >= 0]).toEqual([true, true]);
    }
  });
  it('draws whatever is nearer the front over what is behind it, with the rug always underneath', () => {
    const home = owning(['rug', 'sofa', 'coffee-table', 'gallery']);
    expect(ownedIn(home, 'living')).toEqual(['rug', 'window', 'gallery', 'sofa', 'coffee-table']);
    const tucked = owning(['rug', 'sofa', 'coffee-table', 'gallery'], { 'coffee-table': { dy: -30 }, rug: { dy: 2 } });
    expect(ownedIn(tucked, 'living')).toEqual(['rug', 'window', 'gallery', 'coffee-table', 'sofa']);
  });
  it('finds a moved piece where it is now', () => {
    const home = owning(['coffee-table'], { 'coffee-table': { dx: -40, dy: -10 } });
    expect(offsetOf(home, 'coffee-table')).toEqual({ dx: -40, dy: -10 });
    const [x, y] = ITEM_ART['coffee-table'].box;
    expect(pieceAt(home, 'living', x - 40 + 5, y - 10 + 5)).toBe('coffee-table');
    expect(pieceAt(home, 'living', x + 55, y + 30)).toBeUndefined();
  });
});
