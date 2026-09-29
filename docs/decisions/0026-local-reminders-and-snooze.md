---
id: "0026"
title: Local reminders planned from the data and reconciled with iOS, plus Snooze
date: 2026-09-29
area: architecture
origin: ai
outcome: pending
tool: claude-code
evidence: src/domain/reminders.ts, src/features/reminders/, src/store/create-store.ts (storage v2)
---

## Context
The "Send alerts" switch was saved but did nothing: no notification was ever sent. Local notifications with `expo-notifications` were in the original plan (0001), and dev builds were chosen partly for them (0002). The dose menu (0025) left Snooze for this step.

## AI's proposal
- **One-time reminders, planned and reconciled.** A pure function (`planReminders`) lists every reminder that should be pending: each unlogged dose, for medications with alerts on, from now through the next 14 days, earliest first. An iOS adapter compares that list with what iOS has pending and cancels or schedules only the difference. It runs after loading, after any change to medications, logs or snoozes, and when the app returns to the foreground.
  - *Why not repeating weekly triggers:* they can't skip one day, so a dose you took early would still ring. Recomputing also handles edits, deletes, alerts turned off and time-zone changes without special cases.
  - *Why 14 days and a cap of 64:* iOS keeps at most 64 pending notifications per app and silently drops the rest. The soonest 64 win.
- **Snooze** (your answer in session): re-sends the reminder in 10 minutes. The dose keeps its time, status and due/overdue window. It's offered only for a due or overdue dose with alerts on. The card shows "snoozed 10:55am" beside the status, and screen readers hear "reminder snoozed until 10:55 AM". Taking or skipping the dose, or deleting the medication, ends the snooze.
- **Snoozes are saved**, so a snooze survives the app being closed. This is the **first storage migration** (version 1 to 2). Older data loads unchanged with no snoozes, and invalid snoozes are dropped like other bad entries.
- **Permission is asked the first time there is something to schedule.** With the sample data that means the first launch. A refusal is respected: it never asks again, and removals still happen.
- **Reminder text:** "Time for Synthroid" / "7:00pm · 1 pill | 125mg". Tapping it opens Today. A reminder that arrives while the app is open still shows as a banner, with the default sound.
- **Web has no reminders and no Snooze.** A browser can't deliver a notification after the page closes, so the web build skips all of this and doesn't bundle `expo-notifications`.

**Verified:** 165 unit tests (new: planning, reconciling, snoozing, storage v2 and migration, and the iOS adapter against a fake `expo-notifications` covering permission asked once, refusal respected, provisional allowed, and only differences touched) and typecheck. Browser: 13 snooze checks, with Snooze switched on for web temporarily: the option shows only for a due dose, the note appears, the snooze is saved as version 2 and survives a reload, the note goes once the snooze has rung, taking the dose clears it, and version 1 data loads, is re-saved as version 2 and nothing is dropped. The 18 dose-menu checks pass, with no Snooze on web. The iOS JavaScript bundle compiles and includes the adapter. The web export does not include `expo-notifications`.

**Not verified:** no iOS simulator runtime or CocoaPods is installed, so nothing has run on iOS. Whether notifications actually fire, the permission prompt, the banner, tapping to open, and VoiceOver are all untested. The adapter's round trip relies on iOS returning `data.fireAt` as a number.

**Judgment calls to review:**
1. **Medication names on the lock screen.** It's health data. A generic "Time for your medication" would be more private and less useful. iOS users can also hide previews in Settings.
2. **Asking for permission at first launch** (because the sample data has alerts on) versus in context, when you first save a medication with alerts on.
3. **Reminders run out if the app isn't opened for 14 days.** A final "Open Pillbox to keep your reminders coming" notification would cover it. Not built.
4. **No buttons on the notification itself** ("Taken", "Snooze"). Handling them without opening the app needs work I couldn't verify here.
5. **No nudge when a dose becomes overdue,** and none for a dose whose time passed before the app was opened.
6. **The snooze note's wording and placement.** "snoozed 10:55am" sits beside "Due now" and moves to its own line on a narrow screen.
7. **Snooze length is fixed at 10 minutes.**

## My call
(said in session) Chose "Dose menu, then reminders" and, for Snooze, "Remind again in 10 min" ("Snooze only re-sends the reminder. The dose keeps its scheduled time and status"). Then: "go on auto mode - you can approve decisions without my approval". Everything else above was decided by the AI under that delegation and has not been reviewed yet.

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- **I tested against stale builds for a while.** I had started the web server with `CI=1`, which turns off reloading. I blamed a file-watcher problem at first. As a result, one "regression" comparison against the previous commit compared two stale builds and meant nothing. Every check was rerun on a freshly started server.
- **The Escape check in the dose-menu suite (0025) was a race.** It pressed Escape without waiting for the menu to take focus. It now waits.
- The first snooze note, "Due now · snoozed to 10:55am", wrapped mid-phrase on a phone-width screen. The shorter version still wrapped at 375px for an overdue dose. It's now a separate piece that fits on one line at 375px or moves down whole.
