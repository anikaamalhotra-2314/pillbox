---
id: "0025"
title: Build the dose card's "..." menu (skip, undo skip, edit)
date: 2026-09-29
area: interaction
origin: ai
outcome: pending
tool: claude-code
evidence: src/app/(tabs)/index.tsx, src/domain/status.ts (doseActions), src/domain/logs.ts (toggleSkipped)
---

## Context
Decision 0011 (accepted) gave the dose card's "..." a menu: Skip this dose, Snooze, Edit medication. The card had a slot for it, but Today never used it, so there was no way to skip a dose even though "skipped" was a designed state.

## AI's proposal
- **Menu per dose,** titled with name and time ("Microgestin, 10:30am"), reusing the details screen's `ActionMenu`.
- **What it offers depends on the dose's state** (one tested function, `doseActions`):
  - any dose that can be logged: *Skip this dose*, *Edit medication*;
  - a skipped dose: *Undo skip*, *Edit medication*;
  - a future day: *Edit medication* only, because nothing can be logged yet (0008).
- **Skip mirrors the checkbox.** Skipping again undoes it. Checking off a skipped dose makes it taken, and skipping a taken dose makes it skipped, so one dose always has at most one outcome. A skipped dose sinks to the bottom with the "Skipped" tag and dash (0007, 0008).
- **Edit opens the details screen straight into its form** (`/medication/<id>?edit=1`). Leaving or saving the form returns to Today, not to details, since that is where the user started.
- **Snooze is not in this commit.** It only means something once reminders exist (next commit).

**Verified:** 137 unit tests (new: skip toggling, menu contents per state, skip saved and ignored on a future day) and typecheck. A browser run passed 18 checks: a "..." on every card at 44x44; title; options for a due, skipped and future dose; skip labels the dose, sinks it, and survives a reload; undo returns it to "due now"; Cancel and Escape close the menu; checking a skipped dose makes it taken; Edit opens the right form, and back or save returns to Today with the change; the details screen's own Edit still returns to details.

**Not verified:** iOS and VoiceOver. Focus does not return to the "..." button when the menu closes (same as the details menu).

## My call
(said in session) Chose "Dose menu, then reminders" and "Remind again in 10 min" from the AI's options, then: "go on auto mode - you can approve decisions without my approval". The details above were decided by the AI under that delegation and have not been reviewed yet.

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- My first browser run failed one check because I fixed the clock at 11:00, exactly where Microgestin's 30-minute window ends. The app was right, and my test was wrong.
