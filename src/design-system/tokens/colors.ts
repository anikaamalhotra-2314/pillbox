// AI first pass, extracted from docs/design/figma/ (unreviewed by the owner).
// Hex values are exact pixel samples from the exports. The names are proposals.

/** Primitives: the raw palette, named by what it is. Only `color` below should be used by components. */
export const palette = {
  cream: '#fcf8f6',
  ink: '#000000',
  peach: '#f2d3c7',
  peachDeep: '#cca293',
  periwinkle: '#dde2ef',
  periwinkleDeep: '#a7b3d2',
  yellow: '#fdee91',
  yellowDeep: '#c3b76d',
  // Warm grays. Both are the accessibility fixes from decision 0009.
  taupe: '#5f5656', // was #736b6b (3.66:1 on peach)
  taupeSoft: '#767070', // was #b3aeae (2.08:1 on cream)
} as const;

/** Semantic tokens: named by what they do. Components use these and never a hex value. */
export const color = {
  surface: {
    page: palette.cream,
    card: palette.peach,
    cardShadow: palette.peachDeep,
    // Observed in the Figma: pressed = the fill becomes the shadow color and the shadow layer goes away.
    cardPressed: palette.peachDeep,
    cabinetCard: palette.periwinkle,
    cabinetCardShadow: palette.periwinkleDeep,
    selected: palette.periwinkle,
    action: palette.yellow,
    actionPressed: palette.yellowDeep,
  },
  text: {
    primary: palette.ink,
    taken: palette.taupe,
    placeholder: palette.taupeSoft,
  },
  border: {
    strong: palette.ink,
  },
  overlay: {
    // Sampled #b1b1b0 over cream works out to black at about 30%.
    scrim: 'rgba(0, 0, 0, 0.3)',
  },
} as const;
