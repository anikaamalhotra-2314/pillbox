import { useRef, useState } from 'react';
import { AccessibilityInfo, Platform, ScrollView, View, type GestureResponderEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, pillColors, radius, scene, space, type TimeOfDay } from '@/design-system/tokens';
import { catalogEntry, FLOOR_STYLES, PAINTS, ROOMS, WALL_PAINTS, type FloorStyle, type ItemId, type Paint, type RoomId, type WallPaint } from '@/domain/home-catalog';
import { usePillbox } from '@/store/pillbox';
import { ITEM_ART } from './art/items';
import { FrameClock } from './art/primitives';
import { DEFAULT_FLOOR, defaultWall, Floor, hasFloorChoice, LivingBackdrop, wallPaintOf, ROOM_HEIGHT, ROOM_WIDTH, WALL_HEIGHT } from './art/rooms';
import { SpiralStairs } from './art/stairs';
import { stairwell } from './art/sprites/stairwell';
import { STAIRWELL } from './layout';
import { clampMove, movableIn, movesUpAndDown, offsetOf, pieceAt, roomStart, standsOnFloor, storedIn, type Draft, type Offset } from './placement';
import { RoomContents } from './RoomContents';
import { SwatchRow, type SwatchOption } from './SwatchRow';

/** How far one screen reader swipe or arrow key moves a piece, in scene units. */
const NUDGE = 8;

type Props = {
  roomId: RoomId;
  /** Selected when the editor opens, as after buying it. */
  initialItem?: ItemId;
  timeOfDay: TimeOfDay;
  animate: boolean;
};

/**
 * One room, up close. Drag a piece to move it: sideways, and forward or back if it stands on the floor (screen
 * readers: select it, then swipe up or down on the room to slide it, or use the actions to move it forward or
 * back), and choose colors for furniture, walls and floor. Everything is saved as it changes, and it's all free.
 */
export function RoomEditor({ roomId, initialItem, timeOfDay, animate }: Props) {
  const home = usePillbox((s) => s.home);
  const { decorateItem, decorateRoom } = usePillbox.getState();
  const room = ROOMS.find((r) => r.id === roomId)!;
  const roomWidth = ROOM_WIDTH[room.side];
  // The living room shows the stairwell beside it too, since furniture can go there.
  const start = roomStart(roomId);
  const viewWidth = roomWidth - start;
  const look = scene.time[timeOfDay];

  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<ItemId | null>(initialItem ?? null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const k = width / viewWidth;
  const movable = movableIn(home, roomId);
  const stored = storedIn(home, roomId);

  // The drag in progress. Handlers below are recreated on each render, so they see the latest `home` and `k`;
  // this only carries what the gesture started with.
  const drag = useRef({ id: null as ItemId | null, start: { dx: 0, dy: 0 } as Offset, startX: 0, startY: 0, origin: { x: 0, y: 0 } });
  const preview = useRef<View>(null);

  /** Where the piece being dragged is now: where it started, plus how far the finger has gone, kept in the room. */
  const dragged = (id: ItemId, e: GestureResponderEvent) => {
    const d = drag.current;
    return clampMove(id, { dx: d.start.dx + (e.nativeEvent.pageX - d.startX) / k, dy: d.start.dy + (e.nativeEvent.pageY - d.startY) / k });
  };

  const responder = {
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const d = drag.current;
      const x = (e.nativeEvent.pageX - d.origin.x) / k + start;
      const y = (e.nativeEvent.pageY - d.origin.y) / k;
      d.id = pieceAt(home, roomId, x, y) ?? null;
      d.startX = e.nativeEvent.pageX;
      d.startY = e.nativeEvent.pageY;
      if (!d.id) return;
      d.start = offsetOf(home, d.id);
      setSelected(d.id);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const d = drag.current;
      if (d.id) setDraft({ id: d.id, ...dragged(d.id, e) });
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      const d = drag.current;
      const moved = Math.hypot(e.nativeEvent.pageX - d.startX, e.nativeEvent.pageY - d.startY);
      if (d.id && moved > 1) {
        const { dx, dy } = dragged(d.id, e);
        decorateItem(d.id, { dx: dx || null, dy: dy || null });
      }
      d.id = null;
      setDraft(null);
    },
    onResponderTerminate: () => {
      drag.current.id = null;
      setDraft(null);
    },
  };

  const measure = () => preview.current?.measureInWindow((x, y) => { drag.current.origin = { x, y }; });

  const nudge = (id: ItemId, by: Offset) => {
    const from = offsetOf(home, id);
    const to = clampMove(id, { dx: from.dx + by.dx, dy: from.dy + by.dy });
    decorateItem(id, { dx: to.dx || null, dy: to.dy || null });
    if (to.dx !== from.dx || to.dy !== from.dy) return;
    const name = catalogEntry(id).name;
    AccessibilityInfo.announceForAccessibility(by.dx ? `${name} is against the wall` : `${name} is as far ${by.dy < 0 ? backWord : forwardWord} as it goes`);
  };
  const ARROWS: Record<string, Offset> = {
    ArrowLeft: { dx: -NUDGE, dy: 0 }, ArrowRight: { dx: NUDGE, dy: 0 }, ArrowUp: { dx: 0, dy: -NUDGE }, ArrowDown: { dx: 0, dy: NUDGE },
  };

  const art = selected ? ITEM_ART[selected] : undefined;
  const adjustable = selected && movable.includes(selected) ? selected : null;
  const deep = adjustable !== null && movesUpAndDown(adjustable);
  // Standing pieces go back and forward on the floor; hung ones go up and down the wall.
  const [backWord, forwardWord] = adjustable && !standsOnFloor(adjustable) ? ['up', 'down'] : ['back', 'forward'];

  // On the web, the room takes focus and the arrow keys move the selected piece (↑ ↓ only for standing pieces). `onKeyDown` is supported by React Native
  // Web but is not in React Native's View typings.
  const webKeyProps = Platform.OS === 'web'
    ? {
        focusable: true,
        onKeyDown: (e: { nativeEvent: { key: string }; preventDefault: () => void }) => {
          const by = ARROWS[e.nativeEvent.key];
          if (!adjustable || !by || (by.dy && !deep)) return;
          e.preventDefault();
          nudge(adjustable, by);
        },
      }
    : {};
  const at = selected ? offsetOf(home, selected, draft ?? undefined) : undefined;
  const box = art && at ? { x: art.box[0] + at.dx, y: art.box[1] + at.dy, w: art.box[2], h: art.box[3] } : undefined;
  const paints: SwatchOption<Paint>[] = PAINTS.map((p) => ({ id: p.id, label: p.name, fill: pillColors[p.id].fill }));
  const wallPaints: SwatchOption<WallPaint>[] = WALL_PAINTS.map((p) => ({ id: p.id, label: p.name, fill: scene.wallPaints[p.id] }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: space[5], paddingBottom: space[3] }} onLayout={(e) => setWidth(e.nativeEvent.layout.width - space[5] * 2)}>
        {width > 0 && (
          <View
            ref={preview}
            onLayout={measure}
            {...responder}
            accessible
            // With a piece selected, the room is adjustable: a swipe up or down slides that piece right or left, and
            // a standing piece has actions to move it forward or back.
            accessibilityRole={adjustable ? 'adjustable' : 'image'}
            accessibilityLabel={adjustable
              ? `The ${room.name.toLowerCase()}, ${catalogEntry(adjustable).name} selected. ${Platform.OS === 'web'
                ? `Use the arrow keys to move it${deep ? '' : ' left or right'}.`
                : `Swipe up or down to move it left or right${deep ? `, or use actions to move it ${backWord} or ${forwardWord}` : ''}.`}`
              : `The ${room.name.toLowerCase()}. Drag furniture to move it.`}
            {...webKeyProps}
            accessibilityActions={adjustable
              ? [{ name: 'increment' }, { name: 'decrement' }, ...(deep ? [{ name: 'back', label: `Move ${backWord}` }, { name: 'forward', label: `Move ${forwardWord}` }] : [])]
              : undefined}
            onAccessibilityAction={(e) => {
              const by = ({ increment: { dx: NUDGE, dy: 0 }, decrement: { dx: -NUDGE, dy: 0 }, back: { dx: 0, dy: -NUDGE }, forward: { dx: 0, dy: NUDGE } } as Record<string, Offset>)[e.nativeEvent.actionName];
              if (adjustable && by) nudge(adjustable, by);
            }}
            style={{ width, height: ROOM_HEIGHT * k, borderWidth: borderWidth.default, borderColor: color.border.strong }}
            onTouchStart={measure}
          >
            <FrameClock running={animate}>
              <Svg width={width} height={ROOM_HEIGHT * k} viewBox={`${start} 0 ${viewWidth} ${ROOM_HEIGHT}`}>
                {start < 0 && <LivingBackdrop sprite={stairwell} x={start} y={0} wall={wallPaintOf(home.decor.rooms[roomId])} look={look} />}
                <RoomContents home={home} roomId={roomId} look={look} draft={draft ?? undefined} />
                {start < 0 && <SpiralStairs cx={start + STAIRWELL.width / 2} footY={ROOM_HEIGHT} topY={0} />}
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
              <View style={{ flexDirection: 'row', gap: space[3], alignItems: 'center' }}>
                <Text variant="subheading" tone="placeholder" style={{ flex: 1 }}>{`Drag the ${catalogEntry(selected).name.toLowerCase()} to move it.`}</Text>
                <Button label="Reset" accessibilityLabel={`Put ${catalogEntry(selected).name} back where it came`} onPress={() => decorateItem(selected, { dx: null, dy: null })} />
                {ITEM_ART[selected].flips && (
                  <Button
                    label="Flip"
                    accessibilityLabel={`Turn ${catalogEntry(selected).name} to face the other way`}
                    onPress={() => decorateItem(selected, { flip: home.decor.items[selected]?.flip ? null : true })}
                  />
                )}
                <Button
                  label="Put away"
                  accessibilityLabel={`Put ${catalogEntry(selected).name} away`}
                  onPress={() => {
                    decorateItem(selected, { stored: true });
                    setSelected(null);
                    AccessibilityInfo.announceForAccessibility(`${catalogEntry(selected).name} put away`);
                  }}
                />
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

        {stored.length > 0 && (
          <View style={{ gap: space[3] }}>
            <Text variant="title" accessibilityRole="header">Put away</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {stored.map((id) => (
                <Button
                  key={id}
                  label={catalogEntry(id).name}
                  accessibilityLabel={`Bring out ${catalogEntry(id).name}`}
                  onPress={() => {
                    decorateItem(id, { stored: null });
                    setSelected(id);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Outdoors there are no walls or floor to change. */}
        {!room.outdoor && (
          <>
        <View style={{ gap: space[3] }}>
          <Text variant="title" accessibilityRole="header">Walls</Text>
          <SwatchRow
            title="Paint"
            options={[{ id: null, label: 'Original', fill: defaultWall(roomId, look) }, ...wallPaints]}
            value={home.decor.rooms[roomId]?.wall ?? null}
            onChange={(wall) => decorateRoom(roomId, { wall })}
          />
        </View>

        {/* A floor that's part of the room's drawing (the living room) can't be swapped. */}
        {hasFloorChoice(roomId) && (
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
        )}
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
