# Decision log

A running record of who decided what while building Pillbox, so the case study can show real AI-assisted work with real human judgment, backed by evidence instead of claims.

## Decision entries

One markdown file per meaningful decision. Aim for roughly 25-40 over the project, not one per keystroke. Copy `_template.md` to `NNNN-slug.md`, or run `/log-decision` in Claude Code and let it draft everything except your reasoning.

## Vocabulary

| Field | Values | Meaning |
|---|---|---|
| `origin` | `human`, `ai`, `joint` | Who first came up with the idea or first pass |
| `outcome` | `pending`, `accepted`, `modified`, `rejected`, `n/a` | What happened to the AI's proposal. `pending` = proposed, not yet reviewed by you. `n/a` when the AI wasn't involved |
| `area` | design-system, interaction, motion, a11y, architecture, domain, copy, tooling, process | For slicing the stats |
| `tool` | claude-code, cursor, manual | Where it happened |

`modified` and `rejected` are the interesting ones. They show judgment.

## Rules of thumb

- Log when there was a real choice: more than one option, something got changed, or the AI got it wrong.
- **The Why is yours.** The AI drafts context and its own proposal. If it writes your reasoning, the log stops being evidence.
- Attach evidence: commit hashes, screenshots in `docs/decisions/assets/`, or a Storybook story.

## Stats

```bash
node scripts/decision-stats.mjs
```

Prints the split by origin, outcome, and area. Paste the output into the case study.
