# Literally

A mobile-first, **offline-only PWA empathy game**. You draw the same thing twice —
once under **Mode 1 "Sensory Storm"** (vague fading instructions, wobbly strokes,
erratic haptics, fake notifications, no undo) and once under **Mode 2 "Anchor
Point"** (high-contrast grid, snap-to-grid, one literal step at a time, undo,
crisp haptics). You rate stress + confidence after each, then compare on a
Reflection screen. The contrast _is_ the lesson.

> The blueprint lives in [`_docs/`](./_docs/) (source of truth — vision, design,
> ADRs, reference code) and the buildable units in [`_prds/`](./_prds/). Start
> there. Tracked tech debt is in [`_debt/`](./_debt/).

## Status

Phase 0–1 complete: the installable offline shell (PRD-001) and the data model +
persisted store (PRD-002). The screen flow, canvas engine, and modes are next
(PRD-003+). See each PRD's Definition of Done for what's verified.

## Stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · Zustand (`persist`) ·
`vite-plugin-pwa` (Workbox) · Vitest · Playwright.

## Getting started

```bash
npm install
npm run dev        # Vite dev server (PWA enabled via plugin devOptions)
```

### Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Dev server with HMR. |
| `npm run build` | Typecheck + production build + service-worker generation. |
| `npm run preview` | Serve the built PWA — required to test offline/install on a phone. |
| `npm run test` | Vitest unit tests (engine/store/migrations). |
| `npm run test:coverage` | Unit tests with a coverage report. |
| `npm run test:e2e` | Playwright mobile-emulated flows (builds + previews first). |
| `npm run lint` | ESLint (flat config). |
| `npm run format` | Prettier write. |
| `npm run icons` | Regenerate the placeholder PWA icons. |

First run of `test:e2e` needs browsers: `npx playwright install chromium webkit`.

## Testing on a real device

PWA install/offline and real haptics **cannot** be verified in emulators — they
need a real iPhone _and_ Android. A service worker needs a secure context, so
serve `npm run preview` over HTTPS/LAN/tunnel. See [`_docs/09`](./_docs/09-testing-and-qa.md) §6.

## Architecture invariants

Local-first / network-never · refs-not-state for live drawing · show-don't-tell
(the ASD reveal is deferred to Reflection) · haptics are enhancement only · rigid
mobile shell · content is data, not JSX · navigation is an in-store FSM. Details
and rationale: [`CLAUDE.md`](./CLAUDE.md) and the ADRs in
[`_docs/10`](./_docs/10-glossary-and-decisions.md).
