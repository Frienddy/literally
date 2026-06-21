# PRD-001 — Platform Shell & PWA

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [02 §1–3,7](../_docs/02-architecture.md), [05 (all)](../_docs/05-pwa-and-mobile-shell.md) |
| **Roadmap** | Phase 0 |
| **Depends on** | — (this is the foundation everything else builds on) |
| **Owns FR** | FR-12, FR-13 · supports FR-22, FR-23 |

---

## 1. Objective

Stand up the project and the **rigid, installable, offline mobile shell** that
every screen renders inside. After this PRD, "Literally" installs to a phone home
screen, launches in airplane mode, locks to portrait, and refuses every browser
gesture (pull-to-refresh, overscroll, text selection, pinch/double-tap zoom) — an
empty but production-grade shell.

## 2. Background & context

The locked-down shell is not polish; it protects the **experiential** design. A
pull-to-refresh, an accidental back-swipe, or a text-selection popover mid-Mode-1
shatters the immersion that "show, don't tell" depends on. See
[05 intro](../_docs/05-pwa-and-mobile-shell.md) and [ADR-004](../_docs/10-glossary-and-decisions.md).

## 3. Goals / Non-goals

**Goals:** project scaffold + tooling; PWA manifest + service worker (true
offline); three-layer gesture blocking; portrait enforcement; install affordance.

**Non-goals:** any screen content (PRD-004+), the canvas (PRD-003), the store
(PRD-002). The store *key* `reducedIntensity` is consumed later; this PRD only
ensures the shell hosts it.

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R01-1 | Scaffold Vite + React 18 + TypeScript (`strict: true`) + Tailwind. | P0 | `npm run dev` serves a blank app; `npm run build` produces a bundle; TS strict on. |
| R01-2 | Tooling: ESLint + Prettier, Vitest, Playwright configured. | P0 | `npm run lint`, `npm run test`, `npm run test:e2e` all run (even with 0 tests). |
| R01-3 | PWA via `vite-plugin-pwa` (Workbox): manifest + precaching SW; `registerType: 'autoUpdate'`. | P0 (FR-12) | App is **installable** (Lighthouse "installable" ✓) on Android & iOS. |
| R01-4 | Manifest: `display: standalone`, `orientation: portrait`, name/short_name, theme/background `#0b1020`, 192/512/maskable icons, `start_url:/`, `scope:/`. | P0 (FR-12) | Manifest validates; installed app opens chrome-less, portrait, with the icon. |
| R01-5 | Service worker precaches the app shell (`globPatterns` JS/CSS/HTML/PNG/SVG/woff2) + `navigateFallback: /index.html`. | P0 (FR-12, NFR-2) | After first load, app launches with **network disabled** (airplane mode). |
| R01-6 | Global gesture-blocking CSS in `index.css`: `overscroll-behavior:none`, `user-select:none`, `-webkit-touch-callout:none`, `#root{position:fixed;inset:0;overflow:hidden}`, `canvas{touch-action:none}`, inputs allow text selection, reduced-motion override. | P0 (FR-13) | No pull-to-refresh; no text selection/callout; no document scroll/bounce. |
| R01-7 | `usePreventGestures` JS guard: block multi-touch pinch, double-tap zoom, `gesturestart`. | P0 (FR-13) | No pinch-zoom, no double-tap zoom (verified on real iOS + Android). |
| R01-8 | `index.html` viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`; theme-color; iOS standalone metas; apple-touch-icon. | P0 (FR-13) | Notch area used (viewport-fit); no user zoom. |
| R01-9 | `AppShell` layout: applies `usePreventGestures`, pads `env(safe-area-inset-*)`, hosts children, renders `PortraitGuard` in landscape. | P0 (FR-13) | Safe-area insets respected on a notched device; landscape shows guard. |
| R01-10 | Portrait enforcement: `useOrientation` + `PortraitGuard` interstitial; opportunistic `screen.orientation.lock('portrait').catch(()=>{})` on first gesture; manifest `orientation` for installed. | P0 (FR-13) | Rotating to landscape shows the "rotate to portrait" guard; portrait restores content. |
| R01-11 | Install affordance: `useInstallPrompt` (Android `beforeinstallprompt`) + platform-aware iOS guidance text ("Share → Add to Home Screen"). | P1 (FR-12) | Android shows an in-app install button; iOS shows manual guidance. |
| R01-12 | Single `src/config.ts` tunables surface created (wobble, cadence, grid, fade, haptics) seeded with token values. | P1 | Importable config object exists; later PRDs read from it. |

## 5. Technical approach

Lift the reference implementations from [05](../_docs/05-pwa-and-mobile-shell.md)
directly: `index.css` global rules (§1.1), `index.html` (§1.2),
`usePreventGestures` (§1.3), `AppShell` (§2), `useOrientation` + `PortraitGuard`
(§2.1), `vite.config.ts` VitePWA (§3), `main.tsx` SW registration (§3),
`useInstallPrompt` (§5). Folder layout per [02 §3](../_docs/02-architecture.md).
Tailwind tokens come from PRD-004 §design tokens; stub the config now and fill on
PRD-004.

**Defense in depth:** gestures are blocked at CSS **and** viewport **and** JS
layers because no single layer covers every browser. Edge-swipe-back has no full
web fix — the real mitigation is standalone install (chrome-less) + single-document
FSM; surface install guidance prominently.

## 6. Non-functional requirements

- **NFR-2 Offline:** verified in airplane mode after first visit.
- **NFR-3 Footprint:** keep the shell bundle minimal (no heavy deps).
- **NFR-6 Reduced motion:** global CSS override present from day one.
- SW needs a **secure context** — test `preview` over HTTPS/LAN/tunnel.

## 7. Dependencies & interfaces

- **Provides:** `AppShell` (wraps `<App/>`), global CSS, PWA install/offline,
  portrait guard, `useInstallPrompt`, `src/config.ts`.
- **Consumes:** nothing yet. (Tailwind tokens finalized in PRD-004.)

## 8. Test plan

- **E2E (Playwright, mobile emulation):** attempt scroll/overscroll on the page →
  page does not scroll; rotate → PortraitGuard appears.
- **Manual real-device (mandatory, [09 §6](../_docs/09-testing-and-qa.md)):**
  installs to home screen (iPhone + Android); works fully offline; no
  pull-to-refresh / selection / double-tap / pinch; safe-area insets respected;
  edge-swipe-back does not exit mid-game when installed.
- **Lighthouse:** PWA installable ✓, offline ✓.

## 9. Definition of Done

- App installs to home screen on a **real iPhone and a real Android**.
- Loads in **airplane mode** after first visit.
- No pull-to-refresh, no text selection, no double-tap/pinch zoom; landscape shows
  `PortraitGuard`.
- Lighthouse PWA: installable + offline pass.
- The Phase 0 mobile-shell checklist in [05 §6](../_docs/05-pwa-and-mobile-shell.md)
  is fully green.

## 10. Open questions & risks

- **OQ-8** i18n scope: EN only for v1; `lang` attribute set, content structure
  ready (content lives in PRD-009).
- **Risk:** iOS Safari occasionally ignores `user-scalable=no` in PWAs → mitigated
  by the JS pinch guard (R01-7).
- **Risk:** `devOptions.enabled` SW can cache-stale during dev → use
  `autoUpdate`; document a hard-reload/clear-storage step for devs.

## 11. Traceability

FR-12, FR-13 (owned). NFR-2, NFR-3, NFR-5, NFR-6. ADR-001 (local-first),
ADR-004 (gesture blocking + standalone). SC-4 (no accidental gestures). Roadmap
Phase 0 DoD.
