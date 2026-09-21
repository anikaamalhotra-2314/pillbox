// Pixel art for the pill icons, one 16x16 grid per shape. Plain data, so it can be tested without a renderer.
//   .  transparent      #  ink outline      o  fill color      x  shade color (the second half of a capsule)
//   h  highlight (cream)                      d  shade edge: added automatically, never written here
// Shapes are drawn to match the Figma's pixel pill: an ink outline, a flat fill, a score line.

import type { PillShape } from '@/domain/pill-icon';

export const GRID = 16;

const round = [
  '................',
  '.....######.....',
  '...##oooooo##...',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '...##oooooo##...',
  '.....######.....',
  '................',
];

// The Figma's icon: a diagonal score from the upper left to the lower right.
const scored = round.map((row, r) => (r >= 3 && r <= 12 ? row.slice(0, r) + '#' + row.slice(r + 1) : row));

const oval = [
  '................',
  '................',
  '................',
  '...##########...',
  '..#oooooooooo#..',
  '.#oooooooooooo#.',
  '#oooooooooooooo#',
  '#oooooooooooooo#',
  '#oooooooooooooo#',
  '#oooooooooooooo#',
  '.#oooooooooooo#.',
  '..#oooooooooo#..',
  '...##########...',
  '................',
  '................',
  '................',
];

const capsule = [
  '................',
  '................',
  '................',
  '................',
  '..############..',
  '.#oooooo#xxxxx#.',
  '#ooooooo#xxxxxx#',
  '#ooooooo#xxxxxx#',
  '#ooooooo#xxxxxx#',
  '#ooooooo#xxxxxx#',
  '.#oooooo#xxxxx#.',
  '..############..',
  '................',
  '................',
  '................',
  '................',
];

const softgel = [
  '................',
  '......####......',
  '....##oooo##....',
  '...#hhoooooo#...',
  '..#hooooooooo#..',
  '..#hooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '...#oooooooo#...',
  '....##oooo##....',
  '......####......',
  '................',
];

const square = [
  '................',
  '..############..',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '.#oooooooooooo#.',
  '..############..',
  '................',
];

const raw: Record<PillShape, string[]> = { scored, round, oval, capsule, softgel, square };

/** Adds the shade: a fill pixel with an outline pixel to its right or below becomes "d". */
function shade(rows: string[]): string[] {
  return rows.map((row, r) =>
    [...row].map((ch, c) => (ch === 'o' && (row[c + 1] === '#' || rows[r + 1]?.[c] === '#') ? 'd' : ch)).join(''),
  );
}

export const pillBitmaps: Record<PillShape, string[]> = {
  scored: shade(scored),
  round: shade(round),
  oval: shade(oval),
  capsule: shade(capsule),
  softgel: shade(softgel),
  square: shade(square),
};

export const rawPillShapes = raw;
