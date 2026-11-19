import { color } from '@/design-system/tokens';
import { PixelArt } from './PixelArt';

// Drawn to match the Figma's pixel bell: an ink outline around a yellow bell, with a knob and clapper.
const BELL = [
  '.....##.....',
  '....#oo#....',
  '...#oooo#...',
  '..#oooooo#..',
  '..#oooooo#..',
  '..#oooooo#..',
  '..#oooooo#..',
  '.#oooooooo#.',
  '#oooooooooo#',
  '############',
  '....#oo#....',
  '.....##.....',
];

const PAINT = { '#': color.border.strong, o: color.surface.action };

/** Marks a time that has a reminder. Use a multiple of 12 for crisp edges. */
export function BellIcon({ size = 12 }: { size?: number }) {
  return <PixelArt rows={BELL} paint={PAINT} size={size} />;
}
