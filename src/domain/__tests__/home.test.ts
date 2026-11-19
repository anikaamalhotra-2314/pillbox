import { doseKey } from '../day';
import {
  availability, coinBalance, decorateItem, decorateRoom, COINS_PER_DOSE, DEV_GRANT_KEY, grantCoins, earnedFromLogs, earnedOn, emptyHome, isOnTime, isOwned, nextGoal, purchase,
  isPlaced, purchasedIn, settleDose, type HomeState,
} from '../home';
import { BUILD_ORDER, CATALOG, catalogEntry, FLOORS, isCatalogId, ITEMS, prerequisite, ROOMS, type CatalogId } from '../home-catalog';
import type { Dose, DoseLog, Medication } from '../types';

const dose: Dose = { medicationId: 'a', date: '2025-03-15', time: '09:00' };
const at = (h: number, m: number) => new Date(2025, 2, 15, h, m).toISOString();
const taken = (loggedAt: string, d: Dose = dose): DoseLog => ({ ...d, outcome: 'taken', loggedAt });
const NOW = new Date(2025, 2, 15, 12, 0);

/** A home with `coins` to spend, earned on made-up doses. */
function richHome(coins: number, purchases: CatalogId[] = []): HomeState {
  const earned: Record<string, number> = { 'x|2025-01-01|00:00': coins + purchases.reduce((s, id) => s + catalogEntry(id).price, 0) };
  return { ...emptyHome(), earned, purchases: purchases.map((id) => ({ id, price: catalogEntry(id).price, at: NOW.toISOString() })) };
}

describe('isOnTime', () => {
  it('counts from an hour early until the grace window ends, inclusive', () => {
    expect(isOnTime(dose, at(7, 59), 30)).toBe(false);
    expect(isOnTime(dose, at(8, 0), 30)).toBe(true);
    expect(isOnTime(dose, at(9, 0), 30)).toBe(true);
    expect(isOnTime(dose, at(9, 30), 30)).toBe(true);
    expect(isOnTime(dose, at(9, 31), 30)).toBe(false);
  });
  it("uses the medication's own grace window", () => {
    expect(isOnTime(dose, at(9, 16), 15)).toBe(false);
    expect(isOnTime(dose, at(10, 30), 120)).toBe(true);
  });
  it('never counts a dose logged on a later day', () => {
    expect(isOnTime(dose, new Date(2025, 2, 16, 9, 0).toISOString(), 180)).toBe(false);
  });
});

describe('settleDose', () => {
  it('pays for a dose taken on time', () => {
    expect(settleDose({}, dose, taken(at(9, 5)), 30)).toEqual({ [doseKey(dose)]: COINS_PER_DOSE });
  });
  it('pays nothing for a late dose, a skipped dose or no log', () => {
    expect(settleDose({}, dose, taken(at(11, 0)), 30)).toEqual({});
    expect(settleDose({}, dose, { ...dose, outcome: 'skipped', loggedAt: at(9, 0) }, 30)).toEqual({});
    expect(settleDose({}, dose, undefined, 30)).toEqual({});
  });
  it('takes the coins back on undo or skip, and leaves other doses alone', () => {
    const other = 'b|2025-03-15|10:00';
    const earned = { [doseKey(dose)]: 5, [other]: 5 };
    expect(settleDose(earned, dose, undefined, 30)).toEqual({ [other]: 5 });
    expect(settleDose(earned, dose, { ...dose, outcome: 'skipped', loggedAt: at(9, 0) }, 30)).toEqual({ [other]: 5 });
  });
  it('never pays twice for the same dose', () => {
    const once = settleDose({}, dose, taken(at(9, 0)), 30);
    expect(settleDose(once, dose, taken(at(9, 1)), 30)).toBe(once);
  });
  it('returns the same object when nothing changes', () => {
    const earned = {};
    expect(settleDose(earned, dose, undefined, 30)).toBe(earned);
  });
});

describe('earnedFromLogs', () => {
  const med = { id: 'a', graceMinutes: 30 } as Medication;
  it('backfills on-time doses only, and nothing for deleted medications', () => {
    const late = { ...dose, time: '06:00' };
    const gone = { ...dose, medicationId: 'deleted' };
    const logs = [taken(at(9, 0)), taken(at(9, 0), late), taken(at(9, 0), gone)];
    expect(earnedFromLogs(logs, [med])).toEqual({ [doseKey(dose)]: 5 });
  });
});

describe('balance and purchases', () => {
  it('is earned minus spent, at the price paid', () => {
    const home: HomeState = { ...emptyHome(), earned: { k1: 5, k2: 5, k3: 5 }, purchases: [{ id: 'rug', price: 12, at: NOW.toISOString() }] };
    expect(coinBalance(home)).toBe(3);
  });
  it('starts with the ground floor and living room, and nothing to spend', () => {
    const home = emptyHome();
    expect(coinBalance(home)).toBe(0);
    expect(isOwned(home, 'floor-1')).toBe(true);
    expect(isOwned(home, 'living')).toBe(true);
    expect(isOwned(home, 'kitchen')).toBe(false);
    expect(isOwned(home, 'rug')).toBe(false);
  });
  it('says how many coins are missing', () => {
    expect(availability(richHome(15), 'rug')).toEqual({ kind: 'short', missing: 5 });
    expect(availability(richHome(20), 'rug')).toEqual({ kind: 'available' });
  });
  it('locks a room until its floor is built, and an item until its room is', () => {
    const home = richHome(10_000);
    expect(availability(home, 'bedroom')).toEqual({ kind: 'locked', needs: 'floor-2' });
    expect(availability(home, 'kettle')).toEqual({ kind: 'locked', needs: 'kitchen' });
    expect(availability(home, 'floor-3')).toEqual({ kind: 'locked', needs: 'floor-2' });
    expect(availability(richHome(10_000, ['kitchen']), 'kettle')).toEqual({ kind: 'available' });
  });
  it('locks the garden until the dining room is built, since its back door is there', () => {
    expect(availability(richHome(10_000, ['kitchen']), 'garden')).toEqual({ kind: 'locked', needs: 'dining' });
    expect(availability(richHome(10_000, ['kitchen', 'dining']), 'garden')).toEqual({ kind: 'available' });
  });
  it('locks an item that sits on another until that one is bought', () => {
    expect(availability(richHome(10_000, ['floor-2', 'bathroom']), 'duck')).toEqual({ kind: 'locked', needs: 'tub' });
  });
  it('reports a missing prerequisite before missing coins', () => {
    expect(availability(emptyHome(), 'kettle')).toEqual({ kind: 'locked', needs: 'kitchen' });
  });
  it('buys at the current price and records when', () => {
    const home = purchase(richHome(25), 'rug', NOW);
    expect(home.purchases.at(-1)).toEqual({ id: 'rug', price: 20, at: NOW.toISOString() });
    expect(coinBalance(home)).toBe(5);
    expect(availability(home, 'rug')).toEqual({ kind: 'owned' });
  });
  it('refuses, unchanged, anything owned, locked or unaffordable', () => {
    for (const [home, id] of [[richHome(100, ['rug']), 'rug'], [richHome(1000), 'kettle'], [richHome(5), 'rug'], [richHome(100), 'living']] as const) {
      expect(purchase(home, id, NOW)).toBe(home);
    }
  });
  it('counts what was bought for a room', () => {
    expect(purchasedIn(richHome(0, ['rug', 'sofa', 'kitchen', 'kettle']), 'living')).toBe(2);
  });
});

describe('grantCoins', () => {
  it('adds to the balance without counting toward any day', () => {
    const home = grantCoins(grantCoins(emptyHome(), 500), 500);
    expect(coinBalance(home)).toBe(1000);
    expect(home.earned[DEV_GRANT_KEY]).toBe(1000);
    expect(earnedOn(home.earned, '2025-03-15')).toEqual({ coins: 0, doses: 0 });
  });
  it('ignores amounts that are not positive whole numbers', () => {
    const home = emptyHome();
    for (const bad of [0, -5, 2.5]) expect(grantCoins(home, bad)).toBe(home);
  });
});

describe('earnedOn', () => {
  it("sums the coins for one day's doses", () => {
    const earned = { 'a|2025-03-15|09:00': 5, 'b|2025-03-15|21:00': 5, 'a|2025-03-14|09:00': 5 };
    expect(earnedOn(earned, '2025-03-15')).toEqual({ coins: 10, doses: 2 });
    expect(earnedOn(earned, '2025-03-16')).toEqual({ coins: 0, doses: 0 });
  });
});

describe('nextGoal', () => {
  it('grows from the ground up: the kitchen and dining room, then the second floor, then its rooms', () => {
    expect(nextGoal(emptyHome())?.id).toBe('kitchen');
    expect(nextGoal(richHome(0, ['kitchen']))?.id).toBe('dining');
    expect(nextGoal(richHome(0, ['kitchen', 'dining']))?.id).toBe('garden');
    expect(nextGoal(richHome(0, ['kitchen', 'dining', 'garden']))?.id).toBe('floor-2');
    expect(nextGoal(richHome(0, ['kitchen', 'dining', 'garden', 'floor-2']))?.id).toBe('bedroom');
    // A room left behind on a lower floor still comes first.
    expect(nextGoal(richHome(0, ['floor-2', 'bedroom']))?.id).toBe('kitchen');
  });
  it('turns to the cheapest furniture once every room and floor is built', () => {
    const built = [...FLOORS, ...ROOMS].filter((e) => e.price > 0).map((e) => e.id);
    // The duck is cheaper but needs the tub first.
    expect(nextGoal(richHome(0, built))?.id).toBe('rug');
  });
  it('is undefined when everything is owned', () => {
    expect(nextGoal(richHome(0, CATALOG.filter((e) => e.price > 0).map((e) => e.id)))).toBeUndefined();
  });
});

describe('catalog', () => {
  it('builds every floor and room once, each floor before its rooms', () => {
    expect(BUILD_ORDER.map((e) => e.id)).toEqual([
      'floor-1', 'living', 'kitchen', 'dining', 'garden', 'floor-2', 'bedroom', 'bathroom', 'office', 'floor-3', 'studio', 'greenhouse',
    ]);
  });
  it('has unique ids that all pass isCatalogId', () => {
    const ids = CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(isCatalogId)).toBe(true);
    expect(isCatalogId('spaceship')).toBe(false);
  });
  it('gives the two lower floors three rooms (the dining room and office on the far right), the ground floor a garden, and the attic two', () => {
    const sides = (floor: string) => ROOMS.filter((r) => r.floor === floor).map((r) => r.side).sort();
    expect(sides('floor-1')).toEqual(['far', 'left', 'right', 'yard']);
    expect(sides('floor-2')).toEqual(['far', 'left', 'right']);
    expect(sides('floor-3')).toEqual(['left', 'right']);
    expect(ROOMS.find((r) => r.side === 'far' && r.floor === 'floor-1')?.id).toBe('dining');
    expect(ROOMS.find((r) => r.side === 'far' && r.floor === 'floor-2')?.id).toBe('office');
  });
  it('only lets an item sit on another item in the same room', () => {
    for (const item of ITEMS.filter((i) => i.needs)) expect(catalogEntry(item.needs!)).toMatchObject({ kind: 'item', room: item.room });
  });
  it('has a prerequisite for everything except the ground floor, and every prerequisite exists', () => {
    for (const e of CATALOG) {
      const needs = prerequisite(e);
      if (e.id === 'floor-1') expect(needs).toBeUndefined();
      else expect(isCatalogId(needs)).toBe(true);
    }
  });
  it('uses whole, non-negative prices', () => {
    for (const e of CATALOG) expect(Number.isInteger(e.price) && e.price >= 0).toBe(true);
  });
});

describe('decorating', () => {
  const home = richHome(0, ['sofa', 'kitchen']);

  it('moves and repaints owned furniture, storing only what changed', () => {
    const moved = decorateItem(home, 'sofa', { dx: -20.4 });
    expect(moved.decor.items.sofa).toEqual({ dx: -20 });
    const painted = decorateItem(moved, 'sofa', { color: 'mint' });
    expect(painted.decor.items.sofa).toEqual({ dx: -20, color: 'mint' });
  });
  it('puts a choice back to the original with null, and forgets an item with nothing changed', () => {
    const changed = decorateItem(home, 'sofa', { dx: 10, color: 'rose' });
    expect(decorateItem(changed, 'sofa', { color: null }).decor.items.sofa).toEqual({ dx: 10 });
    expect(decorateItem(changed, 'sofa', { dx: 0, color: null }).decor.items).toEqual({});
  });
  it('moves furniture forward and back as well as sideways, independently', () => {
    const moved = decorateItem(home, 'sofa', { dx: 10, dy: -6.6 });
    expect(moved.decor.items.sofa).toEqual({ dx: 10, dy: -7 });
    expect(decorateItem(moved, 'sofa', { dy: null }).decor.items.sofa).toEqual({ dx: 10 });
    expect(decorateItem(home, 'sofa', { dy: Number.POSITIVE_INFINITY })).toBe(home);
  });
  it('puts furniture away and brings it back out, keeping where it was', () => {
    const away = decorateItem(decorateItem(home, 'sofa', { dx: 10 }), 'sofa', { stored: true });
    expect(away.decor.items.sofa).toEqual({ dx: 10, stored: true });
    expect([isOwned(away, 'sofa'), isPlaced(away, 'sofa')]).toEqual([true, false]);
    expect(decorateItem(away, 'sofa', { stored: null }).decor.items.sofa).toEqual({ dx: 10 });
  });
  it('turns a piece to face the other way and back', () => {
    const turned = decorateItem(home, 'sofa', { flip: true });
    expect(turned.decor.items.sofa).toEqual({ flip: true });
    expect(decorateItem(turned, 'sofa', { flip: null }).decor.items).toEqual({});
  });
  it('is free: the balance never changes', () => {
    expect(coinBalance(decorateItem(home, 'sofa', { color: 'mint' }))).toBe(coinBalance(home));
  });
  it('ignores furniture and rooms you do not own, and nonsense moves', () => {
    expect(decorateItem(home, 'bed', { dx: 5 })).toBe(home);
    expect(decorateRoom(home, 'bedroom', { wall: 'maroon' })).toBe(home);
    expect(decorateItem(home, 'sofa', { dx: Number.NaN })).toBe(home);
  });
  it('repaints walls and changes floors, including the living room you start with', () => {
    const start = emptyHome();
    const painted = decorateRoom(decorateRoom(start, 'living', { wall: 'mustard' }), 'living', { floor: 'checker' });
    expect(painted.decor.rooms.living).toEqual({ wall: 'mustard', floor: 'checker' });
    expect(decorateRoom(painted, 'living', { wall: null, floor: null }).decor.rooms).toEqual({});
  });
  it('has no walls or floor to change in the garden', () => {
    const garden = richHome(0, ['kitchen', 'dining', 'garden']);
    expect(decorateRoom(garden, 'garden', { wall: 'maroon' })).toBe(garden);
  });
});
