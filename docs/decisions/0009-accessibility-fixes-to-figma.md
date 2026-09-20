---
id: "0009"
title: Fix contrast, day-picker labels, and hit targets from the Figma
date: 2026-09-20
area: a11y
origin: joint
outcome: accepted
tool: claude-code
evidence: docs/design/behavior-spec.md
---

## Context
The AI flagged likely accessibility problems in the Figma exports and measured them. Colors were sampled from the PNG exports, so anti-aliasing can skew values slightly. Confirm against the Figma variables before shipping.

| Element | Measured | Result |
|---|---|---|
| Taken card text `#736b6b` on peach `#f2d2c7` | 3.66:1 | Fails 4.5:1 for small text |
| Taken time label `#736b6b` on cream `#fcf8f6` | 4.92:1 | Passes |
| Form placeholder `#b3aeae` on cream `#fcf8f6` | 2.08:1 | Fails 4.5:1 |
| Selected day fill `#dde2ef` vs cream | 1.23:1 | Selected vs unselected differs by a barely visible fill |

The day picker also uses M T W **R** F S **N**, which a screen reader reads as bare letters, and the checkboxes and day circles look smaller than the 44pt minimum touch target.

## AI's proposal
- Taken card text `#5f5656` (5.02:1 on peach). Keep the dimmed look through the card surface and strike-through, not through low-contrast text.
- Placeholder `#767070` (4.6:1 on cream).
- Day picker: keep the circles, change labels to Mo Tu We Th Fr Sa Su. Every circle gets a full-weekday accessibility label and a selected state. Make selection legible without relying on fill alone (bold label plus a heavier ring).
- 44pt hit areas on checkboxes and day circles via hit slop, without changing the visual size.

## My call
(said in session) "fix those design choices for accessibility." Then, on seeing the proposed fixes: "i like your proposed fixes." Accepted as proposed.

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
Its first color sampling hit the Figma canvas background instead of the app's cream and had to be redone. The corrected values above came from a second pass. A tool measures contrast, but only VoiceOver testing will show how the day picker actually reads.
