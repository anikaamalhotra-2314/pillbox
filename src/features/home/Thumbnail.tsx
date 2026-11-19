import { View } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { scene, type TimeOfDay } from '@/design-system/tokens';
import { catalogEntry, ROOM_SIDES, roomsOn, type CatalogId } from '@/domain/home-catalog';
import { ITEM_ART } from './art/items';
import { ROOM_HEIGHT, ROOM_WIDTH, RoomShell } from './art/rooms';

const PAD = 4;
const GAP = 6;

/**
 * The same drawing the home uses, cropped to one piece of furniture, one room, or a floor's two rooms.
 * Decorative: the shop card's text carries the meaning.
 */
export function Thumbnail({ id, timeOfDay, height }: { id: CatalogId; timeOfDay: TimeOfDay; height: number }) {
  const look = scene.time[timeOfDay];
  const ctx = { look, thumb: true, owns: () => false };
  const entry = catalogEntry(id);

  let viewBox: [number, number, number, number];
  let body;
  if (entry.kind === 'item') {
    const [x, y, w, h] = ITEM_ART[entry.id].box;
    viewBox = [x - PAD, y - PAD, w + PAD * 2, h + PAD * 2];
    body = ITEM_ART[entry.id].draw({ ...ctx, tint: ITEM_ART[entry.id].tint ?? { fill: scene.periwinkle, shade: scene.periwinkleDeep } });
  } else if (entry.kind === 'room') {
    viewBox = [0, 0, ROOM_WIDTH[entry.side], ROOM_HEIGHT];
    body = <RoomShell id={entry.id} {...ctx} />;
  } else {
    // A floor: its indoor rooms side by side.
    const rooms = ROOM_SIDES.flatMap((side) => roomsOn(entry.id).filter((r) => r.side === side && !r.outdoor));
    const xs = rooms.map((_, i) => rooms.slice(0, i).reduce((sum, r) => sum + ROOM_WIDTH[r.side] + GAP, 0));
    viewBox = [0, 0, xs.at(-1)! + ROOM_WIDTH[rooms.at(-1)!.side], ROOM_HEIGHT];
    body = (
      <>
        {rooms.map((r, i) => <G key={r.id} transform={`translate(${xs[i]} 0)`}><RoomShell id={r.id} {...ctx} /></G>)}
      </>
    );
  }

  const width = Math.min(height * (viewBox[2] / viewBox[3]), height * 2.6);
  return (
    <View aria-hidden style={{ width, height }}>
      <Svg width={width} height={height} viewBox={viewBox.join(' ')} preserveAspectRatio="xMidYMid meet">{body}</Svg>
    </View>
  );
}
