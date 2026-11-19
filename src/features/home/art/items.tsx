import { Fragment, type ReactElement } from 'react';
import { Circle, Ellipse, Line, Polygon, Polyline, Rect } from 'react-native-svg';

import { PixelSprite } from '@/design-system/icons/PixelArt';
import { pillColors, scene } from '@/design-system/tokens';
import type { ItemId } from '@/domain/home-catalog';
import { SittingCat } from './characters';
import { Block, Ink, Leaf, LightCone, Steam, Twinkle, type ArtContext } from './primitives';
import { sofa } from './sprites/sofa';

const ink = scene.ink;

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
  /** Lives its own life instead of being placed: not drawn with the room, and can't be moved. */
  roams?: boolean;
  /** Another piece it sits on and moves with, if any. It can't be moved on its own then. */
  attachedTo?: (owns: (id: ItemId) => boolean) => ItemId | undefined;
  draw: (ctx: ItemContext) => ReactElement;
}

const PERIWINKLE: Tint = { fill: scene.periwinkle, shade: scene.periwinkleDeep };
const PEACH: Tint = { fill: scene.peach, shade: scene.peachDeep };
const PORCELAIN: Tint = { fill: scene.white, shade: scene.periwinkleDeep };
const BOOK_COLORS = [scene.peach, ink, scene.glow, scene.white, scene.periwinkleDeep, scene.peachDeep];

export const ITEM_ART: Record<ItemId, ItemArt> = {
  // ── Living room ──
  rug: {
    box: [150, 170, 116, 18], z: 0, tint: PERIWINKLE,
    draw: ({ tint }) => (
      <>
        <Polygon points="152,186 264,186 254,174 162,174" fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Polygon points="164,183 252,183 246,177 170,177" fill="none" stroke={tint.shade} strokeWidth={1} />
      </>
    ),
  },
  fig: {
    box: [0, 108, 28, 84], z: 2, tint: PEACH,
    draw: ({ tint }) => (
      <>
        <Ink x1={12} y1={166} x2={12} y2={112} w={1.4} color={scene.stem} />
        <Leaf cx={6} cy={158} rx={6} ry={3.5} />
        <Leaf cx={18} cy={150} rx={6} ry={3.5} light />
        <Leaf cx={6} cy={142} rx={5.5} ry={3.5} light />
        <Leaf cx={18} cy={134} rx={5.5} ry={3.5} />
        <Leaf cx={8} cy={126} rx={5} ry={3} />
        <Leaf cx={16} cy={120} rx={4.5} ry={3} light />
        <Leaf cx={12} cy={114} rx={4} ry={3} />
        <Block x={4} y={166} w={16} h={22} fill={tint.fill} shade={tint.shade} />
      </>
    ),
  },
  pendant: {
    box: [166, 0, 28, 26], z: 1,
    draw: ({ look, thumb }) => (
      <>
        <LightCone points="176,21 184,21 220,150 140,150" look={look} thumb={thumb} />
        <Ink x1={180} y1={0} x2={180} y2={12} w={0.8} />
        <Ellipse cx={180} cy={16} rx={6} ry={5} fill={look.lamp} stroke={ink} strokeWidth={1} />
      </>
    ),
  },
  'floor-lamp': {
    box: [252, 62, 24, 130], z: 2,
    draw: ({ look, thumb }) => (
      <>
        <LightCone points="258,77 270,77 282,190 246,190" look={look} thumb={thumb} />
        <Ink x1={264} y1={190} x2={264} y2={76} w={1.4} />
        <Rect x={258} y={186} width={12} height={2} fill={ink} />
        <Polygon points="256,76 272,76 269,66 259,66" fill={look.lamp} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      </>
    ),
  },
  gallery: {
    box: [172, 50, 86, 44], z: 1,
    draw: () => (
      <>
        <Block x={174} y={54} w={24} h={30} fill={ink} shade={scene.slate} />
        <Rect x={176} y={56} width={20} height={26} fill={scene.peach} />
        <Ellipse cx={186} cy={74} rx={4} ry={5} fill={ink} />
        <Ellipse cx={186} cy={66} rx={2.8} ry={2.8} fill={ink} />
        <Rect x={183.5} y={62} width={1.2} height={2} fill={ink} />
        <Rect x={187.5} y={62} width={1.2} height={2} fill={ink} />
        <Block x={204} y={56} w={18} h={14} fill={ink} shade={scene.slate} />
        <Rect x={206} y={58} width={14} height={10} fill={scene.glow} />
        <Polygon points="206,68 212,61 216,65 220,60 220,68" fill={scene.leaf} />
        <Block x={204} y={76} w={18} h={12} fill={ink} shade={scene.slate} />
        <Rect x={206} y={78} width={14} height={8} fill={scene.periwinkle} />
        <Circle cx={246} cy={62} r={8} fill={scene.white} stroke={ink} strokeWidth={1} />
        <Ink x1={246} y1={62} x2={246} y2={57} />
        <Ink x1={246} y1={62} x2={250} y2={64} />
      </>
    ),
  },
  curtains: {
    box: [12, 16, 82, 90], z: 1, tint: PERIWINKLE,
    draw: ({ tint }) => (
      <>
        <Ink x1={16} y1={20} x2={90} y2={20} w={1.4} />
        <Polygon points="18,21 30,21 26,102 16,102" fill={tint.fill} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
        <Polygon points="76,21 88,21 90,102 80,102" fill={tint.fill} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      </>
    ),
  },
  'coffee-table': {
    box: [178, 150, 60, 40], z: 4, tint: PEACH,
    draw: ({ thumb, tint }) => (
      <>
        <Block x={182} y={170} w={52} h={4} fill={tint.fill} shade={tint.shade} />
        <Rect x={186} y={174} width={3} height={14} fill={scene.brick} stroke={ink} strokeWidth={1} />
        <Rect x={227} y={174} width={3} height={14} fill={scene.brick} stroke={ink} strokeWidth={1} />
        <Rect x={190} y={162} width={7} height={8} fill={scene.white} stroke={ink} strokeWidth={0.7} />
        <Steam x={192} y={156} thumb={thumb} />
        <Rect x={206} y={166} width={16} height={4} fill={scene.peachDeep} stroke={ink} strokeWidth={0.6} />
        <Rect x={208} y={163} width={12} height={3} fill={scene.periwinkle} stroke={ink} strokeWidth={0.6} />
      </>
    ),
  },
  bookshelf: {
    box: [112, 34, 52, 158], z: 2, tint: PERIWINKLE,
    draw: ({ tint }) => (
      <>
        <Block x={116} y={46} w={42} h={144} fill={tint.fill} shade={tint.shade} />
        {[72, 98, 124, 150].map((shelf) => (
          <Line key={shelf} x1={116} y1={shelf} x2={158} y2={shelf} stroke={ink} strokeWidth={1} />
        ))}
        {[72, 98, 124, 150, 188].flatMap((shelf, s) =>
          [0, 1, 2, 3, 4, 5, 6].filter((i) => (i + s) % 4 !== 3).map((i) => {
            const h = 10 + ((i * 3 + s) % 4);
            return <Rect key={`${s}-${i}`} x={119 + i * 5.5} y={shelf - h} width={3.4} height={h} fill={BOOK_COLORS[(i + s) % BOOK_COLORS.length]} stroke={ink} strokeWidth={0.6} />;
          }),
        )}
        <Leaf cx={149} cy={41} rx={5} ry={3} />
        <Leaf cx={143} cy={39} rx={3.5} ry={2.5} light />
        <Rect x={142} y={42} width={10} height={4} fill={scene.peach} stroke={ink} strokeWidth={0.6} />
      </>
    ),
  },
  sofa: {
    // The owner's own drawing. Not repaintable yet: it has no marked fill and shade colors.
    box: [160, 128, 98, 51], z: 3,
    draw: () => <PixelSprite sprite={sofa} x={160} y={128} />,
  },
  cat: {
    // Not placed: the cat wanders the living room on its own (see CatRoamer). Drawn here only for the shop.
    box: [192, 162, 28, 24], z: 5, roams: true,
    draw: () => <SittingCat x={204} y={184} />,
  },

  // ── Kitchen ──
  kettle: {
    box: [80, 112, 30, 26], z: 3, tint: PORCELAIN,
    draw: ({ thumb, tint }) => (
      <>
        <Ellipse cx={92} cy={131} rx={7} ry={5} fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Rect x={97} y={126} width={5} height={2} fill={tint.fill} stroke={ink} strokeWidth={0.6} />
        <Rect x={89} y={124} width={6} height={2} fill={ink} />
        <Steam x={101} y={119} thumb={thumb} />
      </>
    ),
  },
  herbs: {
    box: [14, 52, 50, 24], z: 2,
    draw: () => (
      <>
        <Rect x={16} y={72} width={44} height={3} fill={scene.peach} stroke={ink} strokeWidth={0.8} />
        {[20, 33, 46].map((x, i) => (
          <Fragment key={x}>
            <Leaf cx={x + 2} cy={61} rx={3} ry={2.2} light={i % 2 === 0} />
            <Leaf cx={x + 6} cy={59} rx={3} ry={2.2} light={i % 2 === 1} />
            <Rect x={x} y={64} width={8} height={8} fill={scene.terracotta} stroke={ink} strokeWidth={0.8} />
          </Fragment>
        ))}
      </>
    ),
  },
  'jar-shelf': {
    box: [76, 26, 66, 22], z: 1, tint: PEACH,
    draw: ({ tint }) => (
      <>
        <Block x={78} y={40} w={60} h={4} fill={tint.fill} shade={tint.shade} />
        {[82, 89, 96, 103, 114, 121].map((x, i) => (
          <Rect key={x} x={x} y={30} width={5} height={10} fill={[scene.white, scene.glow, scene.periwinkle, scene.peach][i % 4]} stroke={ink} strokeWidth={0.7} />
        ))}
      </>
    ),
  },
  fridge: {
    box: [112, 66, 46, 126], z: 2, tint: PORCELAIN,
    draw: ({ tint }) => (
      <>
        <Block x={116} y={70} w={34} h={118} fill={tint.fill} shade={tint.shade} />
        <Ink x1={116} y1={104} x2={150} y2={104} />
        <Rect x={120} y={80} width={2} height={14} fill={ink} />
        <Rect x={120} y={110} width={2} height={18} fill={ink} />
        <Rect x={136} y={82} width={6} height={6} fill={scene.peach} stroke={ink} strokeWidth={0.6} />
      </>
    ),
  },

  // ── Dining room ──
  chandelier: {
    box: [52, 0, 60, 34], z: 1,
    draw: ({ look, thumb }) => (
      <>
        <LightCone points="70,26 94,26 122,150 42,150" look={look} thumb={thumb} />
        <Ink x1={82} y1={0} x2={82} y2={14} w={0.8} />
        <Polyline points="62,14 66,24 98,24 102,14" fill="none" stroke={scene.woodDark} strokeWidth={1.4} />
        {[62, 81, 100].map((x) => (
          <Fragment key={x}>
            <Rect x={x - 1.5} y={6} width={3} height={8} fill={scene.white} stroke={ink} strokeWidth={0.6} />
            <Ellipse cx={x} cy={4} rx={1.4} ry={2} fill={scene.glow} />
          </Fragment>
        ))}
      </>
    ),
  },
  sideboard: {
    box: [96, 104, 62, 62], z: 1, tint: PERIWINKLE,
    draw: ({ tint }) => (
      <>
        <Block x={100} y={124} w={52} h={32} fill={tint.fill} shade={tint.shade} />
        <Ink x1={126} y1={124} x2={126} y2={156} />
        <Rect x={121} y={138} width={2} height={4} fill={ink} />
        <Rect x={129} y={138} width={2} height={4} fill={ink} />
        <Rect x={102} y={156} width={3} height={8} fill={ink} />
        <Rect x={147} y={156} width={3} height={8} fill={ink} />
        <Rect x={112} y={112} width={8} height={12} fill={scene.white} stroke={ink} strokeWidth={0.7} />
        <Circle cx={114} cy={109} r={2.4} fill={scene.peach} stroke={ink} strokeWidth={0.5} />
        <Circle cx={118.5} cy={107} r={2.4} fill={scene.glow} stroke={ink} strokeWidth={0.5} />
      </>
    ),
  },
  'dining-table': {
    box: [14, 118, 126, 72], z: 3, tint: PEACH,
    draw: ({ tint }) => (
      <>
        {/* A chair at each end */}
        <Rect x={18} y={124} width={5} height={64} fill={scene.wood} stroke={ink} strokeWidth={0.8} />
        <Rect x={18} y={160} width={22} height={4} fill={scene.wood} stroke={ink} strokeWidth={0.8} />
        <Rect x={36} y={164} width={3} height={24} fill={scene.woodDark} />
        <Rect x={131} y={124} width={5} height={64} fill={scene.wood} stroke={ink} strokeWidth={0.8} />
        <Rect x={114} y={160} width={22} height={4} fill={scene.wood} stroke={ink} strokeWidth={0.8} />
        <Rect x={115} y={164} width={3} height={24} fill={scene.woodDark} />
        {/* Table, cloth, plates and a candle */}
        <Rect x={44} y={155} width={4} height={33} fill={scene.woodDark} stroke={ink} strokeWidth={0.8} />
        <Rect x={104} y={155} width={4} height={33} fill={scene.woodDark} stroke={ink} strokeWidth={0.8} />
        <Block x={38} y={150} w={76} h={5} fill={scene.wood} shade={scene.woodDark} />
        <Rect x={40} y={146} width={72} height={10} fill={tint.fill} stroke={ink} strokeWidth={0.8} />
        <Ink x1={40} y1={153} x2={112} y2={153} color={tint.shade} />
        <Ellipse cx={56} cy={146} rx={7} ry={1.8} fill={scene.white} stroke={ink} strokeWidth={0.6} />
        <Ellipse cx={96} cy={146} rx={7} ry={1.8} fill={scene.white} stroke={ink} strokeWidth={0.6} />
        <Rect x={75} y={134} width={3} height={11} fill={scene.white} stroke={ink} strokeWidth={0.6} />
        <Ellipse cx={76.5} cy={131.5} rx={1.4} ry={2} fill={scene.glow} />
      </>
    ),
  },

  // ── Garden ──
  'flower-bed': {
    box: [4, 136, 60, 54], z: 2, tint: pillColors.rose,
    draw: ({ tint }) => (
      <>
        {[12, 22, 32, 42, 52].map((x, i) => (
          <Fragment key={x}>
            <Ink x1={x} y1={172} x2={x} y2={150 - (i % 2) * 6} w={1} color={scene.stem} />
            <Leaf cx={x + 3} cy={162} rx={3} ry={1.6} light={i % 2 === 0} />
            {[[-2.2, 0], [2.2, 0], [0, -2.2], [0, 2.2]].map(([dx, dy]) => (
              <Circle key={`${dx}${dy}`} cx={x + dx} cy={148 - (i % 2) * 6 + dy} r={1.9} fill={i % 2 ? scene.glow : tint.fill} stroke={ink} strokeWidth={0.4} />
            ))}
            <Circle cx={x} cy={148 - (i % 2) * 6} r={1.2} fill={i % 2 ? scene.terracotta : scene.glow} />
          </Fragment>
        ))}
        <Block x={6} y={172} w={54} h={14} fill={scene.brick} shade={scene.woodDark} />
      </>
    ),
  },
  birdbath: {
    box: [62, 112, 34, 78], z: 2,
    draw: () => (
      <>
        <Rect x={76} y={140} width={6} height={44} fill={scene.white} stroke={ink} strokeWidth={0.8} />
        <Rect x={70} y={182} width={18} height={6} fill={scene.white} stroke={ink} strokeWidth={0.8} />
        <Ellipse cx={79} cy={138} rx={13} ry={4} fill={scene.white} stroke={ink} strokeWidth={1} />
        <Ellipse cx={79} cy={137} rx={10} ry={2.2} fill={scene.periwinkle} />
        {/* A little bird on the rim */}
        <Ellipse cx={88} cy={130} rx={3.6} ry={2.6} fill={scene.slate} stroke={ink} strokeWidth={0.5} />
        <Circle cx={91} cy={127} r={1.9} fill={scene.slate} stroke={ink} strokeWidth={0.5} />
        <Polygon points="92.6,126.6 95,127.2 92.6,127.8" fill={scene.terracotta} />
        <Rect x={91} y={126.3} width={0.7} height={0.7} fill={ink} />
        <Polygon points="84.6,129 81.6,127.6 84.6,131" fill={scene.slate} stroke={ink} strokeWidth={0.4} />
      </>
    ),
  },
  bench: {
    box: [96, 136, 64, 54], z: 3, tint: { fill: scene.wood, shade: scene.woodDark },
    draw: ({ tint }) => (
      <>
        <Rect x={100} y={140} width={56} height={5} fill={tint.fill} stroke={ink} strokeWidth={0.8} />
        <Rect x={100} y={149} width={56} height={5} fill={tint.fill} stroke={ink} strokeWidth={0.8} />
        <Block x={98} y={162} w={60} h={5} fill={tint.fill} shade={tint.shade} />
        <Rect x={102} y={140} width={3} height={22} fill={ink} />
        <Rect x={151} y={140} width={3} height={22} fill={ink} />
        <Rect x={102} y={167} width={3} height={21} fill={ink} />
        <Rect x={151} y={167} width={3} height={21} fill={ink} />
      </>
    ),
  },
  'apple-tree': {
    box: [96, 22, 66, 166], z: 1,
    draw: () => (
      <>
        <Rect x={124} y={92} width={9} height={78} fill={scene.woodDark} stroke={ink} strokeWidth={0.8} />
        <Ink x1={128} y1={110} x2={142} y2={96} w={2} color={scene.woodDark} />
        <Ellipse cx={128} cy={66} rx={30} ry={36} fill={scene.leaf} stroke={ink} strokeWidth={1} />
        <Ellipse cx={116} cy={54} rx={14} ry={14} fill={scene.leafLight} stroke={ink} strokeWidth={1} />
        <Ellipse cx={142} cy={78} rx={11} ry={10} fill={scene.leafLight} stroke={ink} strokeWidth={1} />
        {[[112, 74], [136, 50], [146, 68], [124, 86], [106, 60], [132, 66]].map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.8} fill={scene.terracotta} stroke={ink} strokeWidth={0.6} />
        ))}
      </>
    ),
  },

  // ── Bedroom ──
  'string-lights': {
    box: [76, 4, 200, 22], z: 1,
    draw: ({ thumb }) => {
      const xs = Array.from({ length: 10 }, (_, i) => 80 + i * 20);
      const colors = [scene.glow, scene.peach, scene.periwinkle, scene.white];
      return (
        <>
          <Polyline points={xs.map((x, i) => `${x},${i % 2 ? 18 : 10}`).join(' ')} fill="none" stroke={ink} strokeWidth={0.8} />
          {xs.map((x, i) => (thumb
            ? <Rect key={x} x={x - 1.5} y={(i % 2 ? 18 : 10) + 1} width={3} height={3} fill={colors[i % 4]} stroke={ink} strokeWidth={0.4} />
            : <Twinkle key={x} x={x - 1.5} y={(i % 2 ? 18 : 10) + 1} size={3} color={colors[i % 4]} phase={i} />
          ))}
        </>
      );
    },
  },
  mirror: {
    box: [80, 68, 32, 56], z: 1,
    draw: () => (
      <>
        <Ellipse cx={98} cy={98} rx={10} ry={22} fill={scene.slate} stroke={ink} strokeWidth={1} />
        <Ellipse cx={96} cy={96} rx={10} ry={22} fill={scene.white} stroke={ink} strokeWidth={1} />
        <Ellipse cx={96} cy={96} rx={7} ry={18} fill={scene.periwinkle} />
        <Line x1={92} y1={86} x2={96} y2={80} stroke={scene.white} strokeWidth={1.2} />
      </>
    ),
  },
  nightstand: {
    box: [232, 122, 38, 68], z: 3, tint: PEACH,
    draw: ({ look, thumb, tint }) => (
      <>
        <LightCone points="246,141 256,141 266,150 236,150" look={look} thumb={thumb} />
        <Block x={236} y={150} w={26} h={38} fill={tint.fill} shade={tint.shade} />
        <Ink x1={236} y1={166} x2={262} y2={166} />
        <Rect x={247} y={157} width={4} height={2} fill={ink} />
        <Rect x={247} y={140} width={8} height={10} fill={scene.white} stroke={ink} strokeWidth={0.8} />
        <Polygon points="243,140 259,140 256,130 246,130" fill={look.lamp} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      </>
    ),
  },
  wardrobe: {
    box: [16, 36, 64, 156], z: 2, tint: { fill: scene.wood, shade: scene.woodDark },
    draw: ({ tint }) => (
      <>
        <Block x={20} y={40} w={50} h={148} fill={tint.fill} shade={tint.shade} />
        <Rect x={18} y={36} width={54} height={6} fill={tint.shade} stroke={ink} strokeWidth={1} />
        <Ink x1={45} y1={42} x2={45} y2={188} />
        <Rect x={40} y={108} width={2} height={6} fill={scene.glow} />
        <Rect x={48} y={108} width={2} height={6} fill={scene.glow} />
      </>
    ),
  },
  bed: {
    box: [118, 114, 120, 76], z: 3, tint: PEACH,
    draw: ({ tint }) => (
      <>
        <Rect x={124} y={120} width={10} height={68} fill={scene.wood} stroke={ink} strokeWidth={1} />
        <Block x={130} y={160} w={102} h={20} fill={scene.periwinkle} shade={scene.periwinkleDeep} />
        <Rect x={134} y={148} width={98} height={14} fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Ink x1={170} y1={148} x2={170} y2={162} color={tint.shade} />
        <Rect x={137} y={142} width={22} height={8} rx={2} fill={scene.white} stroke={ink} strokeWidth={1} />
        <Rect x={132} y={180} width={4} height={8} fill={ink} />
        <Rect x={226} y={180} width={4} height={8} fill={ink} />
      </>
    ),
  },

  // ── Bathroom ──
  towels: {
    box: [56, 86, 40, 38], z: 1, tint: PEACH,
    draw: ({ tint }) => (
      <>
        <Ink x1={60} y1={92} x2={92} y2={92} w={1.4} />
        <Rect x={64} y={93} width={12} height={26} fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Rect x={78} y={93} width={12} height={20} fill={scene.periwinkle} stroke={ink} strokeWidth={1} />
      </>
    ),
  },
  'bath-mirror': {
    box: [6, 54, 48, 136], z: 2,
    draw: () => (
      <>
        <Block x={14} y={60} w={30} h={34} fill={scene.white} shade={scene.slate} />
        <Rect x={17} y={63} width={24} height={28} fill={scene.periwinkle} />
        <Rect x={24} y={120} width={10} height={68} fill={scene.white} stroke={ink} strokeWidth={1} />
        <Block x={10} y={112} w={38} h={8} fill={scene.white} shade={scene.periwinkleDeep} />
        <Rect x={28} y={106} width={2} height={6} fill={ink} />
      </>
    ),
  },
  tub: {
    box: [50, 130, 112, 60], z: 3, tint: PORCELAIN,
    draw: ({ tint }) => (
      <>
        <Rect x={148} y={136} width={3} height={10} fill={ink} />
        <Block x={58} y={150} w={94} h={30} fill={tint.fill} shade={tint.shade} />
        <Rect x={54} y={146} width={102} height={6} fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Rect x={64} y={180} width={4} height={8} fill={ink} />
        <Rect x={142} y={180} width={4} height={8} fill={ink} />
      </>
    ),
  },
  duck: {
    box: [116, 130, 22, 18], z: 4,
    attachedTo: () => 'tub',
    draw: () => (
      <>
        <Ellipse cx={126} cy={142} rx={5} ry={3.5} fill={scene.glow} stroke={ink} strokeWidth={0.7} />
        <Circle cx={130} cy={137} r={2.5} fill={scene.glow} stroke={ink} strokeWidth={0.7} />
        <Rect x={132.5} y={136.5} width={2} height={1.2} fill={scene.terracotta} />
      </>
    ),
  },

  // ── Office ──
  corkboard: {
    box: [34, 36, 66, 48], z: 1,
    draw: () => (
      <>
        <Block x={38} y={40} w={58} h={40} fill={scene.cardboard} shade={scene.cardboardDeep} />
        <Rect x={44} y={46} width={13} height={11} fill={scene.white} stroke={ink} strokeWidth={0.5} />
        <Rect x={61} y={48} width={12} height={12} fill={scene.glow} stroke={ink} strokeWidth={0.5} />
        <Rect x={78} y={45} width={12} height={10} fill={scene.peach} stroke={ink} strokeWidth={0.5} />
        <Rect x={50} y={62} width={15} height={11} fill={scene.periwinkle} stroke={ink} strokeWidth={0.5} />
        <Rect x={72} y={63} width={14} height={10} fill={scene.white} stroke={ink} strokeWidth={0.5} />
        {[[50, 46], [67, 48], [84, 45], [57, 62], [79, 63]].map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.2} fill={scene.terracotta} />)}
      </>
    ),
  },
  'filing-cabinet': {
    box: [6, 104, 40, 86], z: 2, tint: { fill: scene.periwinkleDeep, shade: scene.slate },
    draw: ({ tint }) => (
      <>
        <Block x={10} y={110} w={30} h={78} fill={tint.fill} shade={tint.shade} />
        <Ink x1={10} y1={136} x2={40} y2={136} />
        <Ink x1={10} y1={162} x2={40} y2={162} />
        {[120, 146, 172].map((y) => <Rect key={y} x={21} y={y} width={8} height={2} fill={ink} />)}
      </>
    ),
  },
  'computer-desk': {
    box: [52, 112, 108, 78], z: 3, tint: PERIWINKLE,
    draw: ({ tint }) => (
      <>
        <Rect x={76} y={151} width={4} height={37} fill={scene.woodDark} stroke={ink} strokeWidth={0.8} />
        <Rect x={146} y={151} width={4} height={37} fill={scene.woodDark} stroke={ink} strokeWidth={0.8} />
        <Block x={72} y={146} w={82} h={5} fill={scene.wood} shade={scene.woodDark} />
        <Rect x={98} y={118} width={34} height={23} fill={ink} />
        <Rect x={100} y={120} width={30} height={19} fill={scene.periwinkle} />
        <Rect x={113} y={141} width={4} height={5} fill={ink} />
        <Rect x={102} y={143} width={26} height={2} fill={scene.white} stroke={ink} strokeWidth={0.4} />
        <Rect x={140} y={136} width={6} height={10} fill={scene.white} stroke={ink} strokeWidth={0.6} />
        {/* Desk chair */}
        <Rect x={56} y={130} width={6} height={28} rx={2} fill={tint.fill} stroke={ink} strokeWidth={0.8} />
        <Rect x={56} y={156} width={26} height={5} fill={tint.fill} stroke={ink} strokeWidth={0.8} />
        <Rect x={67} y={161} width={3} height={18} fill={ink} />
        <Rect x={58} y={179} width={22} height={3} fill={ink} />
        <Circle cx={59} cy={185} r={2} fill={ink} />
        <Circle cx={79} cy={185} r={2} fill={ink} />
      </>
    ),
  },

  // ── Studio ──
  easel: {
    box: [92, 98, 46, 92], z: 2,
    draw: () => (
      <>
        <Ink x1={100} y1={188} x2={110} y2={104} w={1.4} color={scene.woodDark} />
        <Ink x1={130} y1={188} x2={120} y2={104} w={1.4} color={scene.woodDark} />
        <Ink x1={115} y1={104} x2={115} y2={188} w={1.4} color={scene.woodDark} />
        <Block x={98} y={108} w={34} h={30} fill={scene.white} shade={scene.periwinkleDeep} />
        <Circle cx={108} cy={118} r={4} fill={scene.glow} />
        <Polygon points="100,136 112,124 120,130 130,120 130,136" fill={scene.leaf} />
      </>
    ),
  },
  armchair: {
    box: [20, 122, 64, 66], z: 3, tint: PEACH,
    draw: ({ tint }) => (
      <>
        <Block x={30} y={128} w={44} h={26} fill={tint.fill} shade={tint.shade} />
        <Rect x={28} y={150} width={48} height={22} fill={tint.shade} stroke={ink} strokeWidth={1} />
        <Rect x={24} y={144} width={10} height={30} fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Rect x={70} y={144} width={10} height={30} fill={tint.fill} stroke={ink} strokeWidth={1} />
        <Rect x={30} y={174} width={4} height={12} fill={ink} />
        <Rect x={70} y={174} width={4} height={12} fill={ink} />
      </>
    ),
  },
  desk: {
    box: [144, 110, 92, 80], z: 2,
    draw: () => (
      <>
        <Block x={150} y={140} w={80} h={5} fill={scene.wood} shade={scene.woodDark} />
        <Rect x={154} y={145} width={4} height={43} fill={scene.woodDark} stroke={ink} strokeWidth={1} />
        <Rect x={222} y={145} width={4} height={43} fill={scene.woodDark} stroke={ink} strokeWidth={1} />
        <Rect x={176} y={116} width={30} height={20} fill={ink} />
        <Rect x={178} y={118} width={26} height={16} fill={scene.periwinkle} />
        <Rect x={189} y={136} width={4} height={4} fill={ink} />
        <Rect x={212} y={132} width={6} height={8} fill={scene.white} stroke={ink} strokeWidth={0.7} />
      </>
    ),
  },
  telescope: {
    box: [230, 94, 44, 96], z: 3, tint: PERIWINKLE,
    draw: ({ tint }) => (
      <>
        <Ink x1={256} y1={124} x2={244} y2={188} w={1.4} />
        <Ink x1={256} y1={124} x2={268} y2={188} w={1.4} />
        <Ink x1={256} y1={124} x2={256} y2={188} w={1.4} />
        <Polygon points="236,102 270,120 266,128 232,110" fill={tint.fill} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
        <Rect x={264} y={122} width={6} height={4} fill={ink} />
      </>
    ),
  },

  // ── Greenhouse ──
  'hanging-plants': {
    box: [14, 0, 132, 56], z: 1, tint: PEACH,
    draw: ({ tint }) => (
      <>
        {[[30, 30], [80, 22], [128, 36]].map(([x, len]) => (
          <Fragment key={x}>
            <Ink x1={x} y1={0} x2={x} y2={len} w={0.8} />
            <Leaf cx={x - 5} cy={len + 4} rx={5} ry={3} />
            <Leaf cx={x + 5} cy={len + 6} rx={5} ry={3} light />
            <Leaf cx={x - 3} cy={len + 12} rx={3} ry={4} light />
            <Ellipse cx={x} cy={len + 2} rx={7} ry={4} fill={tint.fill} stroke={ink} strokeWidth={1} />
          </Fragment>
        ))}
      </>
    ),
  },
  planters: {
    box: [4, 148, 98, 42], z: 2,
    draw: () => (
      <>
        {[12, 26, 40, 54, 68, 82].map((x, i) => (
          <Fragment key={x}>
            <Leaf cx={x} cy={162} rx={6} ry={4} light={i % 2 === 0} />
            <Rect x={x - 1} y={154} width={3} height={3} fill={i % 2 ? scene.glow : scene.peach} stroke={ink} strokeWidth={0.4} />
          </Fragment>
        ))}
        <Block x={8} y={166} w={88} h={20} fill={scene.wood} shade={scene.woodDark} />
      </>
    ),
  },
  'lemon-tree': {
    box: [100, 88, 50, 102], z: 3, tint: { fill: scene.terracotta, shade: scene.brick },
    draw: ({ tint }) => (
      <>
        <Rect x={124} y={120} width={4} height={48} fill={scene.woodDark} stroke={ink} strokeWidth={0.8} />
        <Ellipse cx={126} cy={110} rx={18} ry={14} fill={scene.leaf} stroke={ink} strokeWidth={1} />
        <Ellipse cx={119} cy={104} rx={10} ry={8} fill={scene.leafLight} stroke={ink} strokeWidth={1} />
        {[[120, 114], [133, 104], [130, 118], [114, 106]].map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.4} fill={scene.glow} stroke={ink} strokeWidth={0.6} />
        ))}
        <Block x={112} y={166} w={28} h={20} fill={tint.fill} shade={tint.shade} />
      </>
    ),
  },
};
