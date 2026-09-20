// Sizes are ESTIMATED from ink width in the PNG exports, assuming a monospace face with 0.6em
// advance and a 393pt-wide frame. Expect +/- 1pt. Confirm in Figma.

export const fontFamily = {
  // B612 Mono, per the Figma. Names follow @expo-google-fonts/b612-mono; verify them on install.
  // The design uses italic as an accent (greeting name, time labels, month, form labels). Custom
  // fonts need the italic file as its own family, so there is no separate fontStyle token.
  regular: 'B612Mono_400Regular',
  italic: 'B612Mono_400Regular_Italic',
  bold: 'B612Mono_700Bold',
  // Any system monospace is acceptable while the font loads or if it fails to.
  fallback: 'Menlo',
} as const;

export const fontSize = {
  caption: 13, // card subtitle: "1 pill | 125mg"
  body: 16,
  title: 18, // medication name on cards, month label, weekday labels
  display: 22, // greeting: "Good Morning, Anika."
} as const;
