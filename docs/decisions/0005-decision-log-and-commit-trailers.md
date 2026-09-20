---
id: "0005"
title: Track AI vs. human decisions with a decision log and commit trailers
date: 2026-09-20
area: process
origin: joint
outcome: accepted
tool: claude-code
evidence: docs/decisions/README.md, CLAUDE.md, .gitmessage, scripts/decision-stats.mjs
---

## Context
Anika wants to record which decisions came from AI and which from her, throughout the build, for the case study.

## AI's proposal
Two layers. (1) One markdown file per meaningful decision, with `origin` and `outcome` fields; `outcome` captures whether the AI's proposal was accepted, modified, or rejected, since that shows judgment better than a raw AI/human split. (2) Git commit trailers (`Origin`, `Tool`) plus an `ai:` then `human:` two-commit pattern, so before/after diffs are recoverable. A `/log-decision` command drafts entries, and `CLAUDE.md` rules stop the AI from writing the owner's reasoning for them. A small script prints the split.

## My call
(said in session) Asked for the tracking system; the design above is the AI's.

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
Nothing found yet.
