---
id: "0023"
title: Build the Medicine Cabinet, and hide inactive tabs from the keyboard and screen readers
date: 2026-09-21
area: interaction
origin: ai
outcome: pending
tool: claude-code
evidence: src/app/(tabs)/cabinet.tsx, src/design-system/primitives/FocusedScene.tsx
---

## Context
The Cabinet is the last unbuilt screen in the Figma: a titled list of periwinkle cards, one per medication, with a "+" at the bottom.

## AI's proposal
- **Cabinet:** the title "Anika's Medicine Cabinet" (17pt italic, measured from the Figma), one periwinkle stacked card per medication (name and the same "1 pill | 125mg" line), a ruled bar with a "+" that opens Add, and an empty-state message. Tapping a card opens its details.
- **Alphabetical order,** ignoring case and accents. Your Figma shows no order; this keeps the list predictable as it grows. A medication with two times a day is one card, not two.
- **One shared subtitle function.** The "notes | dosage" line was built by hand in three places; it now lives in one tested function used by Today, Details and the Cabinet.

**A bug found by testing, present since the tabs were added in 0017:** the tab navigator keeps the inactive tab mounted and, on web, still laid out behind the active one. It was marked `aria-hidden` but its buttons stayed reachable with the Tab key, so a keyboard user on the Cabinet could land on invisible Today controls. The navigator's own `detachInactiveScreens` option did not change this. A small wrapper (`FocusedScene`) hides an unfocused tab with `display: none`, which removes it from the tab order and the accessibility tree while keeping its state (Today remembers the selected day).

**Verified:** 95 unit tests and typecheck. A browser run passed 11 cabinet checks: title, selected tab, alphabetical single cards, no exposed controls from the hidden tab, open and back, add via "+" with the new medication in its sorted place, dosage-only subtitle when there are no notes, heading semantics, Today keeping its selected day, and the empty message. All earlier browser suites (form 13, keyboard 4, persistence 14, details and edit 21, legacy data 5) still pass.

**Not verified:** iOS and VoiceOver.

**Judgment calls to review:**
1. Alphabetical order (versus most recent first, or a custom order).
2. The "..." is omitted from cabinet cards. Nothing is designed for it, and a dead button would be worse than none. Quick actions (for example delete) could go there.
3. The smiley next to the title is omitted until the pixel art arrives.
4. The empty-state and title wording are placeholders; the title always uses "'s", so a name ending in "s" reads "Chris's".
5. There is no swipe-to-delete or reordering.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The tab-hiding bug was in my own layout from 0017. Every earlier browser test passed because they only looked at the active tab. It surfaced only when a query on the Cabinet returned Today's cards.
- My first cabinet test filtered cards by a "|" in the label, which wrongly excluded a medication with no notes.
