---
id: "0014"
title: Build StackedCard and Text primitives, load B612 Mono, add a dev gallery
date: 2026-09-21
area: design-system
origin: ai
outcome: pending
tool: claude-code
evidence: commit "ai: add StackedCard, Text, font loading, and dev gallery"
---

## Context
Every screen uses the offset-shadow card (dose cards, cabinet cards, the Save button), so it is the first component. It needs a themed `Text` and the loaded font to render at all.

## AI's proposal
- **`StackedCard`** (`src/design-system/primitives/`): a face over a second outlined layer, built from two views because React Native's `shadow*` styles can't draw an outlined shadow. The outer box reserves the offset so the shadow never spills into neighbouring layout. Tones: peach, periwinkle, yellow. Pressed = fill becomes the shadow color, shadow layer removed, face shifts down-right by `stackedShadow.pressTravel`.
- **Finding from the Figma:** the pressed card keeps its size but sits about 5px right and 6px down from rest, roughly 4pt. Less than the 6pt shadow offset, so I did not assume the classic "sink fully into the shadow". Added `pressTravel: 4` as a starting point, flagged as measured from one frame.
- Static cards get no button semantics. Pressable ones get `role=button`, a label, disabled state and a 2pt focus outline.
- **The press is instant, with no animation.** Motion is the owner's to tune, so there are no motion tokens yet.
- **`Text`**: variants map to the size tokens; `accent` selects the italic family, `bold` the bold family.
- Root layout loads B612 Mono (4 files) and holds the splash until loaded, falling back to system fonts on error.
- `/gallery` route shows every state side by side. Placeholder for Storybook.
- Additions to earlier tokens (no values of the owner's changed): `stackedShadow.pressTravel`, `fontFamily.boldItalic`.

Verified: typecheck passes; web export builds; screenshotted in headless Chrome and compared with the Figma (outlined shadow, flat pressed state, olive yellow shadow, italic and bold render). **Not verified:** iOS device or simulator, tap behaviour, the focus ring, VoiceOver.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The first screenshot looked broken (cards running off the right edge). That was headless Chrome's minimum window width, not a layout bug, and was confirmed by re-shooting at 500px.
- The focus ring uses focus/blur events, so on web it will also show after a mouse click. A `:focus-visible`-style rule needs refining.
- The root layout renders nothing until fonts load, so the static web export prerenders blank pages. That hurts first paint and layout stability on web. Follow-up.
- `/gallery` ships in the production build. Should be dev-only or replaced by Storybook.
- Whether ~4pt press travel *feels* right is untested and not something the AI can judge.
