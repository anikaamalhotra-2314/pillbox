---
id: "0017"
title: Build the Today home screen: week strip, sorted day list, store, and tabs
date: 2026-09-21
area: interaction
origin: ai
outcome: pending
tool: claude-code
evidence: src/app/(tabs)/index.tsx, src/features/today/WeekStrip.tsx, src/store/pillbox.ts
---

## Context
With the domain rules (0015) and `DoseCard` (0016) in place, the home screen from the Figma could be assembled. It also implements the open interaction decisions 0006 (week strip) and 0007 (taken doses sink).

## AI's proposal
- **Screen:** greeting, month bar with a "+" button, the week strip, and the day's doses in the sorted order from the domain layer. Checking a dose off calls one pure function (`toggleTaken`), so undo, late logging and the future-day lock are the tested domain rules and not UI logic.
- **`WeekStrip`:** seven days visible, 60 days scrollable each way, snapping by day, centered on today when it first appears. Each day is a button with a spoken label ("Saturday, March 15, today") and a selected state.
- **Marking (my design, following 0009):** the selected day is a filled circle with a stacked shadow, a 2pt ring and a bold label; today, when not selected, is a thin 1pt ring. Selection never relies on fill alone.
- **Store:** Zustand, in memory, seeded from the Figma (Synthroid x2, Microgestin, Calcium). It does not persist yet.
- **Clock:** `useNow` refreshes every 30 seconds and when the app returns to the foreground, so a dose moves from due to overdue without a reload.
- **Tabs and placeholders:** Today and Cabinet tabs, with placeholder screens for Cabinet, Add Medication and Medication details, so every button leads somewhere.
- **Web:** the app stays a phone-width column (max 480pt) on wide screens.

**Verified:** 45 domain tests; typecheck; and a browser-driven run of the web build, which confirmed:
- today's cell is centered in the strip (x=197 vs. viewport center 196.5);
- checking a dose sinks it to the bottom with "taken at 2:37 PM", and checking again restores the order;
- tomorrow's 4 doses are all locked, all 4 checkboxes disabled, and a forced click does nothing;
- yesterday's doses read "missed", late logging works, and yesterday's log does not appear on today;
- tapping a card opens `/medication/synthroid`.

**Not verified:** iOS, VoiceOver, strip snapping and scrolling on a touch device, and keyboard navigation.

**Judgment calls to review:**
1. The selected-day and today markers above. The Figma only shows the selected one.
2. The greeting follows the time of day (Morning / Afternoon / Evening). The Figma shows "Good Morning".
3. No "back to today" control yet. The strip starts on today, but after scrolling away there is no shortcut.
4. The card subtitle is composed as `notes | dosage`. That is a guess (open since 0016).
5. The star next to the greeting is omitted, and tab icons are text labels. Both wait for your pixel art.
6. The gap between cards (20pt) is estimated from the Figma.
7. The "..." menu is not passed to cards yet, because there is no menu to open. No dead button is shown.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The tab navigator used its own default background, so the page rendered light gray instead of your cream. Found by looking at the screenshot, not by any test. Fixed with the tab scene style.
- My first browser test chose a past day when I meant a future one, so the locked state went untested until a second run. The results above come from that second run.
- The browser test is an ad hoc script kept outside the repo. It should become a real end-to-end test.
- On web, the strip scrolls by trackpad or touch. Mouse-dragging is not supported.
