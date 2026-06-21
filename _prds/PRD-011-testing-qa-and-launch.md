# PRD-011 — Testing, QA & Launch

| | |
|---|---|
| **Status** | **Done (automatable)** — CI + the full automated test pyramid, bundle budget, the no-re-render invariant, and the polish face set are complete and green. The **manual pre-release gates** remain: real-device matrix (R11-6), screen-reader passes (R11-4), on-device Lighthouse perf/PWA (R11-7/R11-9), and the newcomer-comprehension playtest (R11-11) — all need hardware/humans (see §9). |
| **Source docs** | [09 (all)](../_docs/09-testing-and-qa.md), [08 Phase 8](../_docs/08-implementation-roadmap.md) |
| **Roadmap** | Phase 8 (+ continuous CI from Phase 0) |
| **Depends on** | All feature PRDs (001–010) |
| **Owns** | Test pyramid, device matrix, perf budgets, CI, final polish, launch gates |

---

## 1. Objective

Make "Literally" **ship-quality on real devices**: a working test pyramid (unit /
component / E2E), the mandatory real-device matrix, performance budgets, the visual
polish layer, CI enforcement, and the two pre-release manual gates (device matrix +
ethics/a11y). Because this is an offline, touch-and-haptics, sensory app,
**real-device testing is mandatory** — emulators can't validate haptics, true
offline install, or touch feel.

## 2. Background & context

The test strategy is a pyramid: widest at pure-logic unit tests, narrowing through
component tests to E2E/device tests ([09 §1](../_docs/09-testing-and-qa.md)). CI
runs the automated layers on every PR; the real-device matrix and screen-reader
passes are a pre-release manual gate run alongside the ethics gate.

## 3. Goals / Non-goals

**Goals:** stand up + enforce the full test suite and budgets; run the device
matrix + a11y passes; deliver the visual polish layer; the newcomer-comprehension
playtest; Lighthouse PWA audit; launch readiness.

**Non-goals:** writing the features (PRD-001–010) — this PRD verifies them and adds
the final polish + perf + QA.

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R11-1 | **Unit tests (Vitest):** `engine/*` (wobble determinism/bound/null, snap nearest/clamp/round-trip/tolerance, geometry simplify/quantize), `store` lifecycle + clamps + partialize, `migrations` corrupt-fallback. Target ≥90% on `engine/` + `store/`. | P0 | Suite passes; coverage ≥90% on those dirs. |
| R11-2 | **Component tests (RTL):** Welcome framing + reduce-intensity persists; `RatingScale` calls setStress/setConfidence + labeled; Mode 2 `StepInstruction` one-card/Next/Back/progress/no-timer; `FlowProgress`; Reflection renders previews + target reveal + both scores; History newest-first + delete-all. | P0 | All component tests pass. |
| R11-3 | **E2E (Playwright, mobile emulation, iPhone 13 + Pixel 7):** full happy path incl. target reveal + both scores + reload-persists; freehand capture payload; snap capture segment; no-Undo-M1 / Undo-M2; gesture-blocking (canvas scroll does nothing). | P0 | All E2E flows green on both device descriptors. |
| R11-4 | **Accessibility tests:** `axe-core` on Welcome/Stress/Mode2/Reflection (zero serious on non-deliberate surfaces); manual VoiceOver + TalkBack; reduced-motion; reduced-intensity. | P0 | axe clean; manual SR passes recorded (ties to PRD-010). |
| R11-5 | **Content test:** `welcome.copy.ts` contains no autism/ASD terms (the reveal-on-Reflection-only guarantee). | P0 | Test fails if forbidden terms appear in welcome copy. |
| R11-6 | **Manual real-device matrix** ([09 §6](../_docs/09-testing-and-qa.md)) run on iPhone (Safari + installed) and Android (Chrome + installed): install, offline, portrait, no pull-to-refresh/selection/zoom, edge-swipe-back, latency, haptics (Android), safe-area, survives force-quit. Include one small (iPhone SE) + one large (Pixel 7 Pro) screen. | P0 | Matrix fully checked; small + large layouts validated. |
| R11-7 | **Performance:** input→ink < ~16ms; no long tasks during a stroke; **no React re-render during a stroke** (profiler); Lighthouse mobile Performance ≥90, Best Practices ≥95. | P0 (NFR-1) | DevTools + profiler + Lighthouse meet targets. |
| R11-8 | **Bundle-size budget** enforced in CI (PRD-000 NFR-3, ~200KB gzipped app code). | P0 (NFR-3) | CI fails if app JS exceeds the budget. |
| R11-9 | **Lighthouse PWA audit:** installable ✓, offline ✓, best practices. | P0 (FR-12) | Lighthouse PWA checks pass. |
| R11-10 | **Visual polish layer:** two themes (storm/anchor) + storm→anchor transition; custom icon + face set replacing platform emoji; snap "pop" + beat micro-interactions — all reduced-motion aware. | P1 (FR-23, ADR-013) | Polish shipped; reduced-motion collapses animations; faces/icons consistent cross-device. |
| R11-11 | **Newcomer-comprehension playtest:** 3–5 testers with **no prior ASD knowledge**; confirm (a) welcome didn't tip the topic, (b) after the reveal they restate one concrete difference + why clarity helps — untaught. | P0 (SC-2b) | Playtest run; results recorded; majority succeed. |
| R11-12 | **Edge cases scripted:** reload mid-session lands on Welcome cleanly; localStorage full → friendly quota error; corrupt blob → migration fallback boots; rotate mid-draw → PortraitGuard then intact canvas; rapid double-tap on Next/Done doesn't double-submit; `task_id` + confidence persist + reflection reveals the right target; beat skippable + non-blocking; Mode 2 guidance highlights the correct node. | P0 | Each edge case verified (automated where feasible, else manual). |
| R11-13 | **CI:** on PR run typecheck + ESLint + Vitest + Playwright (headless mobile) + bundle-size budget. | P0 | CI gates merges on all of the above. |
| R11-14 | **Optional FR-14 image export** validated if in scope. | P2 (FR-14) | If shipped, export produces a PNG locally with no network. |

## 5. Technical approach

Test tooling from [02 §1](../_docs/02-architecture.md): Vitest + React Testing
Library + Playwright (+ `@axe-core/playwright`). Device descriptors per
[09 §4](../_docs/09-testing-and-qa.md). The two **manual gates** (real-device matrix
§6 + ethics/a11y release gate [07 §7](../_docs/07-accessibility-and-ethics.md)) run
before each public release. Polish work draws on [06 §4,§6](../_docs/06-ui-ux-spec.md)
tokens + [04 §2.5](../_docs/04-canvas-engine.md) renderers. SW/offline must be tested
over a secure context (HTTPS/LAN/tunnel) on a real device.

## 6. Non-functional requirements

- Verifies **NFR-1** (perf), **NFR-2** (offline), **NFR-3** (footprint),
  **NFR-4** (no network — confirm in DevTools offline), **NFR-5** (compat),
  **NFR-6** (reduced motion/intensity), **NFR-7** (resilience).

## 7. Dependencies & interfaces

- **Consumes:** every feature PRD's deliverables + DoD.
- **Provides:** the green-light to ship — CI gates + the two manual release gates.

## 8. Test plan

This PRD *is* the test plan; see §4. Coverage targets: ≥90% on `engine/` + `store/`;
all P0 functional + non-functional requirements met; QA matrix green; Lighthouse
PWA ✓.

## 9. Definition of Done (and launch gate)

**Automatable — done (green in CI):**
- ✅ All P0 *automatable* functional + non-functional requirements met across PRDs
  001–010 (the per-PRD "pending hardware" feel checks excepted).
- ✅ Unit/component/E2E/a11y/content suites green in CI (**161 Vitest + 40 Playwright**
  on iPhone 13 + Pixel 7; axe clean on the non-deliberate surfaces); **bundle budget
  enforced** (`check:size`, 65.8 KB of 200 KB).
- ✅ The **no per-stroke re-render** invariant is now an automated test (R11-7,
  ADR-006), not just a profiler check.
- ✅ R11-8 (bundle budget), R11-10 (app-shipped face set), R11-13 (CI) shipped.

**Manual pre-release gate — pending hardware/humans:**
- ⏳ Real-device matrix green (iPhone + Android, installed + browser; small + large) — R11-6.
- ⏳ On-device perf: input→ink, 60fps, Lighthouse PWA ✓, Perf ≥90, Best Practices ≥95 — R11-7/R11-9.
- ⏳ Newcomer-comprehension playtest passed (SC-2b); SC-1…SC-6 evidenced — R11-11.
- ⏳ Manual VoiceOver + TalkBack screen-reader passes — R11-4.
- ⏳ **Ethics + a11y release gate** ([07 §7](../_docs/07-accessibility-and-ethics.md))
  signed off — incl. the PRD-009 human sensitivity review (R09-12).
- ⏳ Verified offline (airplane mode) with **no network calls** (DevTools) on a device —
  the static `grep` proof of no runtime egress is already green.

## 10. Open questions & risks

- **OQ-3** image export v1 vs v1.1.
- **Risk:** emulators can't validate haptics / true install / touch feel → real
  devices mandatory (the matrix is non-negotiable).
- **Risk:** Lighthouse perf on low-end devices vs theme filters → measure; keep
  theme treatments subtle.

## 11. Traceability

Verifies all FR-1…FR-23, NFR-1…NFR-7, SC-1…SC-6. ADR-013 (polish). Roadmap Phase 8
DoD + global Definition of Done ([08](../_docs/08-implementation-roadmap.md)) +
[09](../_docs/09-testing-and-qa.md) entirety.
