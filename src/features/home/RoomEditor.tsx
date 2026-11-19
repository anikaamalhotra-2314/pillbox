import { useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, View, type GestureResponderEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, pillColors, radius, scene, space, type TimeOfDay } from '@/design-system/tokens';
import { catalogEntry, FLOOR_STYLES, PAINTS, ROOMS, type FloorStyle, type ItemId, type Paint, type RoomId } from '@/domain/home-catalog';
import { usePillbox } from '@/store/pillbox';
import { ITEM_ART } from './art/items';
import { FrameClock } from './art/primitives';
import { DEFAULT_FLOOR, defaultWall, Floor, ROOM_HEIGHT, ROOM_WIDTH, WALL_HEIGHT } from './art/rooms';
import { clampSlide, movableIn, offsetOf, pieceAt } from './placement';
import { RoomContents } from './RoomContents';
import { SwatchRow, type SwatchOption } from './SwatchRow';

/** How far one press of ← or → slides a piece, in scene units. */
const NUDGE = 8;

type Props = {
  roomId: RoomId;
  /** Selected when the editor opens, as after buying it. */
  initialItem?: ItemId;
  timeOfDay: TimeOfDay;
  animate: boolean;
};

/**
 * One room, up close. Drag a piece sideways to move it (or select it and use the arrow buttons), and choose
 * colors for furniture, walls and floor. Everything is saved as it changes, and it's all free.
 */
export function RoomEditor({ roomId, initialItem, timeOfDay, animate }: Props) {
  const home = usePillbox((s) => s.home);
  const { decorateItem, decorateRoom } = usePillbox.getState();
  const room = ROOMS.find((r) => r.id === roomId)!;
  const roomWidth = ROOM_WIDTH[room.side];
  const look = scene.time[timeOfDay];

  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<ItemId | null>(initialItem ?? null);
  const [draft, setDraft] = useState<{ id: ItemId; dx: number } | null>(null);
  const k = width / roomWidth;
  const movable = movableIn(home, roomId);

  // The drag in progress. Handlers below are recreated on each render, so they see the latest `home` and `k`;
  // this only carries what the gesture started with.
  const drag = useRef({ id: null as ItemId | null, start: 0, startX: 0, origin: { x: 0, y: 0 } });
  const preview = useRef<View>(null);

  const responder = {
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const d = drag.current;
      const x = (e.nativeEvent.pageX - d.origin.x) / k;
      const y = (e.nativeEvent.pageY - d.origin.y) / k;
      d.id = pieceAt(home, roomId, x, y) ?? null;
      d.startX = e.nativeEvent.pageX;
      if (!d.id) return;
      d.start = offsetOf(home, d.id);
      setSelected(d.id);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const d = drag.current;
      if (d.id) setDraft({ id: d.id, dx: clampSlide(d.id, d.start + (e.nativeEvent.pageX - d.startX) / k) });
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      const d = drag.current;
      const moved = e.nativeEvent.pageX - d.startX;
      if (d.id && Math.abs(moved) > 1) decorateItem(d.id, { dx: clampSlide(d.id, d.start + moved / k) || null });
      d.id = null;
      setDraft(null);
    },
    onResponderTerminate: () => {
      drag.current.id = null;
      setDraft(null);
    },
  };

  const measure = () => preview.current?.measureInWindow((x, y) => { drag.current.origin = { x, y }; });

  const nudge = (id: ItemId, by: number) => {
    const dx = clampSlide(id, offsetOf(home, id) + by);
    decorateItem(id, { dx: dx || null });
    if (dx === offsetOf(home, id)) AccessibilityInfo.announceForAccessibility(`${catalogEntry(id).name} is against the wall`);
  };

  const art = selected ? ITEM_ART[selected] : undefined;
  const box = art && selected ? { x: art.box[0] + offsetOf(home, selected, draft ?? undefined), y: art.box[1], w: art.box[2], h: art.box[3] } : undefined;
  const paints: SwatchOption<Paint>[] = PAINTS.map((p) => ({ id: p.id, label: p.name, fill: pillColors[p.id].fill }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: space[5], paddingBottom: space[3] }} onLayout={(e) => setWidth(e.nativeEvent.layout.width - space[5] * 2)}>
        {width > 0 && (
          <View
            ref={preview}
            onLayout={measure}
            {...responder}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`The ${room.name.toLowerCase()}. Drag furniture sideways to move it, or use the buttons below.`}
            style={{ width, height: ROOM_HEIGHT * k, borderWidth: borderWidth.default, borderColor: color.border.strong }}
            onTouchStart={measure}
          >
            <FrameClock running={animate}>
              <Svg width={width} height={ROOM_HEIGHT * k} viewBox={`0 0 ${roomWidth} ${ROOM_HEIGHT}`}>
                <RoomContents home={home} roomId={roomId} look={look} draft={draft ?? undefined} />
                {box && <Rect x={box.x - 2} y={box.y - 2} width={box.w + 4} height={box.h + 4} fill="none" stroke={scene.ink} strokeWidth={1} strokeDasharray="3 2" />}
              </Svg>
            </FrameClock>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space[5], paddingBottom: space[8], gap: space[5] }}>
        <View style={{ gap: space[3] }}>
          <Text variant="title" accessibilityRole="header">Furniture</Text>
          {movable.length === 0 ? (
            <Text variant="subheading" tone="placeholder">Nothing here yet. Furniture you buy for this room shows up here.</Text>
          ) : (
            <View role="radiogroup" accessibilityLabel="Furniture" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {movable.map((id) => {
                const on = id === selected;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setSelected(id)}
                    role="radio"
                    aria-checked={on}
                    accessibilityLabel={catalogEntry(id).name}
                    style={{
                      minHeight: 44, justifyContent: 'center', paddingHorizontal: space[3], borderRadius: radius.card,
                      borderWidth: borderWidth.default, borderColor: color.border.strong, backgroundColor: on ? color.border.strong : 'transparent',
                    }}
                  >
                    <Text variant="subheading" style={on ? { color: color.surface.page } : undefined}>{catalogEntry(id).name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {selected && movable.includes(selected) && (
            <View style={{ gap: space[4], padding: space[4], borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card }}>
              <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'center', flexWrap: 'wrap' }}>
                <Text variant="subheading" style={{ marginRight: space[2] }}>Move</Text>
                <Button label="←" accessibilityLabel={`Move ${catalogEntry(selected).name} left`} onPress={() => nudge(selected, -NUDGE)} />
                <Button label="→" accessibilityLabel={`Move ${catalogEntry(selected).name} right`} onPress={() => nudge(selected, NUDGE)} />
                <Button label="Reset" accessibilityLabel={`Put ${catalogEntry(selected).name} back where it came`} onPress={() => decorateItem(selected, { dx: null })} />
              </View>
              {ITEM_ART[selected].tint ? (
                <SwatchRow
                  title="Color"
                  options={[{ id: null, label: 'Original', fill: ITEM_ART[selected].tint!.fill }, ...paints]}
                  value={home.decor.items[selected]?.color ?? null}
                  onChange={(c) => decorateItem(selected, { color: c })}
                />
              ) : (
                <Text variant="subheading" tone="placeholder">{`${catalogEntry(selected).name} comes in one color.`}</Text>
              )}
            </View>
          )}
        </View>

        {/* Outdoors there are no walls or floor to change. */}
        {!room.outdoor && (
          <>
        <View style={{ gap: space[3] }}>
          <Text variant="title" accessibilityRole="header">Walls</Text>
          <SwatchRow
            title="Paint"
            options={[{ id: null, label: 'Original', fill: defaultWall(roomId, look) }, ...paints]}
            value={home.decor.rooms[roomId]?.wall ?? null}
            onChange={(wall) => decorateRoom(roomId, { wall })}
          />
        </View>

        <View style={{ gap: space[3] }}>
          <Text variant="title" accessibilityRole="header">Floor</Text>
          <SwatchRow<FloorStyle>
            title="Floor"
            options={[
              { id: null, label: `Original (${FLOOR_STYLES.find((f) => f.id === DEFAULT_FLOOR[roomId])!.name.toLowerCase()})`, preview: <FloorSample style={DEFAULT_FLOOR[roomId]} /> },
              ...FLOOR_STYLES.map((f) => ({ id: f.id, label: f.name, preview: <FloorSample style={f.id} /> })),
            ]}
            value={home.decor.rooms[roomId]?.floor ?? null}
            onChange={(floor) => decorateRoom(roomId, { floor })}
          />
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FloorSample({ style }: { style: FloorStyle }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox={`0 ${WALL_HEIGHT + 1} 40 ${ROOM_HEIGHT - WALL_HEIGHT - 1}`} preserveAspectRatio="xMidYMid slice">
        <Floor w={40} style={style} />
      </Svg>
    </View>
  );
}

function Button({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[3], borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card }}
    >
      <Text variant="title">{label}</Text>
    </Pressable>
  );
}
