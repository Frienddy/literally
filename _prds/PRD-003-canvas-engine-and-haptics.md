# PRD-003 — Canvas Engine & Haptics

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [04 (all)](../_docs/04-canvas-engine.md), [05 §4](../_docs/05-pwa-and-mobile-shell.md), [02 §5](../_docs/02-architecture.md) |
| **Roadmap** | Phase 2 — *the riskiest, highest-value piece; de-risk early* |
| **Depends on** | PRD-001 (shell, `config.ts`), PRD-002 (`DrawingData` types) |
| **Owns FR** | FR-2, FR-3, FR-6, FR-18 (engine half) |

---

## 1. Objective

Build the **pure drawing engine** and the `useCanvas` hook that powers **both**
Mode 1 (freehand + wobble) and Mode 2 (snap-to-grid), plus `useHaptics`. The
canvas is an **imperative island**: points accumulate in refs and render on
`requestAnimationFrame`; React never re-renders per pointer event. This is the
zero-latency requirement.

## 2. Background & context

These mechanics **are** the "show, don't tell": Mode 1's wobble + erratic haptics
make "without instruction" *feel* out of control; Mode 2's snapping + crisp click
make "with instruction" *feel* certain. The contrast reaches the player through
their fingertips, never in words. Drawing math lives in a pure, framework-free
`engine/` layer so it is unit-testable and shared by live drawing **and** read-only
previews — so a saved drawing re-renders exactly as drawn. See
[04 §1](../_docs/04-canvas-engine.md) and [ADR-006](../_docs/10-glossary-and-decisions.md).

## 3. Goals / Non-goals

**Goals:** `engine/{geometry,wobble,snap,render}.ts`; `useCanvas` (one hook, two
modes); `Canvas` component wiring; DPR handling; `useHaptics`; Mode 2 guidance +
target-ghost renderers.

**Non-goals:** the screens that mount the canvas (PRD-005/006); the step sequence
data (PRD-006/009); reflection layout (PRD-008). This PRD delivers the engine +
hook + a demo harness, not the mode UX.

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R03-1 | `engine/geometry.ts`: `dist`, `simplify` (RDP), `quantize`. | P0 (NFR-3) | `simplify` reduces point count keeping shape within epsilon; `quantize` rounds to ints. |
| R03-2 | `engine/wobble.ts`: `applyWobble` — seeded, smooth value-noise, **perpendicular** displacement; `WobbleConfig{amplitude,frequency}`. | P0 (FR-2) | Same seed+input → identical output (deterministic); displacement ≤ `amplitude`; returns `p` unchanged when `prev` is null. |
| R03-3 | `engine/snap.ts`: `GridSpec`, `nodeToPixel`, `snapToNode` (nearest, clamped to bounds), `isWithinSnap(tolerance)`. | P0 (FR-3) | `snapToNode` returns nearest node, clamps out-of-bounds; `nodeToPixel` round-trips; `isWithinSnap` true only inside tolerance. |
| R03-4 | `engine/render.ts`: `clear`, `drawGrid`, `drawFreehand`, `drawGridDrawing` — pure, framework-free, shared by live + preview. | P0 | A `DrawingData` renders identically via the live loop and a standalone preview canvas. |
| R03-5 | `engine/render.ts`: `drawStepGuidance` (pulsing start node + ghosted target segment) and `drawTargetGhost` (faint intended result behind M1 attempt). | P1 (FR-18, FR-17) | Guidance pulses via a `phase` param; target ghost renders at reduced alpha behind the attempt. |
| R03-6 | `useCanvas({mode,wobble?,grid?,onHaptic?,onChange?})`: one hook, `mode:'freehand'|'grid'`. | P0 (FR-1) | Same hook drives both modes by param; shared DPR/pointer/rAF plumbing written once. |
| R03-7 | **Refs-not-state:** stroke points accumulate in refs; render on `requestAnimationFrame`; the store is touched **only** via `onChange` once per finished stroke/segment. | P0 (ADR-006, NFR-1) | React DevTools profiler shows **no** component re-render during an active stroke. |
| R03-8 | Freehand: pointer stream → wobble applied → live render; on pointer-up, stroke is `simplify`+`quantize`d, pushed, and `onChange` emits a `FreehandDrawing` (incl. capture canvas size). | P0 (FR-2) | E2E stroke yields `onChange` with a freehand drawing of >1 point after simplify. |
| R03-9 | Grid: pointer-down snaps a start node; live rubber-band segment renders to the snapped target; on pointer-up a `GridSegment{from,to}` (distinct nodes) is pushed and `onChange` emits a `GridDrawing`. | P0 (FR-3) | E2E drag node A→B yields exactly one segment with integer nodes. |
| R03-10 | `onHaptic('move')` fires **throttled & jittered** during freehand movement; `onHaptic('snap')` fires the instant the pointer lands on a **new** node. | P0 (FR-6) | Move haptic respects the throttle window; snap haptic fires once per new node (not per move event). |
| R03-11 | DPR handling: size backing store to `cssSize × devicePixelRatio`, scale context so 1 unit = 1 CSS px; re-fit on resize/rotate without losing committed strokes. | P0 (NFR-1) | Lines are crisp on retina; rotating and returning to portrait keeps committed strokes. |
| R03-12 | Pointer capture so a stroke survives the finger drifting off the canvas edge. | P0 | A stroke started on-canvas and dragged past the edge stays one continuous stroke. |
| R03-13 | Public actions `undo()` and `reset()` (Undo surfaced only in Mode 2 per GDD). | P0 (FR-4) | `undo` pops the last segment/stroke and re-renders; `reset` clears all. |
| R03-14 | `Canvas` component wires `useCanvas` via the `setCanvas` ref callback, sets `touch-action:none`, and exposes Undo/Reset to the mode screens. | P0 | Mounting `<Canvas/>` in either mode draws with no input lag. |
| R03-15 | `useHaptics`: feature-detect `navigator.vibrate`; map `'move'→erratic [10,30,15,40]`, `'snap'→15`; honor `reducedIntensity` (suppress erratic, soften click); no-op where unsupported. | P0 (FR-6, ADR-003) | On iOS Safari it no-ops cleanly; reduced-intensity suppresses the erratic buzz. |

## 5. Technical approach

Lift the reference code from [04](../_docs/04-canvas-engine.md): geometry (§2.1),
wobble (§2.2), snap (§2.3), render (§2.4) + guidance/ghost (§2.5), `useCanvas`
(§3); and `useHaptics` from [05 §4](../_docs/05-pwa-and-mobile-shell.md). Tunables
(wobble amplitude/frequency, haptic patterns, grid cell size) come from
`src/config.ts` (PRD-001 R01-12) so playtesters tune without hunting through code.

**Correctness anchors** ([04 §4](../_docs/04-canvas-engine.md)): `touch-action:none`
on the canvas + `preventDefault` in handlers; pointer capture; DPR sizing re-fit on
resize/rotate; refs-not-state for per-point data; saved == live via shared
`render.ts`.

**Wiring contract for mode screens:** `<Canvas mode wobble|grid onHaptic onChange/>`;
`onHaptic` → `useHaptics().vibrate`; `onChange` → `saveMode1Drawing`/`saveMode2Drawing`
(PRD-002). `'move'→vibrate('move')`, `'snap'→vibrate('snap')`.

## 6. Non-functional requirements

- **NFR-1 Performance:** input→ink < ~16ms (one frame); 60fps during a stroke; no
  long tasks; no React re-render during a stroke (the headline proof of ADR-006).
- **NFR-3 Footprint:** no canvas library (Konva/Fabric); bespoke engine only.
- **NFR-5:** haptics degrade gracefully (iOS no-op).

## 7. Dependencies & interfaces

- **Provides:** `engine/*`, `useCanvas`, `Canvas`, `useHaptics`, guidance/ghost
  renderers (consumed by reflection in PRD-008).
- **Consumes:** `DrawingData` types (PRD-002), `config.ts` (PRD-001),
  `reducedIntensity` selector (PRD-002).

## 8. Test plan

- **Unit (Vitest, target ≥90% on `engine/`):** `wobble` determinism + bound + null
  prev; `snap` nearest/clamp/round-trip/tolerance; `geometry` simplify ratio +
  quantize.
- **E2E (Playwright touch):** freehand stroke → `onChange` freehand payload with
  >1 point; node A→B drag → one grid segment + snap-haptic count; Undo works in
  grid, no Undo in freehand mode; scroll/overscroll on canvas → page doesn't
  scroll.
- **Perf (manual + profiler):** confirm no re-render during a stroke; 60fps.

## 9. Definition of Done

- Freehand draws with **visible-but-usable wobble at 60fps, no input lag**.
- Grid mode snaps endpoints to nodes; crisp haptic on each new node (Android).
- Undo/Reset work; `onChange` emits correct `DrawingData` payloads.
- Engine unit coverage ≥ 90%; profiler shows no per-stroke re-render.

## 10. Open questions & risks

- **OQ-6** wobble amplitude/frequency — start 3px / 0.18, tune in Phase 4 playtest.
- **OQ-5** grid cols×rows + cell size — ~8×10; finalize with Mode 2 (PRD-006).
- **Risk (highest in project):** touch feel / latency on real devices →
  de-risked early; validate on real iPhone + Android before building mode UX.
- **Risk:** seeded wobble must reproduce on replay → covered by determinism test
  (R03-2).

## 11. Traceability

FR-2, FR-3, FR-6 (owned); FR-1, FR-4, FR-17, FR-18 (engine support). NFR-1, NFR-3,
NFR-5. ADR-003 (haptics enhancement), ADR-006 (refs-not-state), ADR-013 (guidance
renderers). SC-4 (no input lag). Roadmap Phase 2 DoD.
