# PRD-004 — Design System & Navigation

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [02 §3](../_docs/02-architecture.md), [06 (all)](../_docs/06-ui-ux-spec.md), [01 §7](../_docs/01-game-design.md) |
| **Roadmap** | Phase 3 |
| **Depends on** | PRD-001 (shell), PRD-002 (store FSM) |
| **Owns FR** | FR-21 · supports FR-23 |

---

## 1. Objective

Establish the **design-token system** and the **navigation skeleton**: the
store-driven finite state machine, the `ScreenRouter` switch, all screen shells
wired to store transitions, and the shared presentational components. After this
PRD the whole flow walks end to end (`welcome → … → reflection → history →
welcome`) with placeholder content, and back-swipe does nothing.

## 2. Background & context

Navigation is a **finite state machine inside the store** (`screen` + `go`), not a
URL router — there is intentionally no browser history to swipe back through
([02 §3](../_docs/02-architecture.md), [05 ADR-004](../_docs/10-glossary-and-decisions.md)).
The **UI itself teaches the lesson**: Mode 1 is visually busy/low-contrast; Mode 2
is high-contrast/spacious. The token system and theming wrapper encode that
"two visual worlds" contrast ([06 §1,§4](../_docs/06-ui-ux-spec.md)).

## 3. Goals / Non-goals

**Goals:** design tokens (Tailwind config + `styles/tokens.ts`); `App.tsx` +
`routes.ts` + `ScreenRouter`; all 7 screen shells (stub content) wired to FSM;
shared components (`Button`, `FlowProgress`, `ProgressDots`, etc.); the
"two visual worlds" theming seam + storm→anchor transition hook.

**Non-goals:** the *behaviors* inside each mode (PRD-005/006), the rating scale
internals (PRD-007), reflection content (PRD-008), final copy (PRD-009).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R04-1 | Design tokens in `styles/tokens.ts` mirrored into `tailwind.config.ts`: colors (shell, storm, anchor, guidance), radius, space (`touch:44px`), font sizes/line-heights, motion timings, two themes. | P0 | Tokens from [06 §4](../_docs/06-ui-ux-spec.md) are importable and used via Tailwind utilities; no magic hex in components. |
| R04-2 | `routes.ts`: `Screen` enum + the transition map `welcome→mode1→stress1→mode2→stress2→reflection→(history|welcome)`. | P0 | Transition map matches the FSM in [01 §7](../_docs/01-game-design.md)/[03](../_docs/03-data-model-and-state.md). |
| R04-3 | `App.tsx` mounts `AppShell` → `ScreenRouter`; `ScreenRouter` renders the active screen from `store.screen`. | P0 | Changing `screen` swaps the rendered screen; no router/URL involved. |
| R04-4 | Seven screen shells exist and are wired to store transitions: Welcome, Mode1, Feedback(#1), Mode2, Feedback(#2), Reflection, History. | P0 | Each shell renders a stub and its primary CTA dispatches the correct `go`/lifecycle action. |
| R04-5 | The full flow is **walkable** with stubs: welcome→…→reflection→history→welcome. | P0 | Manual + E2E traversal hits every screen in order; state transitions correct. |
| R04-6 | Back-swipe / browser back does nothing destructive (single-document FSM, no history stack). | P0 (SC-4) | Triggering browser back does not navigate out of the active screen mid-flow. |
| R04-7 | `FlowProgress` top-level 5-step indicator reflects the current screen. | P1 (FR-21) | Advancing screens advances the indicator; it reads correctly at each step. |
| R04-8 | Shared components scaffolded: `Button` (primary/secondary/ghost, ≥44pt), `ProgressDots`, `Notification`/`Toast`, `GuideMascot` (placeholder), `StepCard` (placeholder), `InstallHint`, `ExitButton`. | P0 | Each renders; `Button` variants meet the 44×44pt touch target. |
| R04-9 | "Two visual worlds" theming seam: a per-mode wrapper applies the storm vs anchor theme (canvas bg, vignette, saturate, blur) from tokens. | P1 (FR-23) | Switching mode applies the corresponding theme treatment via the wrapper. |
| R04-10 | Storm→anchor transition hook ("fog clearing", ~900ms) available for the mode handoff; reduced-motion aware. | P1 (FR-23) | Transition plays on M1→M2; collapses to instant under `prefers-reduced-motion`. |
| R04-11 | One-decision-per-screen + thumb-first layout: primary actions in the bottom third; never two competing CTAs in Mode 2 contexts. | P0 | Layout review confirms primary CTAs are bottom-third and singular where required. |

## 5. Technical approach

Tokens and wireframes are fully specified in [06](../_docs/06-ui-ux-spec.md) §3–4.
Build Tailwind theme extension from `tokens` (single source; mirror, don't fork).
`ScreenRouter` is a `switch` on `store.screen` ([02 §3](../_docs/02-architecture.md)).
Screen shells subscribe to the **narrowest** store slice (PRD-002 selectors) to
avoid re-renders while the canvas is active. Component inventory →
[06 §7](../_docs/06-ui-ux-spec.md). The `RatingScale`, `GiverBeat`, `TargetReveal`
components are *owned* by PRD-007/005/006/008 respectively; this PRD only stubs
shared primitives.

**Design principles to enforce** ([06 §1](../_docs/06-ui-ux-spec.md)): the UI
teaches the lesson; thumb-first (44pt min); one decision per screen; calm by
default; readable type (AA on non-deliberate text); show-don't-tell (Welcome must
not explain the point — content gate enforced in PRD-009); a warm guide, never a
villain.

## 6. Non-functional requirements

- **NFR-6 / a11y:** AA contrast (≥4.5:1) on framing/Mode 2/reflection text; 44pt
  targets; semantic landmarks on shells (full a11y in PRD-010).
- **NFR-1:** screens must not subscribe to broad store slices that re-render during
  drawing.

## 7. Dependencies & interfaces

- **Provides:** tokens, `ScreenRouter`, screen shells, shared components,
  theming/transition seam, `FlowProgress`.
- **Consumes:** `AppShell` (PRD-001), store + selectors (PRD-002).
  **Consumed by:** every screen-content PRD (005–008).

## 8. Test plan

- **Component (RTL):** `FlowProgress` reflects current screen; `Button` variants +
  touch target; each shell's CTA dispatches the right action.
- **E2E (Playwright):** traverse welcome→…→reflection→history→welcome with stubs;
  assert transitions; browser-back does nothing.
- **a11y (axe, smoke):** shells have landmarks/labels (deepened in PRD-010).

## 9. Definition of Done

- Can traverse `welcome→…→reflection→history→welcome` with stub UIs; transitions
  correct; back-swipe does nothing (single document).
- Tokens drive all styling; no hard-coded colors in components.
- `FlowProgress` and shared primitives in place; theming seam ready for modes.

## 10. Open questions & risks

- **OQ-11** mascot persona/art — placeholder `GuideMascot` now; art in PRD-009.
- **OQ-8** i18n — components read copy from `content/` (PRD-009), no baked strings.
- **Risk:** theme wrapper filters (blur/saturate) can cost perf on low-end devices
  → keep subtle, measure, respect reduced-motion.

## 11. Traceability

FR-21 (owned); FR-23 (theming/transition, shared with 005/006). NFR-1, NFR-6.
ADR-004 (no history FSM), ADR-013 (two worlds, custom set). SC-3 (fast to first
draw), SC-4 (no back-swipe). Roadmap Phase 3 DoD.
