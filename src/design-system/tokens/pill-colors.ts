import { palette } from './colors';

/**
 * Pill icon colors: a fill and a darker shade for the lower edge, like the stacked cards.
 * Peach, periwinkle and yellow are the app's palette. Mint, lilac and rose are NEW, picked to sit
 * beside them at the same softness. They are proposals for the owner to adjust.
 */
export const pillColors = {
  periwinkle: { fill: palette.periwinkle, shade: palette.periwinkleDeep },
  peach: { fill: palette.peach, shade: palette.peachDeep },
  yellow: { fill: palette.yellow, shade: palette.yellowDeep },
  mint: { fill: '#cdeadb', shade: '#9ccdb3' },
  lilac: { fill: '#e2d8f2', shade: '#b8a5d9' },
  rose: { fill: '#f7cad6', shade: '#dd9db2' },
} as const;
