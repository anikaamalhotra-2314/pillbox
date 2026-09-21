---
id: "0021"
title: Build the medication details, edit and delete flows, and add a start date to medications
date: 2026-09-21
area: interaction
origin: ai
outcome: pending
tool: claude-code
evidence: src/app/medication/[id].tsx, src/features/medication-details/, src/domain/day.ts (startDate)
---

## Context
The Figma shows the details screen as only a header, an icon and the dose card, and edit mode as only a title, an icon, the card and a "Save Changes!" button. It has no fields for edit, no summary of a medication's settings, and no delete. Decision 0011 (accepted) said the "..." on the details screen should hold Pause or Delete.

## AI's proposal
- **Details:** back, the medication's name, and an "Edit" button (the design's sliders icon is a placeholder text label until you export it); an icon band with the "..." button; a summary block (dosage, notes, days, grace window, alerts); and today's doses for this medication as real, checkable dose cards.
- **Edit:** the same header pattern ("Edit Medication"), the icon, then the add form prefilled, with your "Save Changes!" label. Back discards unsaved changes.
- **Delete:** "..." opens a menu with "Delete medication", then a confirmation. Deleting removes the medication and its history. "Keep" comes first so keyboard focus lands on the safe choice; "Delete" is inverted (filled) so it reads as different without relying on color. Pause is not built (it would need a new field).
- **Unknown or deleted medication** shows a "not found" screen instead of crashing.
- **A start date on every medication.** While planning this I found a real bug: a newly added medication showed "missed" for every past day, as if the user had failed to take something before it existed. Doses now never appear before a medication's start date. It is set when added; edits keep it. The sample data starts on the day you first open the app. The field is optional, so data saved before this change still loads (verified below).

**Verified:** 91 unit tests and typecheck. A browser-driven run passed 21 checks: open, dose toggled on details and reflected on Today, prefilled edit form, error on clearing the title, back discards changes, a real edit (dosage plus a new time) that survives a reload with times sorted, "Keep" leaves the medication, delete removes it and its history from storage, an unknown id shows "not found", and yesterday is empty for a medication added today. Another run confirmed data saved by the previous version loads without a backup being written, and that an established medication still reads "missed" on past days with working late logging. All earlier browser checks still pass.

**Not verified:** iOS, VoiceOver, and the modals' focus handling beyond opening and choosing.

**Design gaps and judgment calls to review:**
1. **Edit has no fields in the Figma.** I reused the add form. You may want a different layout.
2. **The summary block is my addition.**
3. **Deleting also deletes history, and there is no undo.** The alternative is to keep history hidden. Deleting a medication you may want back is easy to do by mistake.
4. **Editing days or times changes how past days look.** The model derives doses from the current schedule, so a new time also applies to earlier dates, and logs for a removed time stay stored but are hidden. The edit form says so in one line (placeholder copy). The real fix is to keep a history of schedule changes and apply an edit from today forward. That is a bigger change and needs your call on how much history matters.
5. **Back from edit discards silently.** No "unsaved changes" prompt.
6. Pause is left out; "Edit" is a text label until the sliders icon arrives; the icon is a placeholder circle.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The start-date bug is a design flaw in my earlier domain model (0015), not something the tests I wrote back then could catch. It only showed up when I thought through the add-then-look-at-yesterday case for this screen.
- I marked non-interactive info as `accessible`, which React Native Web turns into keyboard Tab stops. I suspected this before testing and removed it; a check now confirms no non-interactive element is a Tab stop.
- My browser tests broke twice on my own assumptions (a hidden Today screen still in the page; past days now legitimately empty). Neither was an app bug.
