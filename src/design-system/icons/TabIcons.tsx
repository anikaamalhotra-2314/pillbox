import { color } from '@/design-system/tokens';
import { PixelArt } from './PixelArt';

// 12 by 12 pixel glyphs for the tab bar, in the style of the bell and pill icons. '#' is the outline,
// 'o' the fill, 'c' a second fill (the capsule's other half).
// The active tab paints them in ink and color; inactive tabs are a quiet taupe outline.

const CALENDAR = [
  '..#....#....',
  '############',
  '#oooooooooo#',
  '############',
  '#..........#',
  '#.##.##.##.#',
  '#..........#',
  '#.##.##.##.#',
  '#..........#',
  '#.##.##....#',
  '#..........#',
  '############',
];

const HOUSE = [
  '.....##.....',
  '....#oo#....',
  '...#oooo#...',
  '..#oooooo#..',
  '.#oooooooo#.',
  '############',
  '.#........#.',
  '.#........#.',
  '.#...##...#.',
  '.#..#..#..#.',
  '.#..#..#..#.',
  '.##########.',
];

const CAPSULE = [
  '.......###..',
  '......#ooo#.',
  '.....#ooooo#',
  '....#oooooo#',
  '...##oooooo#',
  '..#cc#oooo#.',
  '.#cccc#oo#..',
  '#cccccc##...',
  '#cccccc#....',
  '#ccccc#.....',
  '.#ccc#......',
  '..###.......',
];

const glyphs = { today: CALENDAR, home: HOUSE, cabinet: CAPSULE } as const;
// The capsule is yellow and peach, like the one in the Figma's tab bar.
const fills = {
  today: { o: color.surface.card, c: color.surface.page },
  home: { o: color.surface.action, c: color.surface.page },
  cabinet: { o: color.surface.action, c: color.surface.card },
} as const;

export type TabIconName = keyof typeof glyphs;

/** A tab bar glyph. Use a multiple of 12 for crisp edges. Decorative: the tab's label carries the meaning. */
export function TabIcon({ name, focused, size = 24 }: { name: TabIconName; focused: boolean; size?: number }) {
  const paint = focused
    ? { '#': color.border.strong, ...fills[name] }
    : { '#': color.text.taken, o: color.surface.page, c: color.surface.page };
  return <PixelArt rows={glyphs[name]} paint={paint} size={size} />;
}
