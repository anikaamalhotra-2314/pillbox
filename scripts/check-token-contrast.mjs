#!/usr/bin/env node
// Fails if a text/surface pairing drops below WCAG AA. Run: node scripts/check-token-contrast.mjs
import { color } from "../src/design-system/tokens/colors.ts";

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [label, foreground, background, minimum ratio]
const AA_TEXT = 4.5;
const pairs = [
  ["text.primary on surface.page", color.text.primary, color.surface.page, AA_TEXT],
  ["text.primary on surface.card", color.text.primary, color.surface.card, AA_TEXT],
  ["text.primary on surface.cardPressed", color.text.primary, color.surface.cardPressed, AA_TEXT],
  ["text.primary on surface.cabinetCard", color.text.primary, color.surface.cabinetCard, AA_TEXT],
  ["text.primary on surface.action", color.text.primary, color.surface.action, AA_TEXT],
  ["text.primary on surface.actionPressed", color.text.primary, color.surface.actionPressed, AA_TEXT],
  ["text.taken on surface.card", color.text.taken, color.surface.card, AA_TEXT],
  ["text.taken on surface.page", color.text.taken, color.surface.page, AA_TEXT],
  ["text.placeholder on surface.page", color.text.placeholder, color.surface.page, AA_TEXT],
];

let failed = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`);
}

// Informational: known gap, mitigated by a bold label and a heavier ring (decision 0009).
const sel = ratio(color.surface.selected, color.surface.page);
console.log(`\nINFO  ${sel.toFixed(2)}:1  surface.selected vs surface.page (fill alone can't carry selection; needs ring + bold)`);

if (failed) {
  console.error(`\n${failed} pairing(s) below AA.`);
  process.exit(1);
}
