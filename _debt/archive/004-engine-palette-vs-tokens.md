# DEBT-004 — Engine color palette duplicates (and slightly diverges from) design tokens

**Status:** ✅ Resolved (2026-06-21) · **Severity:** Low · **Surfaced by:** PRD-004 (Design System & Navigation)

## Resolution

`src/engine/render.ts` now imports `tokens` and sources its palette from it
instead of redeclaring local constants: `INK = tokens.color.ink`,
`GRID_NODE = tokens.guidance.targetNode`, `GUIDE_START = tokens.guidance.startNode`,
`GHOST_PATH = tokens.guidance.ghostPath`. The drifted ink is reconciled — committed
strokes/segments now render with `tokens.color.ink` (`#0f172a`) rather than the old
`#111827`. `tokens.ts` is plain data with no runtime deps, so the engine stays
pure/framework-free (per the note below), and a future token change propagates to
the canvas instead of silently diverging. No render test asserts on colour, so the
engine suite is unchanged. The `_docs/04` reference snippets were reconciled to
match. The live Mode 1 stroke colour is handled separately by **DEBT-006** (a
distinct, legible `stormInk` override) rather than reusing `tokens.color.ink`. The
original note follows for history.

---

## What

`src/engine/render.ts` defines its drawing colors as local constants:

```ts
const INK = '#111827';        // committed strokes / segments
const GRID_NODE = '#1f6feb';
const GUIDE_START = '#1f9d57';
const GHOST_PATH = 'rgba(31,111,235,.28)';
```

PRD-004 introduced `src/styles/tokens.ts` as the single source of truth for the
visual language (mirrored into Tailwind). The engine constants now **duplicate**
those tokens, and one value has **drifted**: engine `INK = '#111827'` vs
`tokens.color.ink = '#0f172a'` (the doc-06 value). `gridNode`, `guidance.startNode`,
and `guidance.ghostPath` currently match by coincidence, not by reference.

## Why deferred

`engine/` is PRD-003 scope and is deliberately a pure, framework-free, heavily
unit-tested module. Re-pointing its palette at `tokens.ts` is safe (tokens is plain
data, so importing it keeps the engine pure) but it touches PRD-003 code and its
snapshot/pixel tests, which is out of PRD-004's scope (tokens + navigation only).

## Risk

Low. Saved drawings render with `#111827` instead of the intended `#0f172a` ink —
a barely-perceptible difference, and consistent between live canvas and previews
(both use `engine/render.ts`). The real risk is future drift: a token color change
won't propagate to the canvas.

## Suggested resolution

In a PRD-003 follow-up (or when PRD-008 wires `DrawingPreview` via the shared
renderer), import the palette from `tokens` instead of redeclaring it, and
reconcile `INK` to `tokens.color.ink`. Update the engine render tests if any assert
on color. Keep the engine dependency-free — `tokens.ts` has no runtime deps, so
this does not compromise its purity.
