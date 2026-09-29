# Behavior spec

What the app does where the Figma is silent or was changed. Decided items link to their decision entry. **PROPOSED** items are AI suggestions awaiting review; do not treat them as final.

## Home

**Week strip** ([0006](../decisions/0006-week-strip-centered-on-today.md)): 7 days visible, centered on today at launch (3 before, 3 after). Scrolls horizontally to reach other days. Today is always distinguishable from the selected day. *Assumption to confirm: snap to days, and a way back to today.*

**Ordering** ([0007](../decisions/0007-taken-doses-sink-to-bottom.md)):
1. Active doses (upcoming, due, overdue) by scheduled time, ascending. Overdue naturally lands first.
2. Resolved doses (taken, skipped) below, also by **scheduled** time, ascending.

When a dose is taken it moves from group 1 to group 2. The movement is a hand-tuned animation; with reduce motion on, it swaps instantly.

## Card states ([0008](../decisions/0008-add-overdue-skipped-due-locked-states.md))

Grace window and late logging are decided. The visual treatments below are still **PROPOSED**.

| State | When | Treatment | Accessibility state |
|---|---|---|---|
| Upcoming | Before scheduled time | Existing peach card + offset shadow | "upcoming" |
| Pressed | While pressed | Existing flat card, no shadow | n/a |
| Due now | From scheduled time until the grace window ends | Filled bell; stronger emphasis on time label | "due now" |
| Overdue | Grace window passed, not taken | Text label "Overdue" in the card, bold time. No color-only signal | "overdue" |
| Taken | Marked taken | Existing dim + strike-through + checked box; shows taken time | "taken at 6:42 AM" |
| Skipped | Deliberately skipped | Dimmed, no strike-through, dash in box, text label "Skipped" | "skipped" |
| Locked | Day is in the future | Checkbox disabled, reduced emphasis | "scheduled, cannot be marked yet" |

**Grace window** (decided): default **30 minutes**, user-configurable, because some medications need stricter timing. *Assumption to confirm: configured per medication, with 30 min as the default, since the reason given is medication-specific.* This adds a field to the add/edit form that is not in the Figma and needs a design.

**Late logging** (decided): on any past day (and after the grace window today), a dose can still be marked taken. Past-day unresolved doses read as "Missed" (proposed label). Late-logged doses should record the actual time taken.

## Accessibility fixes ([0009](../decisions/0009-accessibility-fixes-to-figma.md)) — ACCEPTED

- Taken card text `#5f5656` on peach `#f8d3c6`: 5.12:1 (was 3.74:1).
- Form placeholder `#767070` on cream `#fdf8f6`: 4.61:1 (was 2.08:1).
- Day picker labels Mo Tu We Th Fr Sa Su (was M T W R F S N). Full weekday as accessibility label, with selected state. Selection also shown by bold label and heavier ring, not fill alone.
- 44pt minimum hit areas on checkboxes and day circles (hit slop; visuals unchanged).
- Visible focus ring on web. All motion respects reduce motion.

## Add / edit medication form

- Title and Dosage required. **Notes optional** ([0010](../decisions/0010-notes-field-optional.md)): remove the asterisk.
- **Grace window** field, default 30 min (see above). Needs design.

## The "..." element ([0011](../decisions/0011-make-card-ellipsis-functional-or-remove.md)) — ACCEPTED

- Dose card: overflow menu with Skip this dose, Snooze, Edit medication. Dots stay visually small; 44pt tap area.
  - Built in [0025](../decisions/0025-dose-card-menu.md). Options depend on state: Skip / Undo skip, and Edit; a future dose offers only Edit.
  - **Snooze** (decided in session): re-sends the reminder 10 minutes later. It does not move the dose: its time, status and due/overdue window stay the same.
- Details screen: Pause or Delete medication (destructive, confirm first). The delete/pause flows need design.
