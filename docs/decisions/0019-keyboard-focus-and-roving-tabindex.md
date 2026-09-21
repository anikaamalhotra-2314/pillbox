---
id: "0019"
title: Keyboard focus rings for all controls, and arrow-key navigation in the week strip
date: 2026-09-21
area: a11y
origin: ai
outcome: pending
tool: claude-code
evidence: src/design-system/primitives/Pressable.tsx, src/design-system/focus-visible.ts, src/features/today/WeekStrip.tsx
---

## Context
"Focus states" is in the job description, so this is a place to be careful. A browser test run on the form found three problems on the web build:
1. The Save button kept a black ring after a mouse click. I had flagged that limitation in 0014.
2. Most controls (checkboxes, day toggles, "+" buttons) had no visible focus at all.
3. Pressing Tab walked through every date in the week strip: 14 presses in, focus was still on July, before any dose.

## AI's proposal
- **A shared `Pressable`** replaces React Native's everywhere. It draws a 2pt outline with a 2pt offset, and only when focus came from the keyboard (a small module tracks whether the last input was a key or a pointer, like CSS `:focus-visible`). Clicking shows no ring.
- **Roving tabindex in the week strip:** only the selected day is a Tab stop. Left and Right arrow keys change the selected day and move focus with it. The list scrolls the new day into view.

**Verified in a browser:** after a mouse click there is no ring; nine consecutive Tab stops all show a ring; the second stop is the selected day, followed directly by the dose cards; ArrowRight moves selection and focus together; Right, Left, Left returns to the start; the earlier home and form checks still pass.

**Not verified:** iOS with a hardware keyboard, screen readers, the bottom tab bar (its focus styling comes from the navigation library and was not inspected), Home/End/PageUp keys, and the time picker's focus handling beyond opening and typing.

**Judgment call:** the ring is a plain ink outline with no accent color. Yours to restyle.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The stuck ring and missing rings were my own earlier work. I knew about the first and did not check the rest until a test walked the Tab order.
- `onKeyDown` works in React Native Web but is not in React Native's types, so it is passed as a web-only prop through a narrowly typed handler.
