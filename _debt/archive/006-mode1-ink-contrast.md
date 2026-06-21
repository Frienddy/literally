# DEBT-006 — Mode 1 freehand ink is near-invisible on the storm canvas

**Status:** ✅ Resolved (2026-06-21) · **Severity:** Medium · **Surfaced by:** PRD-008 (Reflection &
History)

## Resolution

Introduced two **distinct Mode 1 ink tokens** (not a reuse of `tokens.color.ink`,
per the DEBT-004 coordination note): `tokens.color.stormInk = '#5d6486'` (≈3.1:1
on the storm canvas `#11162a` — deliberately low-but-nonzero, *legible yet
effortful*) and `tokens.color.stormInkReduced = '#7e87ab'` (≈5:1 — clearly legible)
used under reduced-intensity. `engine/render.ts` `drawFreehand` now takes an
optional `ink` param (defaulting to the committed ink, so saved previews on the
light surface are unchanged); `useCanvas` exposes an `ink` option and the live
freehand render passes it through; `SensoryStormScreen` selects
`stormInk`/`stormInkReduced` from the `reducedIntensity` flag, so the stroke-ink
legibility is raised alongside the other reduced-intensity channels (R05-11). The
ghost/grid/node palette is untouched. Covered by an `engine.render` test (default
ink vs override). The original note follows for history.

---

## What

Mode 1 draws committed strokes with the engine ink colour and renders them on the
storm canvas background:

- engine ink (`src/engine/render.ts`): `INK = '#111827'` → `rgb(17, 24, 39)`
- storm canvas (`src/styles/tokens.ts` `theme.storm.canvas`, applied in
  `SensoryStormScreen`): `'#11162a'` → `rgb(17, 22, 42)`

These two colours are almost identical (contrast ratio ≈ 1.05:1), so a freehand
stroke is barely — sometimes not at all — visible while drawing. The Mode 2 grid
canvas is light (`anchorBg '#f8fafc'`), so the same dark ink reads fine there;
only Mode 1 is affected. `ModeTheme`'s storm filter (saturate/vignette/blur) does
not lighten the ink.

## Why this surfaced here, and why it's deferred

PRD-008's `DrawingPreview` re-renders saved drawings through the *same*
`engine/render.ts`. To make the Mode 1 attempt legible in the Reflection compare,
the preview deliberately uses a **light** surface (`bg-anchorBg`) — which sidesteps
the problem for previews but made the live-canvas contrast obvious by contrast.

Fixing the live surface is **Mode 1 (PRD-005) scope**, not PRD-008: it's a tuning
decision about how "low-contrast / uneasy" Mode 1 should feel, and it interacts
with the sensory-safety / reduced-intensity story (doc 07). Changing it mid-PRD-008
would be an unscoped visual change to another feature.

## Risk

Medium. Mode 1's whole point is a *felt* contrast with Mode 2, and low legibility
is partly intentional ("hard, uneasy"). But ink you cannot see at all removes the
drawing feedback loop entirely — you can't tell what you've drawn, which reads as
broken rather than merely difficult, and likely fails the "mild frustration, never
distress" golden rule. It also means real-device playtests (SC-1) may report Mode 1
as "the screen where nothing showed up".

## Suggested resolution

In a PRD-005 follow-up (or the PRD-011 polish pass), give the Mode 1 canvas a
**deliberately low-but-nonzero** stroke/background contrast — e.g. a slightly
lighter storm canvas or a muted-but-visible Mode 1 ink — tuned so the line is
*legible yet effortful*, and raised further under reduced-intensity (consistent
with the fade/notification softening in R05-11). Decide the exact values in
playtest. Coordinate with **DEBT-004** (engine palette vs tokens): if the engine
palette is re-pointed at `tokens.ts`, introduce a distinct Mode 1 ink token rather
than reusing `tokens.color.ink`.
