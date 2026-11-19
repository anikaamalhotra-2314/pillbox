import { Fragment, useMemo, type ReactElement } from 'react';
import { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { PixelSprite, type Sprite } from '@/design-system/icons/PixelArt';
import { pillColors, scene } from '@/design-system/tokens';
import type { ItemId } from '@/domain/home-catalog';
import { SittingCat } from './characters';
import { KITCHEN_COUNTER_TOP, KITCHEN_WINDOW, WindowView } from './rooms';
import { GroundShadow, LightCone, mixColor, Steam, type ArtContext } from './primitives';
import { bookshelf } from './sprites/bookshelf';
import { clock } from './sprites/clock';
import { coffeeTable } from './sprites/coffee-table';
import { armchairArt } from './sprites/armchair';
import { appleTreeArt, bedroomArtArt, bedroomRugArt, diningArtArt, bathMirrorArt, bedArt, benchArt, birdbathArt, chandelierArt, computerDeskArt, corkboardArt, deskArt, diningTableArt, duckArt, easelArt, filingCabinetArt, flowerBedArt, hangingPlantsArt, lemonTreeArt, mirrorArt, nightstandArt, plantersArt, sideboardArt, stringLightsArt, telescopeArt, towelsArt, tubArt, wardrobeArt } from './sprites/furniture';
import { fridge } from './sprites/fridge';
import { herbs } from './sprites/herbs';
import { jarShelf } from './sprites/jar-shelf';
import { kettle } from './sprites/kettle';
import { ovalLamp } from './sprites/oval-lamp';
import { lantern } from './sprites/lantern';
import { painting } from './sprites/painting';
import { palm } from './sprites/palm';
import { windowFrame } from './sprites/window-frame';
import { rug } from './sprites/rug';
import { sofa } from './sprites/sofa';


/** The colors repainting replaces: a face and a deeper shade, like the app's stacked cards. */
export interface Tint {
  fill: string;
  shade: string;
}

export type ItemContext = ArtContext & { owns: (id: ItemId) => boolean; tint: Tint };

export interface ItemArt {
  /** Bounds in room-local units, used to frame the shop thumbnail and to keep the piece inside its room: x, y, width, height. */
  box: readonly [number, number, number, number];
  /** Drawing order within the room: lower is further back. */
  z: number;
  /** The colors it comes in. Without it, the piece can't be repainted (plants, the cat, the duck). */
  tint?: Tint;
  /** Fixed where it comes: it goes with something built into the room (the café curtains on the kitchen window). */
  fixed?: boolean;
  /** Can be turned to face the other way (mirrored about its middle). */
  flips?: boolean;
  /** Hangs on the wall and can go anywhere on it, up and down as well as sideways. */
  hangs?: boolean;
  /** Lies flat on the floor, like a rug: always drawn under the furniture standing on it. */
  flat?: boolean;
  /** Lives its own life instead of being placed: not drawn with the room, and can't be moved. */
  roams?: boolean;
  /** Another piece it sits on and moves with, if any. It can't be moved on its own then. */
  attachedTo?: (owns: (id: ItemId) => boolean) => ItemId | undefined;
  draw: (ctx: ItemContext) => ReactElement;
}

const PERIWINKLE: Tint = { fill: scene.periwinkle, shade: scene.periwinkleDeep };
const PEACH: Tint = { fill: scene.peach, shade: scene.peachDeep };
const PORCELAIN: Tint = { fill: scene.white, shade: scene.periwinkleDeep };

/** The owner's window, drawn at `x`, with its shadow falling on the wall down and to the right. */
const windowAt = (x: number): ItemArt => ({
  box: [x, 27, 48, 71], z: 1, hangs: true,
  draw: ({ look, thumb }) => (
    <>
      <Rect x={x + 3} y={29} width={47} height={71} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />
      <WindowView sprite={windowFrame} x={x} y={27} look={look} thumb={thumb} />
    </>
  ),
});

/** Curtains as they come. */
const LINEN: Tint = { fill: scene.linen, shade: scene.linenDeep };

/**
 * A pair of pixel-art curtains on a timber rod, hung above one window (whose left edge is at `windowX`) and
 * moving with it. Each panel has folds lit from the left, a shaded hem with a wavy edge, and a shadow on the wall.
 */
const curtainsFor = (windowId: ItemId, windowX: number): ItemArt => {
  const ROD_Y = 14;
  const TOP = 16;
  const BOTTOM = 117;
  const PANEL = 16;
  const panels = [windowX - 11, windowX + 44];
  const rodLeft = windowX - 14;
  const rodRight = windowX + 62;
  return {
    box: [windowX - 17, ROD_Y - 2, 81, BOTTOM - ROD_Y + 3], z: 2, tint: LINEN,
    attachedTo: (owns) => (owns(windowId) ? windowId : undefined),
    draw: ({ tint }) => {
      const t = scene.timber;
      const light = mixColor(tint.fill, scene.white, 0.4);
      const fold = [tint.fill, light, tint.fill, tint.shade];
      return (
        <>
          {panels.map((x) => <Rect key={`s${x}`} x={x + 2} y={TOP + 2} width={PANEL} height={BOTTOM - TOP} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />)}
          {panels.map((x) => (
            <Fragment key={x}>
              {Array.from({ length: PANEL }, (_, c) => {
                const edge = c === 0 || c === PANEL - 1;
                const color = edge ? t.outline : fold[(c - 1) % fold.length];
                // Folds that catch the light hang a pixel lower, so the hem waves.
                const long = !edge && fold[(c - 1) % fold.length] === light ? 1 : 0;
                return (
                  <Fragment key={c}>
                    <Rect x={x + c} y={TOP} width={1} height={BOTTOM - TOP - 3 + long} fill={color} />
                    {!edge && <Rect x={x + c} y={BOTTOM - 3 + long} width={1} height={2} fill={tint.shade} />}
                    <Rect x={x + c} y={BOTTOM - 1 + long} width={1} height={1} fill={t.outline} />
                  </Fragment>
                );
              })}
              {/* In the rod's shade just under it */}
              <Rect x={x + 1} y={TOP} width={PANEL - 2} height={2} fill={tint.shade} />
              {Array.from({ length: PANEL / 4 }, (_, r) => <Rect key={`r${r}`} x={x + 1 + r * 4} y={TOP - 1} width={2} height={1} fill={t.outline} />)}
            </Fragment>
          ))}
          {/* The rod, with a knob at each end */}
          <Rect x={rodLeft} y={ROD_Y - 1} width={rodRight - rodLeft} height={4} fill={t.outline} />
          <Rect x={rodLeft} y={ROD_Y} width={rodRight - rodLeft} height={1} fill={t.light} />
          <Rect x={rodLeft} y={ROD_Y + 1} width={rodRight - rodLeft} height={1} fill={t.dark} />
          {[rodLeft - 3, rodRight].map((kx) => (
            <Fragment key={kx}>
              <Rect x={kx} y={ROD_Y - 2} width={3} height={6} fill={t.outline} />
              <Rect x={kx + 1} y={ROD_Y - 1} width={1} height={2} fill={t.light} />
              <Rect x={kx + 1} y={ROD_Y + 1} width={1} height={2} fill={t.body} />
            </Fragment>
          ))}
        </>
      );
    },
  };
};

/**
 * Café curtains for the kitchen's square window (48 by 50, at `wx`, `wy`): a rod across the middle and two short
 * panels with folds hanging to the sill, a little gap between them. Pixel style, like the living room curtains.
 */
const cafeCurtains = (wx: number, wy: number): ItemArt => {
  const ROD = wy + 22;
  const BOTTOM = wy + 47;
  const panels: [number, number][] = [[wx - 1, 25], [wx + 26, 25]];
  return {
    box: [wx - 4, ROD - 2, 56, BOTTOM - ROD + 3], z: 1, tint: LINEN, fixed: true,
    draw: ({ tint }) => {
      const t = scene.timber;
      const light = mixColor(tint.fill, scene.white, 0.4);
      const fold = [tint.fill, light, tint.fill, tint.shade];
      return (
        <>
          {panels.map(([x, w]) => (
            <Fragment key={x}>
              {Array.from({ length: w }, (_, c) => {
                const edge = c === 0 || c === w - 1;
                const color = edge ? t.outline : fold[(c - 1) % fold.length];
                const long = !edge && color === light ? 1 : 0;
                return (
                  <Fragment key={c}>
                    <Rect x={x + c} y={ROD + 1} width={1} height={BOTTOM - ROD - 3 + long} fill={color} />
                    <Rect x={x + c} y={BOTTOM - 1 + long} width={1} height={1} fill={t.outline} />
                  </Fragment>
                );
              })}
              <Rect x={x + 1} y={ROD + 1} width={w - 2} height={1} fill={tint.shade} />
            </Fragment>
          ))}
          <Rect x={wx - 3} y={ROD - 1} width={54} height={3} fill={t.outline} />
          <Rect x={wx - 3} y={ROD} width={54} height={1} fill={t.light} />
          {[wx - 5, wx + 51].map((kx) => <Rect key={kx} x={kx} y={ROD - 2} width={2} height={5} fill={t.outline} />)}
        </>
      );
    },
  };
};

/** A pixel-art piece whose F, D and L cells (and E, H if it has them) take its paint, with the other tones derived. */
function TintedSprite({ sprite, x, y, tint }: { sprite: Sprite; x: number; y: number; tint: Tint }) {
  const paint = useMemo(() => ({
    ...sprite.paint,
    F: tint.fill, D: tint.shade, L: mixColor(tint.fill, scene.white, 0.4),
    // Two more tones for pieces drawn with five (the armchair, cut from the couch): a deep shade and a highlight.
    E: mixColor(tint.shade, scene.ink, 0.35), H: mixColor(tint.fill, scene.white, 0.6),
  }), [sprite, tint]);
  return <PixelSprite sprite={{ rows: sprite.rows, paint }} x={x} y={y} />;
}

const DRAWN: Record<ItemId, ItemArt> = {
  // ── Living room ──
  // The house comes with a window, in the middle of the wall.
  window: windowAt(53),
  rug: {
    // The owner's own drawing. Not repaintable yet: it has no marked fill and shade colors.
    box: [104, 163, 171, 25], z: 0, flat: true,
    draw: () => <PixelSprite sprite={rug} x={104} y={163} />,
  },
  fig: {
    // A kentia palm in a green glazed pot, in the owner's pixel style. Its id is still 'fig', so saved homes keep it.
    box: [0, 98, 50, 94], z: 2,
    draw: () => (
      <>
        <GroundShadow cx={25} y={192} w={30} h={5} />
        <PixelSprite sprite={palm} x={0} y={98} />
      </>
    ),
  },
  pendant: {
    // A wide paper lantern on a cord, in the owner's pixel style, with its glow spreading below. Drawn over the
    // other things on the wall (it hangs out in the room), so it sits in front of the painting.
    box: [158, 0, 45, 49], z: 9,
    draw: ({ look, thumb }) => (
      <>
        <LightCone points="168,47 192,47 228,150 132,150" look={look} thumb={thumb} />
        <PixelSprite sprite={lantern} x={158} y={0} />
      </>
    ),
  },
  'floor-lamp': {
    // A floor lamp in the owner's pixel style: a flattened oval glass shade on a thin dark pole, with a
    // small dark foot that hardly shows. In the evening the shade has a soft halo.
    box: [254, 87, 27, 105], z: 2,
    draw: ({ look, thumb }) => (
      <>
        {!thumb && look.glow > 0 && <Ellipse cx={267} cy={93} rx={20} ry={13} fill={look.lamp} opacity={look.glow} />}
        <GroundShadow cx={268} y={192} w={12} h={3} />
        <PixelSprite sprite={ovalLamp} x={254} y={87} />
      </>
    ),
  },




  gallery: {
    // One large mid-century abstract painting in a teak frame, in the owner's pixel style.
    box: [176, 50, 48, 62], z: 1, hangs: true,
    draw: () => (
      <>
        <Rect x={178} y={52} width={48} height={62} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />
        <PixelSprite sprite={painting} x={176} y={50} />
      </>
    ),
  },

  curtains: curtainsFor('window', 53),
  clock: {
    // A mid-century ball clock in the owner's pixel style, hung anywhere on the wall.
    box: [226, 30, 29, 29], z: 1, hangs: true,
    draw: () => <PixelSprite sprite={clock} x={226} y={30} />,
  },
  'coffee-table': {
    // The owner's own drawing. Not repaintable yet: it has no marked fill and shade colors.
    box: [178, 152, 60, 36], z: 4,
    draw: () => (
      <>
        <GroundShadow cx={208} y={186} w={60} h={8} />
        <PixelSprite sprite={coffeeTable} x={178} y={152} />
      </>
    ),
  },
  bookshelf: {
    // A mid-century teak wall unit in the owner's pixel style, with books and a plant. Not repaintable.
    box: [101, 35, 58, 157], z: 2,
    draw: () => (
      <>
        <GroundShadow cx={130} y={192} w={62} h={5} />
        <PixelSprite sprite={bookshelf} x={101} y={35} />
      </>
    ),
  },
  sofa: {
    // The owner's own drawing. Not repaintable yet: it has no marked fill and shade colors.
    box: [160, 128, 98, 51], z: 3,
    draw: () => (
      <>
        <GroundShadow cx={209} y={179} w={100} h={7} />
        <PixelSprite sprite={sofa} x={160} y={128} />
      </>
    ),
  },
  cat: {
    // Not placed: the cat wanders the living room on its own (see CatRoamer). Drawn here only for the shop.
    box: [192, 162, 28, 24], z: 5, roams: true,
    draw: () => <SittingCat x={204} y={184} />,
  },

  // ── Kitchen ──
  'cafe-curtains': cafeCurtains(KITCHEN_WINDOW.x, KITCHEN_WINDOW.y),
  kettle: {
    // A cornflower enamel kettle on the stove, in the owner's pixel style, steaming. It slides along the counter.
    box: [76, KITCHEN_COUNTER_TOP - 14, 17, 14], z: 3,
    draw: ({ thumb }) => (
      <>
        <PixelSprite sprite={kettle} x={76} y={KITCHEN_COUNTER_TOP - 14} />
        <Steam x={91} y={KITCHEN_COUNTER_TOP - 18} thumb={thumb} />
      </>
    ),
  },

  herbs: {
    // Basil, rosemary and parsley in terracotta pots on the window sill, in the owner's pixel style.
    box: [15, 56, 44, 22], z: 2, fixed: true,
    draw: () => <PixelSprite sprite={herbs} x={15} y={56} />,
  },

  'jar-shelf': {
    // A teak floating shelf with glass jars, in the owner's pixel style. Hangs anywhere on the wall.
    box: [76, 40, 56, 19], z: 1, hangs: true,
    draw: () => <PixelSprite sprite={jarShelf} x={76} y={40} />,
  },

  fridge: {
    // A cream retro fridge with chrome handles, in the owner's pixel style.
    box: [116, 77, 40, 80], z: 2,
    draw: () => (
      <>
        <GroundShadow cx={136} y={157} w={42} h={4} />
        <PixelSprite sprite={fridge} x={116} y={77} />
      </>
    ),
  },


  // ── Dining room ──
  'dining-art': {
    // A mid-century sunset print in a teak frame, in the owner's pixel style. Hangs anywhere on the wall.
    box: [24, 44, 40, 30], z: 1, hangs: true,
    draw: () => (
      <>
        <Rect x={26} y={46} width={40} height={30} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />
        <PixelSprite sprite={diningArtArt} x={24} y={44} />
      </>
    ),
  },
  chandelier: {
    box: [52, 0, 60, 34], z: 1,
    // In the owner's pixel style.
    draw: ({ look, thumb }) => (
      <>
        {!thumb && look.glow > 0 && <Circle cx={82} cy={26} r={16} fill={look.lamp} opacity={look.glow} />}
        <PixelSprite sprite={chandelierArt} x={52} y={0} />
      </>
    ),
  },

  sideboard: {
    box: [96, 104, 62, 62], z: 1, tint: PERIWINKLE,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={sideboardArt} x={96} y={104} tint={tint} />,
  },

  'dining-table': {
    box: [14, 118, 126, 72], z: 3, tint: PEACH,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={diningTableArt} x={14} y={118} tint={tint} />,
  },


  // ── Garden ──
  'flower-bed': {
    box: [4, 136, 60, 54], z: 2, tint: pillColors.rose,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={flowerBedArt} x={4} y={136} tint={tint} />,
  },

  birdbath: {
    box: [62, 112, 34, 78], z: 2,
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={birdbathArt} x={62} y={112} />,
  },

  bench: {
    box: [96, 136, 64, 54], z: 3, tint: { fill: scene.wood, shade: scene.woodDark },
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={benchArt} x={96} y={136} tint={tint} />,
  },

  'apple-tree': {
    box: [96, 22, 66, 166], z: 1,
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={appleTreeArt} x={96} y={22} />,
  },


  // ── Bedroom ──
  'string-lights': {
    // After the reference: a pair of plug-in wall sconces with paper globe lanterns, glowing in the evening.
    box: [86, 28, 142, 112], z: 1,
    draw: ({ look, thumb }) => (
      <>
        {!thumb && look.glow > 0 && [106, 216].map((cx) => <Circle key={cx} cx={cx} cy={92} r={18} fill={look.lamp} opacity={look.glow} />)}
        <PixelSprite sprite={stringLightsArt} x={86} y={28} />
      </>
    ),
  },

  mirror: {
    // In the owner's pixel style, after their reference: a tall walnut frame with a pill-shaped glass. Hangs
    // anywhere on the wall.
    box: [54, 52, 30, 72], z: 1, hangs: true,
    draw: () => (
      <>
        <Rect x={56} y={54} width={30} height={72} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />
        <PixelSprite sprite={mirrorArt} x={54} y={52} />
      </>
    ),
  },

  nightstand: {
    // After the reference: a floating walnut shelf by the bed, with glasses and a branch in a little vase.
    box: [76, 112, 30, 22], z: 1, hangs: true,
    draw: () => <PixelSprite sprite={nightstandArt} x={76} y={112} />,
  },

  wardrobe: {
    // In the owner's pixel style, after their reference: a teak wardrobe with two grained doors, a drawer and
    // tapered legs. Natural teak like the other wood furniture, so it isn't repainted.
    box: [4, 80, 48, 112], z: 2,
    draw: () => <PixelSprite sprite={wardrobeArt} x={4} y={80} />,
  },

  'bedroom-art': {
    // After the reference: a big abstract print of red shapes on cream, in a thin dark frame. Hangs anywhere.
    box: [126, 32, 56, 44], z: 1, hangs: true,
    draw: () => (
      <>
        <Rect x={128} y={34} width={56} height={44} fill={scene.wallShadow.color} opacity={scene.wallShadow.opacity} />
        <PixelSprite sprite={bedroomArtArt} x={126} y={32} />
      </>
    ),
  },
  'bedroom-rug': {
    // A large, fluffy cream rug under the bed, with a tufted edge. Can be repainted.
    box: [79, 164, 150, 26], z: 0, flat: true, tint: { fill: scene.cream, shade: mixColor(scene.cream, scene.ink, 0.12) },
    draw: ({ tint }) => <TintedSprite sprite={bedroomRugArt} x={79} y={164} tint={tint} />,
  },
  bed: {
    // After the owner's reference: a low walnut platform bed with a long headboard, charcoal bedding (the duvet
    // takes the paint), cream, rust and striped pillows and a cream throw.
    box: [104, 146, 100, 44], z: 3, tint: { fill: scene.charcoal, shade: mixColor(scene.charcoal, scene.ink, 0.3) },
    draw: ({ tint }) => <TintedSprite sprite={bedArt} x={104} y={146} tint={tint} />,
  },


  // ── Bathroom ──
  towels: {
    box: [56, 86, 40, 38], z: 1, tint: PEACH,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={towelsArt} x={56} y={86} tint={tint} />,
  },

  'bath-mirror': {
    box: [12, 94, 36, 96], z: 2,
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={bathMirrorArt} x={12} y={94} />,
  },

  tub: {
    box: [68, 150, 76, 40], z: 3, tint: PORCELAIN,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={tubArt} x={68} y={150} tint={tint} />,
  },

  duck: {
    box: [104, 141, 22, 18], z: 4,
    attachedTo: () => 'tub',
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={duckArt} x={104} y={141} />,
  },


  // ── Office ──
  corkboard: {
    box: [34, 36, 66, 48], z: 1,
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={corkboardArt} x={34} y={36} />,
  },

  'filing-cabinet': {
    box: [8, 130, 30, 60], z: 2, tint: { fill: scene.periwinkleDeep, shade: scene.slate },
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={filingCabinetArt} x={8} y={130} tint={tint} />,
  },

  'computer-desk': {
    box: [52, 112, 108, 78], z: 3, tint: PERIWINKLE,
    // In the owner's pixel style.
    draw: ({ look, thumb, tint }) => (
      <>
        {!thumb && look.glow > 0 && <Circle cx={134} cy={124} r={10} fill={look.lamp} opacity={look.glow} />}
        <TintedSprite sprite={computerDeskArt} x={52} y={112} tint={tint} />
      </>
    ),
  },


  // ── Studio ──
  easel: {
    box: [92, 98, 46, 92], z: 2,
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={easelArt} x={92} y={98} />,
  },

  armchair: {
    // The owner's couch cut down to one seat, in a woolly mustard (or whatever paint is chosen).
    box: [24, 137, 56, 51], z: 3, tint: scene.mustardWool,
    draw: ({ tint }) => (
      <>
        <GroundShadow cx={52} y={188} w={58} h={5} />
        <TintedSprite sprite={armchairArt} x={24} y={137} tint={tint} />
      </>
    ),
  },

  desk: {
    box: [144, 110, 92, 80], z: 2,
    // In the owner's pixel style.
    draw: ({ look, thumb }) => (
      <>
        {!thumb && look.glow > 0 && <Circle cx={203} cy={121} r={10} fill={look.lamp} opacity={look.glow} />}
        <PixelSprite sprite={deskArt} x={144} y={110} />
      </>
    ),
  },

  telescope: {
    box: [230, 94, 44, 96], z: 3, tint: PERIWINKLE,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={telescopeArt} x={230} y={94} tint={tint} />,
  },


  // ── Greenhouse ──
  'hanging-plants': {
    box: [14, 0, 132, 56], z: 1, tint: PEACH,
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={hangingPlantsArt} x={14} y={0} tint={tint} />,
  },

  planters: {
    box: [4, 148, 98, 42], z: 2,
    // In the owner's pixel style.
    draw: () => <PixelSprite sprite={plantersArt} x={4} y={148} />,
  },

  'lemon-tree': {
    box: [100, 88, 50, 102], z: 3, tint: { fill: scene.terracotta, shade: scene.brick },
    // In the owner's pixel style.
    draw: ({ tint }) => <TintedSprite sprite={lemonTreeArt} x={100} y={88} tint={tint} />,
  },

};

/**
 * How far the living room's standing furniture sits above where it was drawn, so the sofa reads as closer to the
 * wall in the owner's background drawing. Wall-mounted pieces (pendant, gallery, curtains) stay put.
 */
export const LIVING_LIFT = 4;
/** The sofa goes a little further back than the rest, nearer the wall. */
export const SOFA_LIFT = LIVING_LIFT + 3;
const LIFTS: Partial<Record<ItemId, number>> = {
  rug: LIVING_LIFT, fig: LIVING_LIFT, 'floor-lamp': LIVING_LIFT, 'coffee-table': LIVING_LIFT, bookshelf: LIVING_LIFT, sofa: SOFA_LIFT,
};

/** Pieces that sit somewhere other than where they were drawn, sideways. */
const SHIFTS: Partial<Record<ItemId, number>> = {};

const lift = (art: ItemArt, by: number, dx: number): ItemArt => {
  const [x, y, w, h] = art.box;
  return {
    ...art,
    box: [x + dx, y - by, w, h],
    draw: (ctx) => <G transform={`translate(${dx} ${-by})`}>{art.draw(ctx)}</G>,
  };
};

export const ITEM_ART = Object.fromEntries(
  Object.entries(DRAWN).map(([id, art]) => {
    const by = LIFTS[id as ItemId] ?? 0;
    const dx = SHIFTS[id as ItemId] ?? 0;
    return [id, by || dx ? lift(art, by, dx) : art];
  }),
) as Record<ItemId, ItemArt>;
