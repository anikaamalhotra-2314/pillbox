---
id: "0015"
title: Dose status and day ordering as pure, tested domain functions
date: 2026-09-21
area: domain
origin: ai
outcome: pending
tool: claude-code
evidence: src/domain/, 25 tests in src/domain/__tests__/
---

## Context
The home screen's behavior (which state a card is in, and the order of the day) had been decided in 0006-0008 but only as prose. Encoding it as pure TypeScript with tests means the rules are checked, not remembered, and the UI can stay thin.

## AI's proposal
`src/domain/` with no React or Expo imports:
- **Doses are derived, logs are stored.** A `Dose` is computed from a medication's schedule; only the user's action (`DoseLog`: taken or skipped, plus `loggedAt`) is stored.
- **Wall-clock time, not UTC.** A dose is "10:30 on 2025-03-15" in the device's local zone.
- **`doseStatus`** returns upcoming / due / overdue (today), missed (past day), taken / skipped (from a log), locked (future day). Grace window defaults to 30 minutes and is per medication (0008).
- **`sortDayEntries`**: active doses by scheduled time, then resolved doses (taken and skipped) by scheduled time, not by when they were logged (0007).
- **Late logging** is allowed on any day up to today; `logDose` refuses future days and records the real time in `loggedAt`, so late logs are visible (0008).
- Tests include your Figma home screen: at 10:35 on Saturday March 15 the day comes out as due, upcoming, upcoming, then the taken 6:30 at the bottom.

**Judgment calls the AI made that you did not specify. Please review:**
1. The grace window is inclusive at both ends: exactly at the scheduled time and exactly at the end of the window still count as "due".
2. "Missed" is the label for an unlogged dose on a past day. A dose that is overdue at 23:50 becomes "missed" at midnight, because the day rolled over.
3. Skipped doses sink to the bottom together with taken ones.
4. `loggedAt` is stored, so the UI can later show "taken at 6:42 AM" or flag late logs.

Verified: 25 tests pass; typecheck passes. I also broke the code on purpose twice (an exclusive grace boundary, and resolved doses no longer sinking) and the tests caught both.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- `npx expo install ... -- --save-dev` put the Jest packages in `dependencies`; moved to `devDependencies` by hand.
- TypeScript 6 no longer auto-includes `@types/*`, so the tsconfig now lists `"types": ["jest"]`. The AI did not know that.
- Not covered: daylight-saving edge cases beyond "a nonexistent local time still gives a valid date", and time-zone changes while travelling. Tests run in the machine's zone.
- Notification scheduling (the rolling window and reconcile from the architecture plan) is not built yet.
