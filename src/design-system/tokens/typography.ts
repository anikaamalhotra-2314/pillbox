// AI first pass. Sizes are ESTIMATED from ink width in the PNG exports, assuming a
// monospace face with 0.6em advance and a 393pt-wide frame. Expect +/- 1pt. Confirm in Figma.

export const fontFamily = {
  // TODO(anika): which monospace face does the Figma use? Menlo (ships on iOS) is a stand-in.
  mono: 'Menlo',
} as const;

export const fontSize = {
  caption: 13, // card subtitle: "1 pill | 125mg"
  body: 16,
  title: 18, // medication name on cards, month label, weekday labels
  display: 22, // greeting: "Good Morning, Anika."
} as const;

// The design uses italic as an accent (name in the greeting, time labels, month, form labels).
export const fontStyle = {
  regular: 'normal',
  accent: 'italic',
} as const;
