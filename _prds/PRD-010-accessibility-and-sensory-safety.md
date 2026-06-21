# PRD-010 — Accessibility & Sensory Safety

| | |
|---|---|
| **Status** | **Done** — code + automated a11y gate complete; manual screen-reader (VoiceOver/TalkBack) + real-device sensory passes pending hardware (see §9) |
| **Source docs** | [07 (all)](../_docs/07-accessibility-and-ethics.md), [05 §1,§4](../_docs/05-pwa-and-mobile-shell.md), [06 §5](../_docs/06-ui-ux-spec.md) |
| **Roadmap** | Cross-cutting (satisfied incrementally; verified at Phase 8) |
| **Depends on** | Touches every feature PRD (001–009) |
| **Owns FR** | (cross-cutting) supports FR-22 · owns NFR-6 |

---

## 1. Objective

Make the experience **accessible and sensory-safe** without breaking the
*designed* difficulty of Mode 1. This PRD is the cross-cutting accessibility +
sensory-safety contract: WCAG-minded a11y, the `reducedIntensity` mode, global
`prefers-reduced-motion`, the always-available calm exit, and the photosensitivity
/ no-startling-audio guarantees. Its checklist is part of the release gate.

## 2. Background & context

The game depicts autistic experience, so responsibility is paramount. Mode 1 is the
**risk surface**: it intentionally induces *mild* discomfort, but some users
(autistic users, PTSD, sensory sensitivities, vestibular issues, epilepsy) can be
affected more strongly. Safeguards are mandatory and must survive the chaos of Mode
1 ([07 §3](../_docs/07-accessibility-and-ethics.md)).

## 3. Goals / Non-goals

**Goals:** sensory-safety safeguards; reduced-intensity behavior; reduced-motion;
WCAG-minded contrast/targets/screen-reader/keyboard support; no-photosensitive-
trigger + no-startling-audio guarantees; the calm exit.

**Non-goals:** the *content* tone/ethics copy (PRD-009), the gesture-blocking shell
mechanics (PRD-001 — though a11y informs them).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R10-1 | **Pre-warning + opt-out:** a plain sensory-intensity note + the persistent "Reduce intensity" toggle (`reducedIntensity`, PRD-002) before/around Mode 1. | P0 ([07 §3](../_docs/07-accessibility-and-ethics.md)) | The note + toggle are present on Welcome and reachable in Mode 1. |
| R10-2 | **Reduced-intensity** measurably softens Mode 1 across **four** channels: suppress erratic haptic (soft confirm only); fewer/slower notifications never overlapping the canvas; minimal motion / gentle text fade; raised vague-text contrast (uncomfortable, not unreadable). | P0 (FR-22, NFR-6) | Toggling it changes all four channels (verified per PRD-005 R05-11). |
| R10-3 | **Respect `prefers-reduced-motion`:** auto-enable reduced-motion paths; no drift/parallax/auto-scroll; global CSS override present. | P0 (NFR-6) | OS reduced-motion → no drifting/auto-scroll anywhere; Mode 1 still conveys discomfort via content. |
| R10-4 | **No photosensitive triggers:** no flashing >3Hz, no strobe, no rapid high-contrast flicker; notifications slide gently; nothing blinks. | P0 | Visual audit confirms no >3Hz flashing anywhere. |
| R10-5 | **No startling audio** in v1 (ADR-005). | P0 | App ships no sudden sounds. |
| R10-6 | **Always-available calm exit** from Mode 1 to a neutral screen, no penalty; leaving is never a failure state. | P0 (FR-22) | Exit reachable throughout Mode 1; using it is penalty-free. |
| R10-7 | **Contrast:** AA (≥4.5:1) for all *framing, instruction, and Mode 2* text. Mode 1 vague text is a **documented exception** (difficulty is the point); reduced-intensity raises it. | P0 | axe + manual: AA on non-deliberate surfaces; the one exception is documented. |
| R10-8 | **Touch targets:** ≥44×44pt for every interactive control (incl. Mode 1's "smaller" Done). | P0 | All controls measure ≥44pt. |
| R10-9 | **Screen readers:** semantic landmarks/labels on framing, stress/confidence input, Mode 2 step cards, reflection; live canvas has an `aria-label`; saved drawings get a text summary; rating scale is a labeled radiogroup/slider with values announced. | P0 | VoiceOver + TalkBack pass over framing/stress/Mode2/reflection; values + step cards announced. |
| R10-10 | **No reliance on color alone:** Mode 2 success uses shape/position + highlight (+ haptic), not just color; rating shows numbers/labels, not only a gradient. | P0 | Meaning survives grayscale. |
| R10-11 | **No reliance on haptics:** every haptic cue has a visual channel (iOS lacks vibration). | P0 (ADR-003) | On iOS (no vibration) Mode 1 discomfort + Mode 2 satisfaction still read visually. |
| R10-12 | **Keyboard/switch (best-effort):** Welcome, stress/confidence, Mode 2 Next/Undo, and navigation operable without precise drawing where feasible; we do not fake the inherently-pointer drawing task as accessible. | P1 | Non-drawing controls are operable by keyboard/switch. |
| R10-13 | **Ethics framing in interactive surfaces:** the Grown-up reads warm in both modes; the "not quite right" beat + target reveal blame the **instructions**, never the player; confidence wording neutral; kid framing doesn't infantilize. | P0 ([07 §2](../_docs/07-accessibility-and-ethics.md)) | Verified with sensitive users; release-gate items green. |

## 5. Technical approach

Global reduced-motion override lives in `index.css` (PRD-001). `reducedIntensity`
is a persisted store flag (PRD-002) consumed by `useHaptics` (PRD-003), Mode 1
(PRD-005), and Welcome (PRD-004). Screen-reader semantics are added per-component
as those PRDs are built; this PRD is the **acceptance owner** that verifies them
together. Contrast/targets enforced via design tokens (PRD-004 §4). Reference:
[07](../_docs/07-accessibility-and-ethics.md), [05 §4](../_docs/05-pwa-and-mobile-shell.md),
[06 §5](../_docs/06-ui-ux-spec.md).

## 6. Non-functional requirements

- **NFR-6** owned here. Supports NFR-5 (graceful where vibration absent).
- The accessibility passes are a **pre-release manual gate** alongside the ethics
  gate ([09 §5,§8](../_docs/09-testing-and-qa.md)).

## 7. Dependencies & interfaces

- **Consumes:** `reducedIntensity` (PRD-002), tokens (PRD-004), every interactive
  surface (PRD-004–008), copy (PRD-009).
- **Provides:** the accessibility + sensory-safety acceptance for release.

## 8. Test plan

- **Automated:** `axe-core` (via `@axe-core/playwright`) on Welcome, Stress, Mode 2,
  Reflection — zero serious violations on non-deliberate surfaces.
- **Manual:** VoiceOver (iOS) + TalkBack (Android) over framing/stress/Mode2/
  reflection; values + step cards announced.
- **Reduced-motion:** enable in OS → no drifting/auto-scroll; Mode 1 still conveys
  discomfort via content.
- **Reduced-intensity:** verify all four channels soften.
- **Photosensitivity/audio:** visual audit (no >3Hz flashing); confirm no audio.
- **Color/haptic independence:** grayscale + vibration-off checks.

## 9. Definition of Done

**Code & automated — complete ✅**

- [x] **Automated a11y gate** (`@axe-core/playwright`, `tests/e2e/a11y.spec.ts`):
  Welcome, the Stress check, Mode 2, and Reflection scan clean of serious/critical
  WCAG 2.0/2.1 A+AA violations on **Mobile Chrome + Mobile Safari**. Mode 1 is the
  documented exception (R10-7) and is excluded by design.
- [x] **AA contrast** enforced on non-deliberate surfaces; the gate caught the
  primary-CTA failure (white on `#3b82f6` = 3.67:1) — fixed by darkening the
  `primary` token to `#2563eb` (5.17:1). Mode 1 vague text stays the bounded,
  documented low-contrast exception (reduced-intensity raises it).
- [x] **Live canvases labelled** (R10-9): both the Mode 1 freehand and the Mode 2
  snap-to-grid canvases carry an `aria-label` (the Mode 2 label was the gap closed
  here); guarded by the a11y spec.
- [x] **Reduced-intensity** softens Mode 1 across all four channels (haptics /
  notifications / motion-fade / vague-text contrast) — unit-tested (PRD-005 R05-11:
  `haptics.test`, `fakeNotifications.test`, `vagueInstruction.test`).
- [x] **Reduced-motion** path verified: global `index.css` override + every JS-motion
  consumer (`VagueInstruction`, `StepGuidanceCanvas`, `TargetReveal`) honours the
  query (unit-tested).
- [x] **No startling audio** (R10-5): the app ships **no** audio APIs (grep-verified).
  **No photosensitive triggers** (R10-4): no `setInterval`; all motion is rAF at
  ≥900 ms periods (≤~1 Hz) — far below the 3 Hz threshold; nothing flashes/strobes.
- [x] **Calm exit** reachable throughout Mode 1 (`ExitButton`, penalty-free);
  **44pt targets** via `min-h-touch`/`min-w-touch` on the `Button` primitive +
  rating faces; **meaning survives grayscale** (RatingScale words/positions, Mode 2
  completion beat text) and **vibration-off** (every haptic has a visual counterpart).

**Manual real-device / human gates — pending hardware ⏳ (`_docs/09` §6; cannot run in CI/emulator)**

- [ ] **VoiceOver (iOS) + TalkBack (Android)** pass over framing / stress / Mode 2
  step cards / reflection; values + step cards announced (R10-9).
- [ ] Reduced-motion + reduced-intensity validated by feel on a real device.
- [ ] The accessibility items of the release gate ([07 §7](../_docs/07-accessibility-and-ethics.md))
  are signed off alongside the ethics **sensitivity review** (R10-13 / PRD-009 R09-12).

## 10. Open questions & risks

- **Risk:** an a11y fix could blunt the *designed* Mode 1 difficulty → the vague-
  text contrast exception is explicit and bounded; everything else stays accessible.
- Reduced-intensity tuning is validated in playtest (PRD-005/011).

## 11. Traceability

NFR-6 owned; supports FR-22, NFR-5. ADR-003 (no haptic reliance), ADR-005 (no
audio), ADR-008 (safety info stays up front even as the topic defers). SC-4, SC-6.
[07 §7](../_docs/07-accessibility-and-ethics.md) release gate · [09 §5](../_docs/09-testing-and-qa.md).
