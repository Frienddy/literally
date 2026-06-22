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
the same thing twice on the **same** dotted snap-to-grid canvas; the **only**
difference is the instruction (ADR-015). **Mode 1 ("without clear instruction")**
gives one vague, holistic ask ("draw a normal house…" — no counts, directions, or
per-step help); **Mode 2 "Anchor Point" ("with clear instruction")** walks through
literal, counted, directional steps with on-grid guidance and undo. They rate
stress + confidence after each, then compare on a Reflection screen. The contrast
builds empathy for how much clear instructions matter — and how disorienting their
absence is. *(Mode 1 was formerly "Sensory Storm," a freehand+wobble sensory-overload
mode; ADR-015 removed that layer so the lesson isolates instruction clarity.)*

## Architecture invariants (do not break these)

These are cross-cutting decisions that span many files; violating one breaks the
product's core intent. Each maps to an ADR in `_docs/10`.

- **Local-first, network-never at runtime (ADR-001).** No backend, no `fetch` to
  app servers, no analytics SDKs. Everything runs and persists on-device; the app
  must work in airplane mode after first load. All persistence is browser storage.
- **Refs-not-state for live drawing (ADR-006).** During a drag, snapped state
  accumulates in refs inside `useCanvas` and renders via `requestAnimationFrame`.
  React must **not** re-render per pointer event — the store is only touched once
  per finished segment (`onChange`). This is the zero-latency requirement;
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
  gate progression on it — the snap confirm must also read through visual/motion
  channels.
- **Rigid mobile shell.** `AppShell` + global CSS block pull-to-refresh,
  overscroll, text selection, and zoom (`touch-action`, `overscroll-behavior`,
  `user-select`, `usePreventGestures`). Portrait is enforced **on phones only**
  (`PortraitGuard` shows when `useIsPhone` && landscape; manifest `orientation` is
  honored on phones, ignored on desktop); laptops/desktops/tablets render a
  responsive landscape layout via the `wide:` breakpoint, and each screen has a
  side-by-side `wide:` variant (ADR-014). The canvas owns its gesture
  (`touch-action: none` + `preventDefault`). Don't reintroduce document scroll or
  browser-chrome gestures.
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
  (`snap.ts`, `grid.ts`, `render.ts`). `engine/render.ts` is shared by the live
  canvas and read-only previews, so saved drawings re-render exactly as drawn. One
  grid-only hook drives **both** modes (ADR-015); the modes differ only in their
  surrounding instruction UI, not in the canvas.
- **Drawing data is `GridDrawing`** (`DrawingData` in `src/types/`): both modes
  store resolution-independent `(col,row)` segments between grid nodes. *(Pre-ADR-015
  Mode 1 stored `FreehandDrawing` pixel strokes; the schema-v2 migration nulls those
  legacy payloads. The freehand engine — `wobble.ts`/`geometry.ts`/`drawFreehand` —
  has been removed.)*

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
