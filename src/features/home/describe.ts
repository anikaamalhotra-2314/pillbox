import { isOwned, type HomeState } from '@/domain/home';
import { FLOORS, itemsIn, roomsOn } from '@/domain/home-catalog';

/** The home in words, for screen readers: what each built room holds, what's locked, and the next floor. */
export function describeHome(home: HomeState, userName: string): string {
  const parts: string[] = [];
  for (const floor of FLOORS) {
    if (!isOwned(home, floor.id)) {
      parts.push(`${floor.name}: not built yet`);
      break;
    }
    for (const room of roomsOn(floor.id)) {
      if (!isOwned(home, room.id)) {
        parts.push(`${room.name}: locked`);
        continue;
      }
      const items = itemsIn(room.id).filter((i) => isOwned(home, i.id)).map((i) => i.name.toLowerCase());
      parts.push(`${room.name}: ${items.length ? items.join(', ') : 'empty'}`);
    }
  }
  return `${userName}’s home. ${parts.join('. ')}.`;
}
