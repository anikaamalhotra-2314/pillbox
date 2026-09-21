---
id: "0022"
title: Export the web build as a single-page app
date: 2026-09-21
area: architecture
origin: ai
outcome: pending
tool: claude-code
evidence: app.json (web.output), a browser test of reloading /medication/microgestin
---

## Context
Reloading or sharing a link such as `/medication/microgestin` returned a 404 from a static server. With static output the export can only pre-build pages whose URLs it knows in advance, and medication ids exist only in the user's own storage.

## AI's proposal
Set `web.output` to `single` in `app.json`. The export becomes one `index.html` and the router handles every path in the browser. Everything the app shows is user-specific and client-side, so pre-rendering had no benefit (and the pre-rendered pages were blank anyway, because the layout waits for fonts and saved data).

**The trade-off:** the host must send every path to `index.html`. That is one rule for the whole site (for example `/* -> /index.html` on Netlify or Cloudflare Pages, or a single rewrite on Vercel). With static output it would need a separate rule for each dynamic route. `expo serve`, which I had been using for tests, has no such fallback, so browser tests now use a small local server that adds it. `npm run web` (the dev server) handles it natively.

**Verified:** with the fallback, `/medication/microgestin`, `/medication/nope`, `/add` and `/gallery` all load correctly on a direct visit, and the earlier browser tests pass.

**Not decided:** where it will be hosted. The rewrite rule belongs with that choice.

## My call
TODO(anika)

## Why
TODO(anika)

## Where the AI was wrong or limited (optional)
- I had been testing against a server that was not representative of a real host, and only found the 404 because the new screen made me test a reload on a dynamic route.
