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
  /** Floors you can choose per room. `line` draws the boards or grout; `alt` is the second checker color. */
  floors: {
    honey: { pattern: 'boards', fill: palette.peach, line: palette.peachDeep },
    walnut: { pattern: 'boards', fill: '#a8714c', line: '#5e3a24' },
    'blue-tile': { pattern: 'tiles', fill: palette.periwinkle, line: palette.periwinkleDeep },
    'mint-tile': { pattern: 'tiles', fill: pillColors.mint.fill, line: pillColors.mint.shade },
    checker: { pattern: 'checker', fill: palette.cream, line: palette.ink, alt: palette.periwinkleDeep },
  },
  /** At night a painted wall is dimmed with this over it, so it sits with the evening light. */
  nightVeil: { color: '#3b3f6b', opacity: 0.1 },
  /** Wall, sky and moon for each part of the day, so the home follows the clock. */
  time: {
    Morning: { sky: '#dde3f1', moon: '#ffffff', wall: '#fdf8f6', wallAlt: '#f1ece6', lamp: '#fdf8f6', stars: 0, glow: 0 },
    Afternoon: { sky: '#c9d3ec', moon: '#ffffff', wall: '#f8f3ee', wallAlt: '#eee7e0', lamp: '#fdf8f6', stars: 0, glow: 0.08 },
    Evening: { sky: '#3b3f6b', moon: '#f6e7a0', wall: '#efe9f0', wallAlt: '#e3dce8', lamp: '#f6e7a0', stars: 1, glow: 0.3 },
  },
} as const;

export type TimeOfDay = keyof typeof scene.time;
