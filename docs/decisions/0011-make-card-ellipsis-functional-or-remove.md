---
id: "0011"
title: The "..." on cards becomes a real overflow menu
date: 2026-09-20
area: interaction
origin: joint
outcome: accepted
tool: claude-code
evidence: docs/design/behavior-spec.md
---

## Context
The "..." in the top-left of each dose card and the details header has no designed behavior. The owner likes how it looks. The AI asked whether it has a use.

## AI's proposal
Make it a real overflow menu. On dose cards: Skip this dose, Snooze, Edit medication. This gives the new Skipped state an entry point. On the details screen: Pause or Delete medication, which the designs currently have no flow for. Keep the dots visually small with a 44pt tap area. If she prefers to keep it purely decorative, remove it: an element that looks tappable and does nothing is confusing, and a screen reader would announce it as a button.

## My call
(said in session) "i dont have any use for the ..., but i just like how they look. is there any other element i can put there that would have a use? otherwise, just remove it". Then, on seeing the proposal: "i like your solution for ..." Accepted as proposed.

## Why
(said in session) She likes how the dots look. TODO(anika): why the overflow menu over removing it.

## Where the AI was wrong or limited (optional)
Nothing found yet.
