# DEBT-007 — Vite dev-server advisories (require Vite-major bump)

**Status:** Open (deferred) · **Severity:** Low (development-only) · **Surfaced by:** [DEBT-003](./archive/003-dev-dependency-audit-esbuild-vite.md) resolution

## What

Pinning the patched `esbuild@0.25` (DEBT-003) cleared the esbuild advisory and
left `npm audit` reporting **6 advisories**, all now keyed to **Vite itself**
(`vite <= 6.4.2`), reached transitively through `vitest`, `vite-node`, and
`vite-plugin-pwa`. Three distinct, independent advisories — none of which existed
when DEBT-003 was written:

| Advisory | Issue | Affected | First patched |
|---|---|---|---|
| [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) | Path traversal in dev server's optimized-deps `.map` handling | `<= 6.4.1` | 6.4.3 |
| [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) | `server.fs.deny` bypass on Windows alternate paths | `<= 6.4.2` | 6.4.3 |
| [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) | `launch-editor` NTLMv2 hash disclosure via UNC path (Windows) | `<= 6.4.2` | 6.4.3 |

There is **no patched Vite 5.x** — the current `5.4.21` is the newest 5.x and is
still flagged. The fix line starts at **Vite 6.4.3**.

## Why deferred / why it's low risk here

- **Dev-server only, zero production exposure.** "Literally" ships as static
  precached files (`vite build` → service worker); there is no server at runtime
  (ADR-001, network-never). Production users have no exposure. Two of the three
  advisories are additionally **Windows-only** (the team develops on macOS).
- **The fix is a Vite-major bump, not an override.** Reaching Vite ≥ 6.4.3 means
  Vite 5 → 6 (a breaking major: Node-version floor, default changes), and it
  cascades: `vite-plugin-pwa@0.20.5` peer-supports only `vite ^3 || ^4 || ^5`
  (needs ≥ 0.21 for Vite 6/7), and `vitest@2` expects Vite 5 (needs `vitest@3`
  for Vite 6+). Forcing Vite 6 via `overrides` under the current plugin/test
  toolchain is the same risky migration deliberately declined for the esbuild
  fix — it is not a drop-in. This is the toolchain migration DEBT-003 always
  pointed at; resolving the esbuild half via override simply made the remaining
  half visible on its own.

## Suggested resolution

Revisit on the **PRD-011 / CI-hardening** track as a coordinated Vite-major
upgrade: bump `vite` → 6/7, `vite-plugin-pwa` → a release that supports it, and
`vitest`/`@vitest/coverage-v8` → 3.x together; then re-run `npm audit`, the full
unit + e2e suites, and the PWA service-worker / offline-install checks
(`_docs/09` §6). Until then, develop on a trusted network and a non-Windows host.
No production action required.
