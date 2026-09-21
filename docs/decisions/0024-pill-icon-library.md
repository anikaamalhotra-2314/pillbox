---
id: "0024"
title: A library of pixel-art pill icons, chosen per medication
date: 2026-09-21
area: design-system
origin: joint
outcome: pending
tool: claude-code
evidence: src/design-system/icons/, src/domain/pill-icon.ts, src/features/medication-form/PillIconField.tsx
---

## Context
(said in session) "i do want a library of little colorful pill icons similar to the one i already have - and have the user to be able to choose what icon they want to use when creating/editing a medication". The Figma has one pixel-art pill (a scored periwinkle tablet) and an icon field on the form, but no set and no picker.

## AI's proposal
- **36 icons: 6 shapes x 6 colors.** Shapes: scored tablet (the Figma's), round, oval, capsule, softgel, square. Colors: periwinkle, peach, yellow (your palette) and mint, lilac, rose. A medication stores just `{ shape, color }`, so the set can grow without changing saved data.
- **The art is drawn in code, in your style:** 16x16 pixel grids with an ink outline, a flat fill and a darker shade along the lower edge (the same idea as the stacked cards). The shade is added automatically, so every shape gets it consistently. The capsule is two-tone. Rendered with `react-native-svg`. Sizes are multiples of 16 so each cell lands on whole device pixels.
- **The picker** opens from the "Medication Icon" field, as in the Figma. Two rows, shape and color, with a live preview and a spoken name that updates ("Mint capsule"). The current choice is marked by a heavier ring, not color alone.
- **Where icons show:** the picker and form field, the details hero (in place of the placeholder), and the cabinet cards (new, on a small cream backing so every color reads on the periwinkle card). Today's dose cards are unchanged.
- **New medications start with your Figma icon.** Medications saved before icons existed show it too, and open in the form with it. The sample data gets a little variety (capsule, oval).
- **Saved data stays safe:** an unknown icon in storage is ignored, not treated as a reason to drop the medication.
- **Tested as data:** 34 new unit tests, including that every shape is a closed 16x16 outline and that all shapes differ. I broke the art on purpose (a hole in an outline, a short row, two identical shapes) and the tests caught each. 129 unit tests total.

**Verified in a browser (15 checks):** the default icon; 6 shapes and 6 colors, exactly one selected each; the current icon preselected; the preview announces "Mint capsule"; Enter selects a focused option; Escape closes the picker; the field updates; the icon is saved, survives a reload, and shows on every cabinet card and the details hero; editing starts from the saved icon and saves a new one; a medication saved without an icon shows the default and offers it in the form. All earlier browser suites still pass.

**Not verified:** how `react-native-svg` renders on iOS, VoiceOver, and performance with a very long list.

**Judgment calls to review:**
1. **The art is mine, drawn in code.** Yours in Figma will likely be better. The set is built to be replaced or extended: swap a grid for your art, or add shapes, and nothing stored changes.
2. **Mint, lilac and rose are new colors I invented** to sit beside your three. Adjust them in `pill-colors.ts`.
3. **Two rows (shape, color) instead of a grid of all 36.** It is 12 controls instead of 36 and reads more clearly to a screen reader. A grid could feel richer.
4. **Icons on cabinet cards, and the cream backing, are additions** to your design.
5. **Icons are decorative to screen readers.** They are named in the picker and the field, not in each card's label.
6. **Each option is its own Tab stop.** The standard pattern is one stop with arrow keys inside the group (as in the week strip). Not done yet.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- The first version of the renderer used an SVG prop the library does not type; replaced with the multiple-of-16 sizing rule.
- The capsule's cream half made it look mostly empty, so it became two-tone. In the cabinet a periwinkle pill vanished into the periwinkle card, hence the backing.
- **Pixel rows showed light seams at fractional display scales** (browser zoom). The gallery screenshot hid it; the details hero showed it. Each run now overlaps its neighbour by 5% of a cell.
- My first mutation tests did nothing: macOS `sed` does not support the pattern I used, so the "broken" art was never broken. Redone with Python, with a check that the file changed.
- I killed my own shell repeatedly: `pkill -f` matches the shell's own command line, which made runs look like timeouts. Test servers are now stopped by process id.
