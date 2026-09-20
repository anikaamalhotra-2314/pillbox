---
id: "0001"
title: Build with Expo and ship a web build alongside iOS
date: 2026-09-20
area: architecture
origin: ai
outcome: accepted
tool: claude-code
evidence: planning conversation (no commits yet)
---

## Context
Anika wanted a React Native app for her portfolio, targeting a design engineering role at Ramp. That role is web-centric (semantic HTML, CSS, Core Web Vitals, focus states), and recruiters are unlikely to install a TestFlight build.

## AI's proposal
Expo + Expo Router + React Native Web, so one TypeScript codebase ships as a native iOS app and a clickable web URL. Also proposed: own token layer over a UI kit, Reanimated for motion, Zustand for state, local-first storage with no backend in v1, Storybook for the component workshop, and local notifications via expo-notifications.

## My call
Proceeded with the plan and answered its follow-up questions without changing the stack (see 0002). Nothing modified.

## Why
agreed w/ ai proposal

## Where the AI was wrong or limited (optional)
Nothing found yet.
