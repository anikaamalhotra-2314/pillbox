// AI first pass. Measured from the PNG exports, assuming a 393pt-wide frame (export scale about 1.27).

export const space = {
  gutter: 20, // measured: left/right margin of cards on the home screen
  // Everything below is a conventional 4pt scale, not measured from the Figma. Owner confirmed it is fine.
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;

export const borderWidth = {
  default: 1, // measured about 1.3px in the export, which is 1pt at export scale
} as const;

export const radius = {
  card: 5, // owner's Figma value
} as const;

/**
 * The signature offset shadow is NOT a blur shadow. In the Figma it is a second, outlined
 * layer behind the card (black 1px border, deeper fill). Build it as two stacked views,
 * or as a component, not as a `shadow*` style.
 */
export const stackedShadow = {
  offset: 6, // measured 6.3 to 6.7pt; x and y equal. Owner confirmed.
  // Pressed cards keep their size, lose the shadow, and sit down-right of their resting spot.
  // Measured from ONE Figma frame at about 4 to 5pt. Less than `offset`. A starting point: tune by feel.
  pressTravel: 4,
} as const;
