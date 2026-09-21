---
id: "0016"
title: Build DoseCard, Checkbox, and status formatting for the seven dose states
date: 2026-09-21
area: design-system
origin: ai
outcome: pending
tool: claude-code
evidence: src/features/today/DoseCard.tsx, src/design-system/primitives/Checkbox.tsx, src/domain/format.ts
---

## Context
The home screen is a list of dose cards. Decisions 0007 and 0008 fixed the states and behavior; the visual treatments were only proposed in `docs/design/behavior-spec.md`. This implements them.

## AI's proposal
- **Layout:** a time row above a `StackedCard`: bell (if alerts are on), italic time, and a short text tag. Inside the card: name and subtitle centered in the space left of the checkbox, "..." button top-left, checkbox on the right.
- **Three separate touch targets** (open details, check off, "..." menu), so no button sits inside another. The open target drives the whole-card pressed look.
- **Treatments:**

| State | Look |
|---|---|
| upcoming | Plain card |
| due | Bold time, tag "Due now" |
| overdue | Bold time, tag "Overdue" |
| missed | Bold time, tag "Missed" |
| taken | Dimmed outline and text, strike-through, ✓, tag "Taken 6:42am" |
| skipped | Dimmed, no strike-through, dash in the box, tag "Skipped" |
| locked | Dimmed, checkbox disabled, no bell, no tag |

- **Measured from your Figma:** the taken card's border, its shadow outline and its checkbox are all one gray (`#736b6b`). Added as `color.border.dimmed`. Taken *text* uses the accessible taupe from 0009.
- **Accessibility:** each card's main label reads "Synthroid, 1 pill | 125mg, 10:30 AM, due now"; the checkbox and menu have their own labels; the visible time row is hidden from assistive tech because the label already covers it; the checkbox has a 44pt touch area via hit slop and the menu button is 44x44.
- Time formatting and spoken phrases live in `src/domain/format.ts` with 9 tests (34 total now pass).

Verified: typecheck; 34 tests; web screenshot of all seven states; a DOM dump of the web build confirming labels, roles, `aria-checked`, `aria-disabled` and `aria-hidden`. **Not verified:** iOS, VoiceOver, real touch behavior, and large Dynamic Type sizes.

**Judgment calls to review:**
1. Due, overdue and missed look the same apart from the word. Is text enough, or should they differ visually (for example a heavier outline)? Overdue is the state that matters most to users.
2. The "Taken 6:42am" tag is my addition, using the log's real time.
3. Locked cards are dimmed like resolved ones. With an empty disabled box and no tag they should not read as taken, but that is a judgment call.
4. The bell is a placeholder yellow dot and the "..." is text dots. Both need your pixel-art exports.
5. The subtitle ("1 pill | 125mg") is composed by the caller. A medication currently has only `dosage` and `notes`, so what feeds "1 pill" is open.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The first version used `accessibilityState` and `accessibilityElementsHidden`, which React Native Web does not translate. The web build had no `aria-checked` and no `aria-hidden`. Caught only by dumping the rendered DOM. Switched to the `aria-*` props.
- The same DOM dump then showed a second bug: the skipped card reported `checked=true`, contradicting its own "Mark as taken" label. Fixed so checked means taken only.
- There are no component tests yet (React Native Testing Library is not installed), so this rests on the DOM check and screenshot. That is a gap.
