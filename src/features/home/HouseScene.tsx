import { useMemo, useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { PixelSprite } from '@/design-system/icons/PixelArt';
import { Pressable } from '@/design-system/primitives/Pressable';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, radius, scene, space, type TimeOfDay } from '@/design-system/tokens';
import { avatarOf } from '@/domain/avatar';
import { isPlaced, type HomeState } from '@/domain/home';
import { catalogEntry, FLOORS, ROOMS, type CatalogId, type FloorId, type RoomId } from '@/domain/home-catalog';
import { FrameClock, Twinkle, type Look } from './art/primitives';
import { SOFA_LIFT } from './art/items';
import { PixelBeam, PixelGround, PixelPost } from './art/frame';
import { SpiralStairs } from './art/stairs';
import { doorway } from './art/sprites/doorway';
import { stairwell } from './art/sprites/stairwell';
import { LivingBackdrop, ROOM_HEIGHT, ROOM_WIDTH, RoomShell, wallPaintOf } from './art/rooms';
import { describeHome } from './describe';
import {
  BEAM, CEILING, DOOR_HEIGHT, FLOOR_HEIGHT, GHOST_HEIGHT, GROUND, HOUSE_LEFT, layoutHouse, ROOM_X, SCENE_WIDTH, STAIRWELL, WALL,
  walkTarget, wanderAnywhere, wanderSpan, type HouseLayout, type PlacedFloor,
} from './layout';
import { CatRoamer } from './CatRoamer';
import { offsetOf } from './placement';
import { RoomContents } from './RoomContents';
import { Walker } from './Walker';
import type { Spot } from './walk';

// Fixed, so the night sky doesn't reshuffle on every render.
const STARS = [[362, 40], [431, 53], [462, 26], [488, 62], [379, 15], [20, 47], [69, 25], [274, 39], [223, 57], [147, 9], [96, 17], [523, 28], [326, 60], [180, 44], [590, 22], [655, 48], [712, 30], [760, 58], [845, 20], [820, 44]];
/** Where the greenhouse is, so its ceiling can be glass. */
const GREENHOUSE = (() => {
  const room = ROOMS.find((r) => r.id === 'greenhouse')!;
  return { floor: room.floor, x: ROOM_X[room.side], width: ROOM_WIDTH[room.side] };
})();
/** The highest floor there is (the attic). */
const TOP_LEVEL = Math.max(...FLOORS.map((f) => f.level));
/** The wide room on the left of a floor, beside the stairwell. */
const leftRoomOf = (floor: FloorId) => ROOMS.find((r) => r.floor === floor && r.side === 'left')!.id;

/** Where the cat naps on the sofa, in living-room units, before the sofa is moved. */
const SOFA_SEAT = { x: 206, y: 156 - SOFA_LIFT };
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
  const avatar = useMemo(() => avatarOf(home.avatar), [home.avatar]);

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
      {layout.floors.map((f) => (
        <FloorFrame key={f.floor.id} placed={f} look={look} wall={wallPaintOf(home.decor.rooms[leftRoomOf(f.floor.id)])} />
      ))}
      {layout.rooms.map((placed) => (
        <G key={placed.room.id} transform={`translate(${placed.x} ${placed.y})`}>
          {placed.owned
            ? <RoomContents home={home} roomId={placed.room.id} look={look} />
            : <><RoomShell id={placed.room.id} look={look} thumb={false} /><LockedVeil id={placed.room.id} width={placed.width} /></>}
        </G>
      ))}
      {/* Drawn after every floor, so each spiral rises through the beam into the floor above (or, on the top
          floor, up to the ceiling). */}
      {/* Not in the attic: it's the top floor, so a staircase there would go nowhere. */}
      {levels.filter((l) => l < TOP_LEVEL).map((l) => (
        <SpiralStairs
          key={l}
          cx={STAIRWELL.x + STAIRWELL.width / 2}
          footY={layout.floorLine(l)}
          topY={levels.includes(l + 1) ? layout.floorLine(l + 1) : layout.floorLine(l) - ROOM_HEIGHT}
        />
      ))}
      {living && isPlaced(home, 'cat') && (
        <CatRoamer
          animate={animate}
          start={{ level: 0, x: living.x + living.width / 2 }}
          floorLine={layout.floorLine}
          floorHeight={FLOOR_HEIGHT}
          wanderTo={() => wanderAnywhere(layout)}
          sofa={isPlaced(home, 'sofa') ? { x: living.x + SOFA_SEAT.x + offsetOf(home, 'sofa').dx, y: living.y + SOFA_SEAT.y + offsetOf(home, 'sofa').dy } : undefined}
        />
      )}
      <Walker
        target={target}
        animate={animate}
        start={START}
        avatar={avatar}
        floorLine={layout.floorLine}
        floorHeight={FLOOR_HEIGHT}
        wanderTo={(spot) => {
          // Mostly potter about the room they're in; now and then head somewhere else in the home, stairs and all.
          const span = wanderSpan(layout, spot);
          if (span && Math.random() < 0.6) return { level: spot.level, x: Math.round(span[0] + Math.random() * (span[1] - span[0])) };
          return wanderAnywhere(layout);
        }}
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
function FloorFrame({ placed, look, wall }: { placed: PlacedFloor; look: Look; wall?: string }) {
  const { y, right, innerWalls, backDoor } = placed;
  const top = y + CEILING;
  const floorY = top + ROOM_HEIGHT;
  return (
    <>
      <PixelBeam x={HOUSE_LEFT} y={y} w={right - HOUSE_LEFT} h={CEILING} />
      {/* The greenhouse has a glass ceiling, not a timber one: sky through the panes, white glazing bars. */}
      {placed.floor.id === GREENHOUSE.floor && (
        <>
          <Rect x={GREENHOUSE.x} y={y} width={GREENHOUSE.width} height={CEILING} fill={look.sky} />
          <Rect x={GREENHOUSE.x} y={y} width={GREENHOUSE.width} height={CEILING} fill={scene.glass} opacity={0.55} />
          {Array.from({ length: Math.floor(GREENHOUSE.width / 27) + 1 }, (_, i) => GREENHOUSE.x + i * 27).map((gx) => (
            <Rect key={gx} x={gx} y={y} width={1.4} height={CEILING} fill={scene.white} />
          ))}
          <Rect x={GREENHOUSE.x} y={y} width={GREENHOUSE.width} height={1} fill={scene.timber.outline} />
          <Rect x={GREENHOUSE.x} y={y + CEILING - 1} width={GREENHOUSE.width} height={1} fill={scene.white} />
        </>
      )}
      <PixelPost x={HOUSE_LEFT} y={top} w={WALL} h={ROOM_HEIGHT} />
      {/* The stairwell: a windowless slice of the living room drawing, so the two match. It runs on under the
          doorway into the living room, so the opening shows the same wall and floor. */}
      <LivingBackdrop sprite={stairwell} x={STAIRWELL.x} y={top} wall={wall} look={look} />
      {/* No wall between the stairwell and the room beside it: the stairwell's drawing runs on to meet the room. */}
      {innerWalls.slice(1).map((x) => <Doorway key={x} x={x} top={top} floorY={floorY} look={look} />)}
      {backDoor
        ? <Doorway x={right - WALL} top={top} floorY={floorY} look={look} />
        : <PixelPost x={right - WALL} y={top} w={WALL} h={ROOM_HEIGHT} />}
      <PixelBeam x={HOUSE_LEFT} y={floorY} w={right - HOUSE_LEFT} h={BEAM} joint={{ first: 40, every: 60 }} />
    </>
  );
}

/**
 * An inner wall, seen end-on, with an open doorway at the bottom: the wall down to a lintel, and through the
 * opening, the back wall and floor carrying on (otherwise the sky behind the house would show through the gap).
 */
function Doorway({ x, top, floorY, look }: { x: number; top: number; floorY: number; look: Look }) {
  const lintel = floorY - DOOR_HEIGHT;
  return (
    <>
      {/* Through the opening: the same wall, baseboard and floorboards as the rooms either side */}
      <PixelSprite sprite={doorway} x={x} y={top} />
      <PixelPost x={x} y={top} w={WALL} h={lintel - top - 3} />
      <PixelBeam x={x} y={lintel - 3} w={WALL} h={3} />
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
  return <PixelGround y={y} w={SCENE_WIDTH} depth={GROUND} />;
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
