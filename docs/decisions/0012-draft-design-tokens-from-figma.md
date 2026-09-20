---
id: "0012"
title: Draft design tokens (two-layer colors, type, layout) from the Figma exports
date: 2026-09-20
area: design-system
origin: ai
outcome: pending
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
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- Can't identify the typeface from a PNG. `Menlo` is a stand-in.
- Font sizes rest on an assumed 393pt frame and 0.6em advance; one estimate (time labels) came out unreliable and was dropped instead of guessed.
- Sampling initially landed on the Figma canvas background more than once; corrected by cross-checking regions.
