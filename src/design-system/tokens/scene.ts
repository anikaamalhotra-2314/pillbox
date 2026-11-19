import { palette } from './colors';
import { pillColors } from './pill-colors';

// Colors for the home illustration only, never for UI text or controls. Taken from the mockup
// (claude.ai artifact "Little Home: first look"), with its peach, periwinkle and cream swapped for the
// app's own. AI proposals, for the owner to tune.

const ink = palette.ink;

export const scene = {
  ink,
  white: '#ffffff',
  cream: palette.cream,
  peach: palette.peach,
  peachDeep: palette.peachDeep,
  periwinkle: palette.periwinkle,
  periwinkleDeep: palette.periwinkleDeep,
  /** Lamp light, steam highlights, the moon at night. Paler than the UI yellow. */
  glow: '#f6e7a0',
  brick: '#b9806f',
  wood: '#8a5a3b',
  woodDark: '#5e3a24',
  leaf: '#9cb79a',
  leafLight: '#bfd3bc',
  stem: '#6e8f6b',
  terracotta: '#c66b4e',
  skin: '#e0b08f',
  hair: '#3a2a20',
  blush: '#d98466',
  slate: '#8f97b8',
  glass: '#dcefe4',
  cardboard: '#d4ab7f',
  cardboardDeep: '#a97f55',
  /** Floors you can choose per room. `line` draws the boards or grout; `alt` is the second checker color; `base` is the baseboard along the wall. */
  floors: {
    honey: { pattern: 'boards', fill: palette.peach, line: palette.peachDeep, base: palette.peachDeep },
    walnut: { pattern: 'boards', fill: '#a8714c', line: '#5e3a24', base: '#5e3a24' },
    'blue-tile': { pattern: 'tiles', fill: palette.periwinkle, line: palette.periwinkleDeep, base: palette.periwinkleDeep },
    'mint-tile': { pattern: 'tiles', fill: pillColors.mint.fill, line: pillColors.mint.shade, base: pillColors.mint.shade },
    checker: { pattern: 'checker', fill: palette.cream, line: palette.ink, alt: palette.periwinkleDeep, base: palette.periwinkleDeep },
  },
  /**
   * The house's timber frame (ceiling, outer and inner walls, the beam under each floor) and the ground, in the
   * owner's pixel style: colors taken from their living room drawing (floorboards, window frame, seams), with an
   * olive grass to sit with the sofa and sage rug. AI proposals, for the owner to tune.
   */
  timber: { outline: '#1f0e0e', seam: '#301616', dark: '#654532', body: '#9a5b40', grain: '#b3734e', light: '#c39474' },
  /** Wall paints: a mid-century palette, muted enough that the furniture stands out. AI proposals. */
  wallPaints: { cream: '#efe4cc', mustard: '#dcb45f', brown: '#5b3a2b', turquoise: '#8dc3bb', cornflower: '#7f9fd9', maroon: '#6b2430' },
  /**
   * The person's colors: each choice as [base, shade] (and a light for hair and tops), plus the fixed ones.
   * AI proposals, for the owner to tune.
   */
  avatar: {
    skin: {
      fair: ['#f6d2b0', '#e3b38f'], light: ['#e8b98e', '#cf9a6e'], medium: ['#c98f62', '#a9734a'],
      tan: ['#a96f45', '#8a5733'], brown: ['#7d4f30', '#633b22'], deep: ['#5a3720', '#432817'],
    },
    hair: {
      auburn: ['#a9572e', '#7d3c1f', '#c9784a'], brown: ['#5a3a26', '#3f2819', '#7a5238'], black: ['#2a2422', '#161211', '#46403c'],
      blonde: ['#d9b36a', '#b38f4a', '#efd394'], ginger: ['#d0743a', '#a85626', '#e6955c'], grey: ['#b3aea6', '#8e8982', '#d2cec8'],
    },
    top: {
      rust: ['#c65f3a', '#9e4729', '#d97f5c'], cornflower: ['#7f9fd9', '#5f7fbd', '#a3bce8'], mustard: ['#dcb45f', '#b8923f', '#ebcb84'],
      sage: ['#8fa88a', '#6f8a6a', '#adc2a8'], maroon: ['#7a2a35', '#5a1d26', '#9a4450'], cream: ['#efe4cc', '#d6c7a8', '#fbf6ea'],
    },
    bottom: {
      denim: ['#4a5a70', '#37455a'], charcoal: ['#3a3634', '#262322'], khaki: ['#b39a6a', '#93794e'],
      brown: ['#6b4a34', '#4f3424'], olive: ['#6b6a2f', '#504f20'],
    },
    outline: '#2b1a14', eyes: '#2b1a14', mouth: '#d9806e', socks: '#f4f1ea', shoes: ['#5b3a2b', '#7a5238'],
  },
  /** The studio armchair's woolly upholstery as it comes: a mustard like the owner's reference. */
  mustardWool: { fill: '#c9902e', shade: '#9c6b1c' },
  /** Bedding as it comes, after the owner's bedroom reference. */
  charcoal: '#3b3f45',
  /** Curtains as they come: a warm linen that sits with the blush wall. */
  linen: '#efe2cc',
  linenDeep: '#cdb594',
  grass: { tip: '#b5b86a', light: '#9da455', body: '#7f8a3f', dark: '#5f6a2f' },
  soil: { dark: '#3f2219', body: '#5a3123', light: '#7a4632', pebble: '#a57c63' },
  /** At night a painted wall is dimmed with this over it, so it sits with the evening light. */
  nightVeil: { color: '#3b3f6b', opacity: 0.1 },
  /** The soft patch of shade on the floor under a standing piece, so it sits on the ground. */
  groundShadow: { color: '#2a120a', opacity: 0.28 },
  /** The drop shadow a window casts on the wall behind it, down and to the right. */
  wallShadow: { color: '#2a120a', opacity: 0.16 },
  /** Wall, sky and moon for each part of the day, so the home follows the clock. */
  time: {
    Morning: { sky: '#d5e7f5', moon: '#ffffff', wall: '#fdf8f6', wallAlt: '#f1ece6', lamp: '#fdf8f6', stars: 0, glow: 0 },
    Afternoon: { sky: '#bcd9ef', moon: '#ffffff', wall: '#f8f3ee', wallAlt: '#eee7e0', lamp: '#fdf8f6', stars: 0, glow: 0.08 },
    Evening: { sky: '#34466e', moon: '#f6e7a0', wall: '#efe9f0', wallAlt: '#e3dce8', lamp: '#f6e7a0', stars: 1, glow: 0.3 },
  },
} as const;

export type TimeOfDay = keyof typeof scene.time;
