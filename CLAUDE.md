@AGENTS.md

# Pillbox

iOS medication-reminder app (Expo + React Native, TypeScript strict) that also builds for web via React Native Web. Portfolio project for a design engineering role at Ramp. The owner (Anika) is documenting the AI-assisted process, so **attribution of who decided what is a first-class deliverable**, not an afterthought.

Designs: `docs/design/figma/`. Architecture plan: `docs/architecture.md` (once written).

## Attribution rules (important)

1. **Never write the owner's reasoning for them.** In a decision entry, fill in *Context* and *AI's proposal* factually. For *My call* and *Why*, only use what the owner actually said in the conversation, quoted or closely paraphrased and marked as such. Otherwise leave `TODO(anika)` and tell them it's open.
2. **Propose options with a recommendation; the owner decides** anything they can see or feel: tokens, type, color, motion timing/easing, copy, interaction feel, architecture trade-offs.
3. **Commit in two steps when the owner will refine your output.** Commit your first pass as `ai: <what>`, then let the owner's changes land as `human: <what>`. Do not squash these; the diff between them is the before/after for the case study.
4. **Every commit carries trailers** (see `.gitmessage`): `Origin: ai|human|joint`, `Tool: claude-code|cursor|manual`, optional `Decision: NNNN`. Commits you create use `Origin: ai`, `Tool: claude-code`, in addition to the usual co-author line.
5. **Record failures.** If the owner catches a bug, wrong assumption, or bad suggestion from you, note it under "Where the AI was wrong" in the relevant decision.
6. After a meaningful chunk of work (a screen, a component, a domain module, a non-trivial refactor), **offer to run `/log-decision`**. Do not log trivia (renames, formatting, config bumps).

## Decision log

See `docs/decisions/README.md`. One file per decision, numbered `NNNN-slug.md`, from `_template.md`. `node scripts/decision-stats.mjs` prints the AI/human split for the write-up.

## Commands

- `npm run ios` / `npm run web`: dev server. iOS needs a development build, not Expo Go (decision 0002).
- `npm run typecheck`: `tsc --noEmit`.
- `npm test`: Jest (jest-expo). Domain logic in `src/domain/` must stay covered.
- `npm run check:contrast`: token contrast checker; must pass.
- `npm run decisions`: AI/human decision stats.

Expo SDK 57 is newer than most model knowledge. Check the versioned docs (see AGENTS.md) before writing version-specific code, and say so when you're unsure.

## Engineering conventions

- Application code lives in `src/`; only routes and layouts go in `src/app/`. Import with `@/` (maps to `src/`).
- TypeScript `strict`; no `any` without a comment.
- Domain logic (schedules, dose occurrences, notification reconcile) is pure TS in `src/domain/`, with no React or Expo imports, and is unit-tested.
- Every animation respects reduce-motion. Every interactive element has a role, label, and minimum 44pt target.
- Design tokens live in `src/design-system/tokens/`; no raw hex, font sizes, or spacing numbers in feature code.
- Health data stays on-device. No backend in v1.
