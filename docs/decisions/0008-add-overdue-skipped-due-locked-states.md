---
id: "0008"
title: Add the missing dose-card states (due now, overdue, skipped, locked)
date: 2026-09-20
area: design-system
origin: joint
outcome: modified
tool: claude-code
evidence: docs/design/behavior-spec.md
---

## Context
The Figma covers three card states: upcoming, pressed, and taken. A reminder app also needs to show a dose that is due, one that was missed, one deliberately skipped, and one on a future day that can't be checked off yet.

## AI's proposal
Four added states, each with a text label and an accessible state so meaning never rests on color or strike-through alone. Taken and skipped both sink to the bottom. Grace window of 60 minutes before "due" becomes "overdue", and a suggestion that late logging on past days be allowed. Full table in `docs/design/behavior-spec.md`.

## My call
(said in session) "add the missing card states." Then: "grace window should be at 30 minutes, but maybe this could be configurable by the user, since some meds require more strict timing. allow late logging."

Modified: grace window changed from 60 to 30 minutes and made configurable. Late logging accepted as proposed. She has not yet commented on the visual treatments of the four states.

## Why
(said in session) Some medications require stricter timing than others, so one fixed window doesn't fit.
Setting 30 as the default to be more conservative about medication timing, and upgrading to four states to highlight medications that the user missed during a given day or week (the most important use of the app!)

## Where the AI was wrong or limited (optional)
Proposed a single fixed 60-minute window and didn't raise that timing tolerance is medication-specific. That was a domain point she supplied. It also implies a new form field that isn't in the Figma.
