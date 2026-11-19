import { color } from '@/design-system/tokens';
import { PixelArt, type Sprite } from './PixelArt';

// 12 by 12 pixel glyphs for the tab bar, in the style of the bell and pill icons. '#' is the outline.
// The active tab is drawn in full color. Inactive tabs are a quiet taupe line drawing: whatever is ink
// when active (plus any marks listed) turns taupe, and every other fill turns to the page color.

const ink = color.border.strong;

// A calendar: peach header, day marks, and today's square in ink.
const CALENDAR: Sprite = {
  rows: [
    '...#....#...',
    '############',
    '#hhhhhhhhhh#',
    '#hhhhhhhhhh#',
    '############',
    '#cccccccccc#',
    '#cddcddcddc#',
    '#cccccccccc#',
    '#cddcddcxxc#',
    '#cccccccccc#',
    '#cddcddcccc#',
    '############',
  ],
  paint: { '#': ink, h: color.surface.cardShadow, c: color.surface.page, d: color.surface.cardShadow, x: ink },
};

// A yellow house with a peach-brown roof, a periwinkle window and an ink door.
const HOUSE: Sprite = {
  rows: [
    '.....##.....',
    '....#rr#....',
    '...#rrrr#...',
    '..#rrrrrr#..',
    '.#rrrrrrrr#.',
    '############',
    '.#oooooooo#.',
    '.#owwooooo#.',
    '.#owwoddoo#.',
    '.#ooooddoo#.',
    '.#ooooddoo#.',
    '.##########.',
  ],
  paint: { '#': ink, r: color.surface.cardShadow, o: color.surface.action, w: color.surface.cabinetCardShadow, d: ink },
};

// A yellow and peach capsule, like the one in the Figma's tab bar. 'o' and 'c' are its two halves.
const CAPSULE: Sprite = {
  rows: [
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
  ],
  paint: { '#': ink, o: color.surface.action, c: color.surface.card },
};

const glyphs = { today: CALENDAR, home: HOUSE, cabinet: CAPSULE } as const;

export type TabIconName = keyof typeof glyphs;

const inactive = (paint: Sprite['paint'], marks: string[] = []) =>
  Object.fromEntries(Object.entries(paint).map(([k, v]) => [k, v === ink || marks.includes(k) ? color.text.taken : color.surface.page]));

const inactivePaint = {
  today: inactive(CALENDAR.paint, ['d']), // keep the day marks
  home: inactive(HOUSE.paint),
  cabinet: inactive(CAPSULE.paint),
};

/** A tab bar glyph. Use a multiple of 12 for crisp edges. Decorative: the tab's label carries the meaning. */
export function TabIcon({ name, focused, size = 24 }: { name: TabIconName; focused: boolean; size?: number }) {
  const { rows, paint } = glyphs[name];
  return <PixelArt rows={rows} paint={focused ? paint : inactivePaint[name]} size={size} />;
}
