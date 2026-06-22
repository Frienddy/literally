# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What the product is

"Literally" is a **mobile-first, offline-only PWA empathy game**. The player draws
the same thing twice on the **same** dotted snap-to-grid canvas; the **only**
difference is the instruction (ADR-015). **Mode 1 ("without clear instruction")**
gives one vague, holistic ask ("draw a normal house…" — no counts, directions, or
per-step help); **Mode 2 "Anchor Point" ("with clear instruction")** walks through
literal, counted, directional steps with on-grid guidance and undo. After each, the
player rates stress + confidence (the shared `FeedbackCheckScreen`), then compares
on a Reflection screen. The contrast builds empathy for how much clear instructions
matter — and how disorienting their absence is. *(Mode 1 was formerly "Sensory
Storm," a freehand+wobble sensory-overload mode; ADR-015 removed that layer so the
lesson isolates instruction clarity. The README still describes the old Mode 1 and
is stale.)*

## Project state & the missing docs

The app is **fully scaffolded and working** (Vite + React 18 + TS + Tailwind +
Zustand). This is the source of truth, not any document.

Code comments throughout reference `_docs/NN`, `ADR-0NN`, `PRD-0NN`, `NFR-N`, and
`R0N-NN` — **those `_docs/`, `_prds/`, and `_debt/` directories were deleted**
(commit `chore: delete docs`) and no longer exist on disk. Treat those tags as
historical identifiers, not live links. When you need the rationale behind an ADR,
read the relevant commit messages (`git log`, which still names ADRs/PRDs per
change) rather than hunting for a file. The README's top section also links the
removed docs and is out of date — don't trust it over the code.

## Commands

```bash
npm run dev            # Vite dev server (PWA enabled via plugin devOptions)
npm run build          # tsc --noEmit (typecheck) then vite build + service worker
npm run preview        # serve the built PWA — required to test offline/install
npm run test           # Vitest, single run (tests/unit/** only)
npm run test:watch     # Vitest watch
npm run test:coverage  # Vitest + v8 coverage (src/store, src/lib, src/engine)
npm run test:e2e       # Playwright; webServer auto-runs `build && preview` on :4173
npm run lint           # ESLint (flat config)
npm run format         # Prettier write   (format:check for CI-style verify)
npm run check:size     # gzipped app-JS bundle-budget gate (< ~200KB, NFR-3)
npm run icons          # regenerate placeholder PWA icons
```

- **Run one unit test:** `npx vitest run tests/unit/engine.snap.test.ts` (or
  `-t "name"` to filter by test name). Vitest only picks up `tests/unit/**` —
  `tests/e2e/**` are Playwright specs, kept out of the Vitest run by `vite.config.ts`.
- **Run one e2e spec / project:** `npx playwright test tests/e2e/mode2.spec.ts`
  or `--project="Mobile Safari"`. First run needs browsers:
  `npx playwright install chromium webkit`. Specs partition by project:
  `desktop.spec.ts` runs only on Desktop Chrome (landscape layout, ADR-014); every
  other spec runs mobile-emulated (iPhone 13 + Pixel 7) and ignores desktop.
- **PWA install/offline + real haptics cannot be verified in emulators** — they need
  a real iPhone *and* Android, served over HTTPS/LAN/tunnel (secure context for the
  service worker). Vitest disables `vite-plugin-pwa` via the `VITEST` env so jsdom
  doesn't try to register a SW.
- CI (`.github/workflows/ci.yml`) gates PRs on format:check → lint → tsc → coverage
  → build → `check:size`, plus the Playwright job. Mirror it before pushing.

## Architecture invariants (do not break these)

These are cross-cutting decisions that span many files; violating one breaks the
product's core intent.

- **Local-first, network-never at runtime (ADR-001).** No backend, no `fetch` to
  app servers, no analytics SDKs. Everything runs and persists on-device; the app
  must work in airplane mode after first load. All persistence is browser storage.
- **Refs-not-state for live drawing (ADR-006).** During a drag, snapped state
  accumulates in refs inside `useCanvas` and renders via `requestAnimationFrame`.
  React must **not** re-render per pointer event — the store is touched only via
  `onChange`, once per finished segment (and on undo/reset). This is the
  zero-latency requirement; do not "lift drawing state into React."
  `tests/unit/useCanvas.render.test.tsx` asserts no re-render during a stroke.
- **Show, don't tell — defer the ASD reveal (ADR-008).** The primary audience knows
  nothing about autism. The Welcome screen gives only a minimal, no-spoiler setup +
  a sensory-safety opt-out and **must not name ASD or explain the point**. Autism is
  named **only** on the Reflection screen ("the reveal"). This boundary is
  structural: neutral copy lives in `content/welcome.copy.ts`, `content/giver.copy.ts`,
  `content/strings.ts`, `content/tasks.ts`; the reveal lives in `content/reveal.ts`.
  `tests/unit/content.boundary.test.ts` asserts the neutral decks contain no
  autism/ASD terms and that `reveal.ts` is the one place they appear (plus required
  disclaimers and identity-first, non-pity framing).
- **The "giver" never blames the player.** Instructions come from an in-fiction
  "Grown-up" character (`content/giver.copy.ts`, `GiverBeat`, `GuideMascot`). The
  content gate also forbids scolding/blaming language in those lines.
- **Haptics are enhancement, never a dependency (ADR-003).** `navigator.vibrate`
  doesn't exist on iOS Safari. It's wrapped in `useHaptics`, feature-detected, and
  never gates progression — the snap confirm must also read through visual/motion
  channels. `reducedIntensity` (sensory opt-out) selects the softer pattern.
- **Rigid mobile shell + single light theme (ADR-016).** `AppShell` + global CSS
  block pull-to-refresh, overscroll, text selection, and zoom (`touch-action`,
  `overscroll-behavior`, `user-select`, `usePreventGestures`). Portrait is enforced
  **on phones only** (`PortraitGuard` shows when `useIsPhone` && landscape; the
  manifest `orientation` is honored on phones, ignored on desktop). Laptops/desktops/
  tablets get a responsive landscape layout via the single `wide:` Tailwind variant
  (ADR-014); each screen has a side-by-side `wide:` form. `useIsPhone` combines a
  coarse-pointer signal with a short-side `< 600px` check so a large phone in
  landscape ≠ a small laptop window. The canvas owns its gesture
  (`touch-action: none` + `preventDefault`). Don't reintroduce document scroll.
- **Content is data, not JSX (ADR-007).** All player-facing strings + instruction
  sequences live in `src/content/`. Don't hard-code copy in components.
- **Tunables live in `src/config.ts`.** Grid size (currently 22×28 nodes), snap
  tolerance, and haptic patterns are seeded there for non-engineers to tweak — don't
  scatter these constants into components.

## Big-picture code structure

- **Navigation is a finite state machine inside the Zustand store**, not a URL router
  (ADR-004). `gameStore.screen` (`welcome → mode1 → stress1 → mode2 → stress2 →
  reflection → history`) drives a `ScreenRouter` switch. The canonical transition
  map, forward-path helper, and flow-progress steps live in `src/app/routes.ts`.
  Both `stress1` and `stress2` render the same `FeedbackCheckScreen`; `mode2` renders
  `AnchorPointScreen`. There is intentionally **no browser history** to swipe back
  through. `App.tsx` also has a `?harness=canvas` escape hatch that lazy-loads a
  bare canvas demo for E2E.
- **The store is the single source of truth** (`src/store/gameStore.ts`), Zustand
  `persist`. `partialize` persists only `sessions` + `reducedIntensity` (not
  `screen`/`draft`/`selectedSessionId`) so reopening lands on Welcome, never
  mid-mode. A session is a `draft` while in progress and only joins `sessions`
  (newest-first) on `finalizeSession`. Versioned via `src/store/migrations.ts`
  (`SCHEMA_VERSION = 2`); `migrate` never throws — corrupt blobs boot to empty.
  Selectors are in `src/store/selectors.ts` (subscribe narrowly to avoid re-renders).
- **Storage is a swappable seam** (`src/store/storage.ts`). Default is
  quota-guarded localStorage: a write failure dispatches `QUOTA_EXCEEDED_EVENT`
  (surfaced by `QuotaNotice`, recovered via `clearOldSessions`) instead of crashing.
  If a session's drawing payload exceeds ~150KB, swap to an IndexedDB adapter at the
  `storage:` line in `gameStore.ts` — nothing else moves.
- **The canvas is an imperative island** wrapped by `useCanvas` (`src/hooks/`), with
  all drawing math in a pure, framework-free `src/engine/` layer (`snap.ts`,
  `grid.ts`, `render.ts`). `engine/render.ts` is shared by the live canvas and
  read-only `DrawingPreview`s, so saved drawings re-render exactly as drawn. **One
  grid-only hook drives both modes** (ADR-015); modes differ only in surrounding
  instruction UI, not in the canvas. The hook reads live options through `optsRef`
  so inline `onChange`/`onHaptic` callbacks never go stale without re-binding
  listeners.
- **Drawing data is `GridDrawing`** (`src/types/session.ts`): resolution-independent
  `(col,row)` segments between grid nodes (`DrawingData` is a kept alias). The v1→v2
  migration nulls legacy `FreehandDrawing` pixel payloads; the freehand engine was
  removed.

## When implementing

- Match the existing comment style: files carry a top doc-comment explaining the
  *why* and the ADR/PRD they trace to. Keep that when you touch them.
- Any player-facing change must hold the show-don't-tell boundary and respectful-
  framing rules enforced by `content.boundary.test.ts` — run it.
- The canvas engine is the riskiest, highest-value piece; its unit tests
  (`engine.*`, `useCanvas.render`) and the canvas/mode E2E specs are the safety net.
