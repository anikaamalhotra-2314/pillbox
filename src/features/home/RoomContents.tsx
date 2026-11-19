import { G } from 'react-native-svg';

import { pillColors } from '@/design-system/tokens';
import { isOwned, purchasedIn, type HomeState } from '@/domain/home';
import type { ItemId, RoomId } from '@/domain/home-catalog';
import { MovingBoxes } from './art/characters';
import { ITEM_ART, type Tint } from './art/items';
import type { Look } from './art/primitives';
import { RoomShell } from './art/rooms';
import { offsetOf, ownedIn } from './placement';

/** The living room stays half-packed until this many things have been bought for it. */
const UNPACKED_AFTER = 3;
const FALLBACK_TINT: Tint = { fill: pillColors.periwinkle.fill, shade: pillColors.periwinkle.shade };

/** The colors a piece is drawn in: the paint chosen for it, or the ones it came in. */
export function tintOf(home: HomeState, id: ItemId): Tint {
  const paint = home.decor.items[id]?.color;
  return paint ? pillColors[paint] : (ITEM_ART[id].tint ?? FALLBACK_TINT);
}

/** One room as decorated: its walls and floor, then each piece you own where you put it. In room-local units. */
export function RoomContents({ home, roomId, look, draft }: { home: HomeState; roomId: RoomId; look: Look; draft?: { id: ItemId; dx: number } }) {
  const owns = (id: ItemId) => isOwned(home, id);
  return (
    <>
      <RoomShell id={roomId} decor={home.decor.rooms[roomId]} look={look} thumb={false} />
      {roomId === 'living' && purchasedIn(home, 'living') < UNPACKED_AFTER && <MovingBoxes />}
      {ownedIn(home, roomId).map((id) => (
        <G key={id} transform={`translate(${offsetOf(home, id, draft)} 0)`}>
          {ITEM_ART[id].draw({ look, thumb: false, owns, tint: tintOf(home, id) })}
        </G>
      ))}
    </>
  );
}
