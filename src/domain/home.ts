import { withAvatar, type Avatar } from './avatar';
import { scheduledInstant, type LocalDate } from './dates';
import { doseKey } from './day';
import {
  BUILD_ORDER, catalogEntry, ITEMS, prerequisite, type CatalogEntry, type CatalogId, type FloorStyle, type ItemId, type Paint, type RoomId, type WallPaint,
} from './home-catalog';
import type { Dose, DoseLog, Medication } from './types';

/** Coins for each dose checked off on time. */
export const COINS_PER_DOSE = 5;
/** How early a dose can be checked off and still count as on time. The late side is the medication's grace window. */
export const EARLY_MINUTES = 60;

export interface Purchase {
  id: CatalogId;
  /** What it cost at the time, so a later price change never changes the balance. */
  price: number;
  at: string; // ISO 8601
}

/**
 * How a piece of furniture was changed from how it comes: moved (`dx` sideways, `dy` forward or back on the floor,
 * in scene units; down is positive), repainted, turned to face the other way, or put away (still yours, just not
 * in the room).
 */
export interface ItemDecor {
  dx?: number;
  dy?: number;
  stored?: true;
  color?: Paint;
  flip?: true;
}

export interface RoomDecor {
  wall?: WallPaint;
  floor?: FloorStyle;
}

/** Only what differs from the original is stored, so "Original" is simply a missing value. */
export interface Decor {
  items: Partial<Record<ItemId, ItemDecor>>;
  rooms: Partial<Record<RoomId, RoomDecor>>;
}

export interface HomeState {
  /** Coins earned, by dose key. A ledger rather than a count, so an undo takes back exactly that dose's coins. */
  earned: Record<string, number>;
  purchases: Purchase[];
  /** Added in storage version 4. Free to change at any time. */
  decor: Decor;
  /** How the person looks, where it differs from how they come. Free to change at any time. */
  avatar?: Partial<Avatar>;
}

/** Changes how the person looks. Free. */
export function changeAvatar(home: HomeState, change: Partial<Avatar>): HomeState {
  const avatar = withAvatar(home.avatar, change);
  const { avatar: _old, ...rest } = home;
  return avatar ? { ...rest, avatar } : rest;
}

export const emptyHome = (): HomeState => ({ earned: {}, purchases: [], decor: { items: {}, rooms: {} } });

/** Checked off from an hour before the scheduled time until the grace window ends. */
export function isOnTime(dose: Dose, loggedAt: string, graceMinutes: number): boolean {
  const scheduled = scheduledInstant(dose.date, dose.time).getTime();
  const at = new Date(loggedAt).getTime();
  return at >= scheduled - EARLY_MINUTES * 60_000 && at <= scheduled + graceMinutes * 60_000;
}

const earns = (log: DoseLog | undefined, graceMinutes: number) =>
  log?.outcome === 'taken' && isOnTime(log, log.loggedAt, graceMinutes);

/**
 * Brings one dose's coins in line with its log: paid when it is taken on time, taken back when it is
 * unchecked or skipped. Coins already earned are not re-checked, so editing the schedule later never costs any.
 */
export function settleDose(earned: Record<string, number>, dose: Dose, log: DoseLog | undefined, graceMinutes: number): Record<string, number> {
  const key = doseKey(dose);
  if (earns(log, graceMinutes)) return key in earned ? earned : { ...earned, [key]: COINS_PER_DOSE };
  if (!(key in earned)) return earned;
  const { [key]: _removed, ...rest } = earned;
  return rest;
}

/** Coins for history logged before the home existed. Logs of deleted medications earn nothing. */
export function earnedFromLogs(logs: DoseLog[], medications: Medication[]): Record<string, number> {
  const grace = new Map(medications.map((m) => [m.id, m.graceMinutes]));
  const earned: Record<string, number> = {};
  for (const log of logs) {
    const g = grace.get(log.medicationId);
    if (g !== undefined && earns(log, g)) earned[doseKey(log)] = COINS_PER_DOSE;
  }
  return earned;
}

/** Where development grants are kept: a made-up dose far in the past, so they never count toward a day. */
export const DEV_GRANT_KEY = 'dev-grant|2000-01-01|00:00';

/** Development only: coins from nowhere, to try out the shop. */
export function grantCoins(home: HomeState, amount: number): HomeState {
  if (!Number.isInteger(amount) || amount <= 0) return home;
  return { ...home, earned: { ...home.earned, [DEV_GRANT_KEY]: (home.earned[DEV_GRANT_KEY] ?? 0) + amount } };
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Earned minus spent. Below zero only if doses were unchecked after their coins were spent. */
export function coinBalance(home: HomeState): number {
  return sum(Object.values(home.earned)) - sum(home.purchases.map((p) => p.price));
}

/** Coins earned for doses scheduled on `date`, and how many doses earned them. */
export function earnedOn(earned: Record<string, number>, date: LocalDate): { coins: number; doses: number } {
  const values = Object.entries(earned).filter(([key]) => key.split('|')[1] === date).map(([, v]) => v);
  return { coins: sum(values), doses: values.length };
}

export function isOwned(home: HomeState, id: CatalogId): boolean {
  return catalogEntry(id).price === 0 || home.purchases.some((p) => p.id === id);
}

/** Furniture you own and haven't put away: it's in its room. */
export function isPlaced(home: HomeState, id: ItemId): boolean {
  return isOwned(home, id) && !home.decor.items[id]?.stored;
}

export type Availability =
  | { kind: 'owned' }
  | { kind: 'locked'; needs: CatalogId }
  | { kind: 'short'; missing: number }
  | { kind: 'available' };

/** Whether something can be bought now, and if not, why. Missing prerequisites come before missing coins. */
export function availability(home: HomeState, id: CatalogId): Availability {
  if (isOwned(home, id)) return { kind: 'owned' };
  const entry = catalogEntry(id);
  const needs = prerequisite(entry);
  if (needs && !isOwned(home, needs)) return { kind: 'locked', needs };
  const missing = entry.price - coinBalance(home);
  return missing > 0 ? { kind: 'short', missing } : { kind: 'available' };
}

/** Buys `id` if it is available; otherwise returns `home` unchanged. Never mutates. */
export function purchase(home: HomeState, id: CatalogId, now: Date): HomeState {
  if (availability(home, id).kind !== 'available') return home;
  return { ...home, purchases: [...home.purchases, { id, price: catalogEntry(id).price, at: now.toISOString() }] };
}

const buyable = (home: HomeState, e: CatalogEntry) => ['short', 'available'].includes(availability(home, e.id).kind);

/**
 * What to save up for: the next room or floor that can be unlocked, from the ground up (kitchen before
 * the second floor). Once every room is built, the cheapest furniture still to buy. Undefined when the home is complete.
 */
export function nextGoal(home: HomeState): CatalogEntry | undefined {
  return BUILD_ORDER.find((e) => buyable(home, e)) ?? ITEMS.filter((e) => buyable(home, e)).sort((a, b) => a.price - b.price)[0];
}

/** How many things have been bought for a room, not counting what came with it. */
export function purchasedIn(home: HomeState, room: string): number {
  return home.purchases.filter((p) => {
    const e = catalogEntry(p.id);
    return e.kind === 'item' && e.room === room;
  }).length;
}

/** Applies a change, where null means "back to the original", and drops whatever ends up unchanged. */
function merged<T extends object>(current: T | undefined, change: { [K in keyof T]?: T[K] | null }): T | undefined {
  const next: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(change)) {
    if (value === undefined) continue;
    if (value === null || value === 0) delete next[key];
    else next[key] = value;
  }
  return Object.keys(next).length ? (next as T) : undefined;
}

function withEntry<K extends string, V>(map: Partial<Record<K, V>>, key: K, value: V | undefined): Partial<Record<K, V>> {
  const { [key]: _old, ...rest } = map;
  return (value === undefined ? rest : { ...rest, [key]: value }) as Partial<Record<K, V>>;
}

export type ItemChange = { dx?: number | null; dy?: number | null; color?: Paint | null; stored?: true | null; flip?: true | null };

/**
 * Moves or repaints a piece of furniture you own. Free, as often as you like. `dx` and `dy` are rounded to whole units;
 * the caller keeps it inside the room. Does nothing for furniture you don't own.
 */
export function decorateItem(home: HomeState, id: ItemId, change: ItemChange): HomeState {
  if (!isOwned(home, id)) return home;
  if ([change.dx, change.dy].some((d) => typeof d === 'number' && !Number.isFinite(d))) return home;
  const round = (d: number | null | undefined) => (typeof d === 'number' ? Math.round(d) : d);
  const rounded = { ...change, ...('dx' in change ? { dx: round(change.dx) } : {}), ...('dy' in change ? { dy: round(change.dy) } : {}) };
  const items = withEntry(home.decor.items, id, merged(home.decor.items[id], rounded));
  return { ...home, decor: { ...home.decor, items } };
}

/** Repaints the walls or changes the floor of a room you own. Free. Not outdoors: the garden has neither. */
export function decorateRoom(home: HomeState, id: RoomId, change: { wall?: WallPaint | null; floor?: FloorStyle | null }): HomeState {
  const entry = catalogEntry(id);
  if (!isOwned(home, id) || (entry.kind === 'room' && entry.outdoor)) return home;
  const rooms = withEntry(home.decor.rooms, id, merged(home.decor.rooms[id], change));
  return { ...home, decor: { ...home.decor, rooms } };
}
