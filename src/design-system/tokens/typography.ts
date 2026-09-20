// Sizes are the owner's Figma values. Not yet defined: month label (awaiting confirmation) and
// form labels / placeholder text.

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
  heading: 24, // greeting; screen titles ("Add New Medication", medication name)
  title: 17, // pill card name; time labels; weekday names; button text ("Save Changes!")
  numeral: 16, // date numbers in the week strip
  subheading: 12, // pill card: "1 pill | 125mg"
} as const;
