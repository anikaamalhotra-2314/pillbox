---
id: "0012"
title: Draft design tokens (two-layer colors, type, layout) from the Figma exports
date: 2026-09-20
area: design-system
origin: ai
outcome: modified
tool: claude-code
evidence: src/design-system/tokens/, scripts/check-token-contrast.mjs
---

## Context
Every component depends on tokens, so they come first. The Figma is a set of PNG exports, not a variables file. Colors could be read exactly from pixels. Sizes could only be estimated.

## AI's proposal
- **Two layers** in `colors.ts`: `palette` (raw values named by what they are) and `color` (semantic tokens named by what they do). Components only use `color`.
- **Exact colors** from pixel sampling: cream `#fcf8f6`, peach `#f2d3c7` / `#cca293`, periwinkle `#dde2ef` / `#a7b3d2`, yellow `#fdee91` / `#c3b76d`, ink `#000000`. The two accessibility fixes from 0009 are included (`taupe`, `taupeSoft`).
- **Two findings about the design system itself:**
  1. The offset shadow is a second *outlined* layer, not a blur shadow, so it needs a component and can't be a `shadow*` style.
  2. Pressed state = the fill becomes the shadow color and the shadow goes away. The same rule appears on cards and on the Save button.
- **Estimated, not measured:** font sizes (13 / 16 / 18 / 22, from ink width, +/- 1pt), corner radius, and the 4pt spacing scale. Only the 20pt gutter, 1pt border and 6pt shadow offset were measured. The estimates assume a 393pt-wide frame.
- `check-token-contrast.mjs` fails the build if a text/surface pair drops below 4.5:1, so 0009 stays enforced.
- Deliberately **not drafted**: motion tokens and the font family, which are hers to decide.

## My call
(said in session) Supplied the exact Figma values: "cream: FDF8F6 peach: F8D3C6/D5A292, periwinkle DDE3F1/A6B4D6, yellow FFEF84/C6B961 the font is b612 mono, but any native monospace font works."

Modified: all eight hex values replaced with hers; font family set to B612 Mono (italic and bold as their own families) with a system monospace as an acceptable fallback. 

(said in session) "font heading is 24, title of pill card is 17, subheading of pill card is 12, corner radius is 5"

Modified again: sizes and radius replaced with hers (my estimates were 22 / 18 / 13 and radius 4). Renamed the size tokens to her vocabulary (`heading`, `title`, `subheading`) and dropped my `body: 16`, which nothing in the design maps to. The 4pt spacing scale beyond the 20pt gutter is still unreviewed.

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- Can't identify the typeface from a PNG. `Menlo` is a stand-in.
- Font sizes rest on an assumed 393pt frame and 0.6em advance; one estimate (time labels) came out unreliable and was dropped instead of guessed.
- Sampling initially landed on the Figma canvas background more than once; corrected by cross-checking regions.
- **Type sizes and radius were off by 1 to 2pt** (heading 22 vs. 24, title 18 vs. 17, subheading 13 vs. 12, radius 4 vs. 5). Inferring size from ink width in an export is too coarse for a design system.
- **Every sampled color was off from the real Figma value**, by up to 6 levels in a channel (peach red `f2` vs `f8`). PNG exports don't carry the exact source color. The contrast conclusions in 0009 survived, but only re-checking showed that.
