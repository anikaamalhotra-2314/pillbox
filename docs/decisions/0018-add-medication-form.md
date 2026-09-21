---
id: "0018"
title: Build the Add Medication form (shared with Edit), with validation and a time picker
date: 2026-09-21
area: interaction
origin: ai
outcome: pending
tool: claude-code
evidence: src/features/medication-form/, src/domain/medication.ts, src/domain/time.ts
---

## Context
The Figma has the add form with a time-picker modal. Decision 0010 made Notes optional and 0008 added a per-medication grace window, which the Figma does not show. The form is built to be reused for Edit.

## AI's proposal
- **Logic first, pure and tested** (`src/domain/medication.ts`, `time.ts`, 18 new tests, 63 total): validation, 12-hour/24-hour conversion, turning the typed draft into a medication, and keeping times sorted and unique.
- **Fields:** Medication Title and Dosage (required), Notes (optional), Days, Send alerts, Grace window, Daily Times. Errors appear only after the first Save attempt, then update as you fix them. Each error is text plus a heavier outline, plus a summary alert, so nothing relies on color.
- **Days:** two-letter labels (Mo Tu We Th Fr Sa Su), each announced as its full weekday, selection shown by a heavier ring and bold label (0009).
- **Saving** adds the medication to the in-memory store and returns to Today, where its doses appear.

**Judgment calls to review:**
1. **No Save button in the Figma add flow.** I added the yellow stacked button, labelled "Save Medication". The wording is a placeholder.
2. **Days default to all seven.** The Figma shows only Monday selected, which may just be a sample state.
3. **Send alerts defaults to on.** The Figma shows it unchecked. Alerts are the app's purpose, but real notifications are not built yet.
4. **The time picker is typed fields plus AM/PM buttons**, not the dropdowns in the Figma. Typed input reaches every minute and works with a keyboard. Dropdowns are possible if you prefer the look.
5. **Time rows have a "Remove" text button** in place of the "..." (no menu component exists). Tapping the time edits it.
6. **Grace window is a numeric field**, 1 to 180 minutes, default 30, with a hint. It is not in the Figma and needs your design.
7. **The Medication Icon field is omitted.** It needs the icon set and a field on the medication.
8. **Input text is 16pt** (the Figma gives no input size); below 16 iOS Safari zooms the page on focus.
9. The full-width "Daily Times" bar sits inside the page margins.
10. Error copy ("Add a medication title.") is placeholder wording for you to rewrite.
11. Nothing persists yet.

**Verified:** 63 tests and typecheck. A browser-driven run of the web build passed 13 checks: empty submit shows the title, dosage and time errors while Notes is not flagged; day toggles flip their checked state; a grace window of 0 is rejected; hour 13 is rejected; a duplicate time is rejected; times stay sorted; a time can be removed; saving returns to Today with the new medication at both times and the dosage as its subtitle.

**Not verified:** iOS (keyboard avoidance, the native modal), VoiceOver, and how the form feels on a phone.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The AM/PM buttons were pushed off screen on web. Text inputs keep a wide intrinsic width, and I had set only a minimum width. The browser test failed on it; fixed with a fixed width.
- An error such as "Hour must be 1 to 12." stayed on screen after the user corrected the hour. Seen in a screenshot, not by a test. It now clears on any edit.
- The picker is a design departure (dropdowns became typed fields). That is a judgment call, not a bug, but it changes how your design looks.
