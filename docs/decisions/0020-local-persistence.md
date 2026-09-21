---
id: "0020"
title: Persist medications and dose logs locally, treating stored data as untrusted
date: 2026-09-21
area: architecture
origin: ai
outcome: pending
tool: claude-code
evidence: src/store/, src/domain/persist.ts, 17 new tests
---

## Context
Until now everything lived in memory: reloading lost every medication and every checked dose. The plan (0001) was local-first storage with no backend, so health data stays on the device.

## AI's proposal
- **Storage:** AsyncStorage (`@react-native-async-storage/async-storage`) behind Zustand's `persist`. It is `localStorage` on web and native storage on iOS, and works in Expo Go. Only data is saved (name, medications, logs), never the action functions. The stored value is versioned (`version: 1`).
- **Stored data is treated as untrusted input** (`src/domain/persist.ts`, pure and tested). An older version, a bug, or hand-editing can leave anything there. Valid medications and logs are kept, invalid ones are dropped (including impossible dates like Feb 30, out-of-range grace windows, and duplicates), and the caller is told how many.
- **Nothing is lost silently.** Text that is not valid JSON is copied to `pillbox:corrupt:<time>` before anything can overwrite it. If some entries are dropped, the original is copied to `pillbox:salvaged:<time>`.
- **The app always starts.** A failed read is treated as "nothing saved"; a failed write is logged and the app keeps working from memory. I read zustand's source and found that if hydration throws, it never reports finished, which would have stranded the user on the splash screen, so the store is built so that cannot happen. A 5-second timeout in the hydration hook is a second safety net.
- **Hydration is explicit and client-only** (`skipHydration`, triggered from the root layout), because the static web export runs in Node with no storage. The splash stays up until fonts and saved data are both ready, so the sample data never flashes before yours loads.
- **Testable seam:** `createPillboxStore(rawStorage)` takes the storage as an argument, so tests use an in-memory one. The default app store is a separate module.
- **First launch** still shows the Figma sample data. Nothing is written until the user changes something.

**Verified:**
- 80 tests pass (17 new), and typecheck is clean. I broke the code on purpose twice, once so logs were not saved and once so corrupt data was not backed up, and the tests caught both.
- A browser-driven run of the web build passed 14 checks: first launch shows the sample doses and writes nothing; after adding a medication and checking a dose, a reload gives an identical day, same doses and same order; an undo survives a reload; corrupt storage still opens the app on the sample data and keeps the bad text; storage with one invalid medication keeps the valid one, uses the saved name, and backs up the original; a new browser profile starts fresh.
- The earlier home, form and keyboard checks still pass.

**Not verified:** iOS (AsyncStorage's native side), real storage-full behavior, and behavior with a very long history of logs.

**Things to know and decide:**
1. **The sample data becomes real data on the first change, and there is no way to delete it yet.** Edit and delete belong to the details screen. Until then, `usePillbox.getState().reset()` (or clearing the site's storage) returns to the sample data. A real empty state and onboarding are still to design.
2. **Data is not encrypted at rest.** AsyncStorage is plain storage inside the iOS app sandbox, and on web `localStorage` is readable by any script on the page. For a medication list that is a real trade-off to state in the privacy copy.
3. **No migrations exist yet.** Version 1 is the only shape. Zustand silently ignores data saved under another version when no `migrate` step exists, so the next shape change must add one. That is noted in the code.
4. **The logs list grows forever.** Fine for months. Pruning or moving to SQLite (in the original plan) is a later decision.
5. The user name is saved but has no UI to change it.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- My first test script referenced an undefined variable and stopped partway; fixed and rerun. Not a product bug.
- A type error appeared on `migrate` (zustand passes `unknown`); resolved with an explicit cast justified by the validation that follows.
- I assumed hydration errors would still complete the "hydrated" flag; the source showed otherwise, which shaped the design above.
