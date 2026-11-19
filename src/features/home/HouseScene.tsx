import { useMemo, useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, radius, scene, space, type TimeOfDay } from '@/design-system/tokens';
import { isOwned, type HomeState } from '@/domain/home';
import { catalogEntry, type CatalogId, type RoomId } from '@/domain/home-catalog';
import { Block, FrameClock, Twinkle, type Look } from './art/primitives';
import { Floor, ROOM_HEIGHT, RoomShell, WALL_HEIGHT } from './art/rooms';
import { describeHome } from './describe';
import {
  BEAM, CEILING, DOOR_HEIGHT, FLOOR_HEIGHT, GHOST_HEIGHT, HOUSE_LEFT, layoutHouse, ROOM_X, SCENE_WIDTH, STAIRWELL, WALL,
  walkTarget, wanderSpan, type HouseLayout, type PlacedFloor,
} from './layout';
import { CatRoamer } from './CatRoamer';
import { offsetOf } from './placement';
import { RoomContents } from './RoomContents';
import { Walker } from './Walker';
import { STAIR_FOOT_X, STAIR_HEAD_X, type Spot } from './walk';

// Fixed, so the night sky doesn't reshuffle on every render.
const STARS = [[362, 40], [431, 53], [462, 26], [488, 62], [379, 15], [20, 47], [69, 25], [274, 39], [223, 57], [147, 9], [96, 17], [523, 28], [326, 60], [180, 44], [590, 22], [655, 48], [712, 30], [760, 58], [845, 20], [820, 44]];
const SPECKS = Array.from({ length: 24 }, (_, i) => [(i * 137) % SCENE_WIDTH, 12 + ((i * 53) % 44)]);
/** Where the cat naps on the sofa, in living-room units, before the sofa is moved. */
const SOFA_SEAT = { x: 206, y: 156 };
/** Where you are when the app opens: the middle of the living room. */
const START: Spot = { x: ROOM_X.left + 100, level: 0 };

type Props = {
  home: HomeState;
  timeOfDay: TimeOfDay;
  userName: string;
  /** Points on screen per scene unit. */
  scale: number;
  /** Animate. False for reduce motion or when the screen is hidden. */
  animate: boolean;
  /** A locked room or the next floor was tapped. */
  onLockedPress: (id: CatalogId) => void;
  /** A room's Decorate button was tapped. */
  onDecorate: (id: RoomId) => void;
};

/**
 * A cutaway of the home: built floors with their rooms and furniture, a stairwell on the left joining the
 * floors, and the next floor outlined on top. Tap anywhere on a floor and the person walks there.
 */
export function HouseScene({ home, timeOfDay, userName, scale, animate, onLockedPress, onDecorate }: Props) {
  const layout = useMemo(() => layoutHouse(home), [home]);
  const [target, setTarget] = useState<Spot | null>(null);
  const k = scale;
  const width = SCENE_WIDTH * k;
  const look = scene.time[timeOfDay];
  const label = describeHome(home, userName);
  const levels = layout.floors.map((f) => f.floor.level);
  const living = layout.rooms.find((r) => r.room.id === 'living');

  // The tap's position across the scene. `locationX` isn't reliable on web, so measure the scene and use the
  // tap's page position instead, which works the same on iOS and web.
  const sceneRef = useRef<View>(null);
  const walkHere = (level: number) => (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    sceneRef.current?.measureInWindow((originX) => {
      if (Number.isFinite(pageX)) setTarget(walkTarget(layout, level, (pageX - originX) / k));
    });
  };

  const drawing = (
    <Svg width={width} height={layout.height * k} viewBox={`0 0 ${SCENE_WIDTH} ${layout.height}`}>
      <Rect x={0} y={0} width={SCENE_WIDTH} height={layout.height} fill={look.sky} />
      {look.stars > 0 && STARS.map(([x, y], i) => <Twinkle key={i} x={x} y={y} phase={i} />)}
      <Ellipse cx={800} cy={36} rx={9} ry={9} fill={look.moon} />
      <Topper layout={layout} />
      {layout.floors.map((f) => <FloorFrame key={f.floor.id} placed={f} look={look} />)}
      {layout.rooms.map((placed) => (
        <G key={placed.room.id} transform={`translate(${placed.x} ${placed.y})`}>
          {placed.owned
            ? <RoomContents home={home} roomId={placed.room.id} look={look} />
            : <><RoomShell id={placed.room.id} look={look} thumb={false} /><LockedVeil id={placed.room.id} width={placed.width} /></>}
        </G>
      ))}
      {/* Drawn after every floor, so each flight cuts up through the beam into the floor above. */}
      {levels.filter((l) => levels.includes(l + 1)).map((l) => <Stairs key={l} footY={layout.floorLine(l)} />)}
      {living && isOwned(home, 'cat') && (
        <CatRoamer
          animate={animate}
          span={[living.x + 20, living.x + living.width - 24]}
          floorY={living.y + 184}
          sofa={isOwned(home, 'sofa') ? { x: living.x + SOFA_SEAT.x + offsetOf(home, 'sofa'), y: living.y + SOFA_SEAT.y } : undefined}
        />
      )}
      <Walker
        target={target}
        animate={animate}
        start={START}
        floorLine={layout.floorLine}
        floorHeight={FLOOR_HEIGHT}
        wanderSpan={(spot) => wanderSpan(layout, spot)}
      />
      <Ground y={layout.groundY} />
    </Svg>
  );

  return (
    <View ref={sceneRef} style={{ width, height: layout.height * k }}>
      <View accessible accessibilityRole="image" accessibilityLabel={label}>
        <FrameClock running={animate}>{drawing}</FrameClock>
      </View>

      {/* Tap targets: each stairwell and each room you own sends the person walking there. */}
      {layout.floors.map(({ floor, y }) => (
        <Pressable
          key={`stairs-${floor.id}`}
          onPress={walkHere(floor.level)}
          accessibilityRole="button"
          accessibilityLabel={`Walk to the stairs, ${floor.name.toLowerCase()}`}
          style={{ position: 'absolute', left: STAIRWELL.x * k, top: (y + CEILING) * k, width: STAIRWELL.width * k, height: ROOM_HEIGHT * k }}
        />
      ))}
      {layout.rooms.filter((r) => r.owned).map((r) => (
        <Pressable
          key={`walk-${r.room.id}`}
          onPress={walkHere(r.level)}
          accessibilityRole="button"
          accessibilityLabel={`Walk to the ${r.room.name.toLowerCase()}`}
          style={{ position: 'absolute', left: r.x * k, top: r.y * k, width: r.width * k, height: ROOM_HEIGHT * k }}
        />
      ))}
      {layout.rooms.filter((r) => r.owned).map((r) => (
        <View key={`decorate-${r.room.id}`} style={{ position: 'absolute', left: (r.x + 4) * k, top: (r.y + 4) * k }}>
          <Pressable
            onPress={() => onDecorate(r.room.id)}
            accessibilityRole="button"
            accessibilityLabel={`Decorate the ${r.room.name.toLowerCase()}`}
            hitSlop={4}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <View style={chipFace}><Text variant="subheading">Decorate</Text></View>
          </Pressable>
        </View>
      ))}
      {layout.rooms.filter((r) => !r.owned).map((r) => (
        <LockChip key={r.room.id} id={r.room.id} left={(r.x + r.width / 2) * k} top={(r.y + 80) * k} onPress={onLockedPress} />
      ))}
      {layout.ghost && (
        // Toward the left, so it's in view before any scrolling.
        <LockChip id={layout.ghost.floor.id} left={GHOST_CHIP_X * k} top={(layout.ghost.y + GHOST_HEIGHT / 2) * k} onPress={onLockedPress} />
      )}
    </View>
  );
}

const chipFace = {
  paddingHorizontal: space[2], paddingVertical: 2,
  backgroundColor: color.surface.page, borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card,
} as const;

/**
 * One floor's frame: ceiling strip, outer walls, the stairwell, the inner walls with their doorways (and a back
 * door out to the garden), and the beam underneath. The rooms are drawn on top of it.
 */
function FloorFrame({ placed, look }: { placed: PlacedFloor; look: Look }) {
  const ink = scene.ink;
  const { y, right, innerWalls, backDoor } = placed;
  const top = y + CEILING;
  const floorY = top + ROOM_HEIGHT;
  return (
    <>
      <Block x={HOUSE_LEFT} y={y} w={right - HOUSE_LEFT} h={CEILING} fill={scene.peach} shade={scene.brick} />
      <Rect x={HOUSE_LEFT} y={top} width={WALL} height={ROOM_HEIGHT} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />
      {/* The stairwell: a plain wall and a floor of its own */}
      <G transform={`translate(${STAIRWELL.x} ${top})`}>
        <Rect x={0} y={0} width={STAIRWELL.width} height={WALL_HEIGHT} fill={look.wallAlt} />
        <Floor w={STAIRWELL.width} style="honey" />
      </G>
      {innerWalls.map((x) => <Doorway key={x} x={x} top={top} floorY={floorY} />)}
      {backDoor
        ? <Doorway x={right - WALL} top={top} floorY={floorY} />
        : <Rect x={right - WALL} y={top} width={WALL} height={ROOM_HEIGHT} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />}
      <Rect x={HOUSE_LEFT} y={floorY} width={right - HOUSE_LEFT} height={BEAM} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />
      {Array.from({ length: Math.floor((right - 40) / 60) + 1 }, (_, i) => 40 + i * 60).map((x) => (
        <Line key={x} x1={x} y1={floorY} x2={x} y2={floorY + BEAM} stroke={scene.brick} strokeWidth={0.6} />
      ))}
    </>
  );
}

/** An inner wall, seen end-on, with an open doorway at the bottom: the wall above, a lintel, and the door swung back. */
function Doorway({ x, top, floorY }: { x: number; top: number; floorY: number }) {
  const ink = scene.ink;
  const lintel = floorY - DOOR_HEIGHT;
  return (
    <>
      <Rect x={x} y={top} width={WALL} height={lintel - top} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />
      <Rect x={x - 3} y={lintel - 4} width={WALL + 6} height={4} fill={scene.wood} stroke={ink} strokeWidth={1} />
      {/* The open door, folded flat against the wall on the right */}
      <Polygon points={`${x + WALL},${lintel} ${x + WALL + 6},${lintel + 4} ${x + WALL + 6},${floorY - 2} ${x + WALL},${floorY}`} fill={scene.wood} stroke={ink} strokeWidth={0.8} />
      <Rect x={x + WALL + 3} y={lintel + DOOR_HEIGHT / 2} width={1.6} height={3} fill={scene.glow} />
    </>
  );
}

/** One flight of stairs, from the foot of a stairwell up into the floor above. */
function Stairs({ footY }: { footY: number }) {
  const steps = 12;
  const run = (STAIR_HEAD_X - STAIR_FOOT_X + 12) / steps;
  const rise = FLOOR_HEIGHT / steps;
  const startX = STAIR_FOOT_X - 6;
  const points: string[] = [`${startX},${footY}`];
  for (let i = 0; i < steps; i++) {
    const x = startX + i * run;
    const yTop = footY - (i + 1) * rise;
    points.push(`${x},${yTop}`, `${x + run},${yTop}`);
  }
  const endX = startX + steps * run;
  points.push(`${endX},${footY}`);
  return (
    <>
      <Polygon points={points.join(' ')} fill={scene.peachDeep} stroke={scene.ink} strokeWidth={1} strokeLinejoin="round" />
      <Line x1={startX} y1={footY - 34} x2={endX} y2={footY - FLOOR_HEIGHT - 34} stroke={scene.woodDark} strokeWidth={1.4} />
    </>
  );
}

/** A dashed outline of the next floor, or the finished roof with a chimney over the attic. */
function Topper({ layout }: { layout: HouseLayout }) {
  const ink = scene.ink;
  if (layout.ghost) {
    const { y, right } = layout.ghost;
    const w = right - HOUSE_LEFT - 2 * WALL;
    return (
      <>
        <Rect x={HOUSE_LEFT + WALL} y={y} width={w} height={GHOST_HEIGHT} fill={scene.slate} opacity={0.18} />
        <Rect x={HOUSE_LEFT + WALL} y={y} width={w} height={GHOST_HEIGHT} fill="none" stroke={ink} strokeWidth={1} strokeDasharray="4 3" />
      </>
    );
  }
  const top = layout.roofY!;
  const base = top + 80;
  const left = HOUSE_LEFT - 8;
  const right = layout.floors[0].right + 8;
  const mid = (left + right) / 2;
  return (
    <>
      <Rect x={mid + 130} y={top + 10} width={22} height={40} fill={scene.brick} stroke={ink} strokeWidth={1} />
      <Rect x={mid + 126} y={top + 6} width={30} height={6} fill={scene.peachDeep} stroke={ink} strokeWidth={1} />
      <Polygon points={`${left},${base} ${mid},${top + 4} ${right},${base}`} fill={scene.peachDeep} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      {[0.35, 0.6, 0.85].map((t) => (
        <Line key={t} x1={mid - (mid - left) * t} y1={top + 4 + 76 * t} x2={mid + (right - mid) * t} y2={top + 4 + 76 * t} stroke={scene.brick} strokeWidth={0.8} />
      ))}
    </>
  );
}

/** Greyed and hatched: a room on a built floor that hasn't been bought yet. */
function LockedVeil({ id, width }: { id: string; width: number }) {
  const clip = `veil-${id}`;
  const lines = Array.from({ length: Math.ceil((width + ROOM_HEIGHT) / 10) }, (_, i) => i * 10);
  return (
    <>
      <Rect x={0} y={0} width={width} height={ROOM_HEIGHT} fill={scene.slate} opacity={0.62} />
      <Defs>
        <ClipPath id={clip}>
          <Rect x={0} y={0} width={width} height={ROOM_HEIGHT} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clip})`}>
        {lines.map((x) => <Line key={x} x1={x} y1={0} x2={x - ROOM_HEIGHT} y2={ROOM_HEIGHT} stroke={scene.ink} strokeWidth={0.5} opacity={0.15} />)}
      </G>
    </>
  );
}

function Ground({ y }: { y: number }) {
  return (
    <>
      <Rect x={0} y={y} width={SCENE_WIDTH} height={6} fill={scene.leaf} />
      <Line x1={0} y1={y} x2={SCENE_WIDTH} y2={y} stroke={scene.ink} strokeWidth={1} />
      <Rect x={0} y={y + 6} width={SCENE_WIDTH} height={200} fill={scene.peachDeep} />
      {SPECKS.map(([x, dy], i) => <Rect key={i} x={x} y={y + 7 + (dy % 6)} width={2} height={1.5} fill={scene.brick} />)}
    </>
  );
}

const CHIP_BOX = 200;
const GHOST_CHIP_X = 130;

/** A tappable label over something locked: its name and price, opening the shop. */
function LockChip({ id, left, top, onPress }: { id: CatalogId; left: number; top: number; onPress: (id: CatalogId) => void }) {
  const entry = catalogEntry(id);
  return (
    // Centred on (left, top) by a fixed box that lets taps around the chip through to the scroll view.
    <View pointerEvents="box-none" style={{ position: 'absolute', left: left - CHIP_BOX / 2, top: top - CHIP_BOX / 4, width: CHIP_BOX, height: CHIP_BOX / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        onPress={() => onPress(id)}
        accessibilityRole="button"
        accessibilityLabel={`${entry.name}, locked, ${entry.price} coins`}
        accessibilityHint="Opens the shop"
        style={{
          minHeight: 44, minWidth: 44, flexDirection: 'row', alignItems: 'center', gap: space[2],
          paddingHorizontal: space[3], paddingVertical: space[1],
          backgroundColor: color.surface.page, borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card,
        }}
      >
        <LockIcon />
        <View>
          <Text variant="subheading">{entry.name}</Text>
          <Text variant="subheading" accent>{`${entry.price} coins`}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function LockIcon() {
  return (
    <View aria-hidden>
      <Svg width={14} height={18} viewBox="-1 -1 11 13">
        <Rect x={0} y={4} width={9} height={7} fill={scene.cream} stroke={scene.ink} strokeWidth={1} />
        <Path d="M2 4 v-2 a2.5 2.5 0 0 1 5 0 v2" fill="none" stroke={scene.ink} strokeWidth={1} />
      </Svg>
    </View>
  );
}
