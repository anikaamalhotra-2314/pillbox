---
description: Draft a decision-log entry for what we just did (leaves the owner's reasoning for the owner)
argument-hint: "[optional: short topic]"
---

Draft a decision entry for the work just completed in this session. Topic hint: $ARGUMENTS

1. Read `docs/decisions/_template.md` and list `docs/decisions/` to pick the next number (`NNNN`, zero-padded).
2. Look at `git log --oneline -15` and `git status` to find the relevant commits and cite hashes as evidence. If the work isn't committed yet, say so and set `evidence` accordingly.
3. Write `docs/decisions/NNNN-slug.md` from the template:
   - **Context** and **AI's proposal**: fill in factually from this conversation.
   - **origin / outcome / area / tool**: set from what actually happened. If unclear (for example whether the owner modified your output), ask instead of guessing.
   - **My call** and **Why**: use only what the owner said in this conversation, quoted and marked "(said in session)". Anything else stays as `TODO(anika)`. Do not invent or polish their reasoning.
   - **Where the AI was wrong**: include anything the owner corrected. Be candid about your own mistakes.
4. Report back with the file path and a list of the `TODO(anika)` fields the owner still needs to fill in.
