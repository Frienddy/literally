# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state: blueprint, not yet scaffolded

This repo currently contains **only planning documents** in [`_docs/`](./_docs/).
There is no application code, `package.json`, build tooling, or test setup yet.
The first implementation task is to scaffold the app per the roadmap.

**`_docs/` is the source of truth.** Read the relevant doc before implementing a
feature — the docs contain production-intent reference code (the Zustand store,
the `useCanvas` hook, the mobile shell) meant to be lifted into `src/`, plus the
design rationale (ADRs) behind non-obvious decisions. When code and a doc
disagree, reconcile deliberately and update the doc (especially the ADRs and
change log in `_docs/10-glossary-and-decisions.md`).

Doc map (numbered = reading order): `00` product requirements · `01` game design ·
`02` architecture + folder structure · `03` data model + Zustand store ·
`04` canvas engine (`useCanvas`) · `05` PWA + mobile shell · `06` UI/UX + wireframes ·
`07` accessibility + ethics · `08` implementation roadmap · `09` testing · `10` glossary + ADRs.

## What the product is

"Literally" is a **mobile-first, offline-only PWA empathy game**. The player draws
the same thing twice — once under **Mode 1 "Sensory Storm"** (vague fading
instructions, wobbly freehand strokes, erratic haptics, fake notifications, no
undo) and once under **Mode 2 "Anchor Point"** (high-contrast grid, snap-to-grid
drawing, one literal step at a time, crisp haptics, undo). They rate stress after
each, then compare on a Reflection screen. The contrast builds empathy for how
autistic people can experience instructions and sensory load.

## Architecture invariants (do not break these)

These are cross-cutting decisions that span many files; violating one breaks the
product's core intent. Each maps to an ADR in `_docs/10`.

- **Local-first, network-never at runtime (ADR-001).** No backend, no `fetch` to
  app servers, no analytics SDKs. Everything runs and persists on-device; the app
  must work in airplane mode after first load. All persistence is browser storage.
- **Refs-not-state for live drawing (ADR-006).** During a stroke, points
  accumulate in refs inside `useCanvas` and render via `requestAnimationFrame`.
  React must **not** re-render per pointer event — the store is only touched once
  per finished stroke/segment (`onChange`). This is the zero-latency requirement;
  do not "lift drawing state into React."
- **Show, don't tell — defer the ASD reveal (ADR-008).** The primary audience
  knows nothing about autism. The Welcome screen gives only a minimal, no-spoiler
  setup + a sensory-safety opt-out and **must not name ASD or explain the point**.
  Autism is named **only** on the Reflection screen ("the reveal"). This boundary
  is structural: welcome copy lives in `content/welcome.copy.ts`, reveal copy in
  `content/reveal.ts`. A content test asserts the welcome strings contain no
  autism/ASD terms (`_docs/09` §9).
- **Haptics are enhancement, never a dependency (ADR-003).** `navigator.vibrate`
  does not exist on iOS Safari. Wrap it in `useHaptics`, feature-detect, and never
  gate progression on it — Mode 1's discomfort and Mode 2's satisfaction must also
  read through visual/motion channels.
- **Rigid mobile shell.** `AppShell` + global CSS block pull-to-refresh,
  overscroll, text selection, and zoom (`touch-action`, `overscroll-behavior`,
  `user-select`, `usePreventGestures`). Portrait is enforced (`PortraitGuard` +
  manifest `orientation`). The canvas owns its gesture (`touch-action: none` +
  `preventDefault`). Don't reintroduce document scroll or browser-chrome gestures.
- **Content is data, not JSX (ADR-007).** All player-facing strings + instruction
  sequences live in `src/content/` for ethics/sensitivity review and i18n. Don't
  hard-code copy in components.

## Big-picture code structure (once scaffolded per `_docs/02`)

- **Navigation is a finite state machine inside the Zustand store**, not a URL
  router. `gameStore.screen` (`welcome → mode1 → stress1 → mode2 → stress2 →
  reflection → history`) drives a `ScreenRouter` switch. There is intentionally no
  browser history to swipe back through.
- **The store is the single source of truth** (`src/store/gameStore.ts`), using
  Zustand `persist`. `partialize` persists only `sessions` + `reducedIntensity`
  (not `screen`/`draft`) so reopening lands on Welcome. Versioned with `migrate`
  for forward-compat. Default backend is localStorage; the `storage:` seam allows
  swapping to IndexedDB if a session's drawing payload exceeds ~150KB.
- **The canvas is an imperative island** wrapped by `useCanvas` (`src/hooks/`),
  with all drawing math in a pure, framework-free `src/engine/` layer
  (`wobble.ts`, `snap.ts`, `geometry.ts`, `render.ts`). `engine/render.ts` is
  shared by the live canvas and read-only previews, so saved drawings re-render
  exactly as drawn. One hook, two modes via a `mode: 'freehand' | 'grid'` param.
- **Drawing data is a discriminated union** (`DrawingData` in `src/types/`):
  `FreehandDrawing` stores pixel strokes (+ capture canvas size); `GridDrawing`
  stores resolution-independent `(col,row)` segments. Freehand strokes are
  simplified (RDP) + quantized before saving to control storage size.

## Commands (planned — none exist yet)

The stack is **Vite + React 18 + TypeScript + Tailwind + Zustand**, with
`vite-plugin-pwa`, Vitest, Playwright (see `_docs/02` §7 and `_docs/08` Phase 0).
After scaffolding, the intended scripts are:

```bash
npm run dev       # Vite dev server (PWA enabled via plugin devOptions)
npm run build     # production build + service-worker generation
npm run preview   # serve the built PWA — required to test offline/install on a phone
npm run test      # Vitest (unit: engine/*, store, migrations)
npm run test:e2e  # Playwright mobile-emulated flows (touch draw, snap, persistence)
npm run lint      # ESLint
```

PWA install/offline behavior and real haptics **cannot** be verified in emulators
— they require a real iPhone *and* Android device (`_docs/09` §6 has the matrix).
A service worker needs a secure context, so test `preview` over HTTPS/LAN/tunnel.

## When implementing

Follow the phased roadmap in `_docs/08` (guardrails → store → canvas engine →
screen flow → modes → reflection → content/ethics → polish). The canvas engine
(Phase 2) is the riskiest, highest-value piece — de-risk it early. Any
player-facing change must pass the ethics release-gate checklist in `_docs/07` §7.
