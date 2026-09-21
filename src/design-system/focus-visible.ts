import { Platform } from 'react-native';

// Web only: draw focus rings for keyboard users, not after a mouse click or tap (like CSS :focus-visible).
let usingKeyboard = false;

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener('keydown', () => { usingKeyboard = true; }, true);
  document.addEventListener('pointerdown', () => { usingKeyboard = false; }, true);
}

/** True when a focus ring should be drawn for the element that just received focus. */
export function shouldShowFocusRing(): boolean {
  return Platform.OS !== 'web' || usingKeyboard;
}
