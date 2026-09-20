---
id: "0013"
title: Scaffold with the Expo SDK 57 default template, stripped to a blank app
date: 2026-09-20
area: tooling
origin: ai
outcome: pending
tool: claude-code
evidence: commit "ai: scaffold Expo SDK 57 app"
---

## Context
The repo had docs, tokens and scripts but no app. Expo SDK 57 is newer than the AI's training knowledge, so hand-writing version-specific config was a risk.

## AI's proposal
- Generate the official default template in a scratch folder, run its own `reset-project` script to remove the demo, then merge into the repo without overwriting anything. This keeps versions and config correct instead of relying on the AI's memory.
- Dropped demo-only dependencies (`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`, `expo-image`). Kept the router, Reanimated, Gesture Handler, Worklets and React Native Web, all planned in 0001. React Compiler and typed routes stay on, as the template ships them.
- Removed Android config and scripts, following 0002 (iOS + web).
- `app.json`: name `Pillbox`, scheme `pillbox`, bundle id `com.anikamalhotra.pillbox` (derived from the owner's name; change freely), `userInterfaceStyle: light` because only a light theme is designed, splash background set to the cream token.
- Kept the template's `AGENTS.md` (points agents at the versioned Expo docs; Cursor reads it too) and imported it from `CLAUDE.md`.
- Enabled the Expo Claude Code plugin via `.claude/settings.json`, as the template ships it. **Flagged for the owner to keep or remove.**
- Not copied: the template's `.vscode` save-actions (editor behavior is the owner's call), `README.md`, `LICENSE`.
- Added B612 Mono (`@expo-google-fonts/b612-mono`); not wired up yet.

Verified: `npm run typecheck` passes, `npx expo export --platform web` builds (3 static routes, 1.1MB bundle), `npx expo install --check` reports up to date, and the token contrast check still passes. **Not verified:** running on an iOS simulator or device.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- SDK 57 postdates its knowledge, hence the template-first approach.
- The first `npm install` failed on a network drop (the laptop went offline mid-install) and rolled back cleanly; a retry succeeded.
- `npm audit` reports 14 moderate vulnerabilities in the dependency tree. Not addressed: `npm audit fix --force` would make breaking changes to an Expo-pinned tree. Worth a look later.
- The app icon and splash image are still Expo's placeholders. Pillbox artwork is the owner's.
