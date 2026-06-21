# DEBT-003 — `esbuild`/`vite` dev-server advisory (dev-only)

**Status:** ✅ Resolved (2026-06-21) · **Severity:** Low (development-only) · **Surfaced by:** PRD-001

## Resolution

The documented root cause — **GHSA-67mh-4wv8-2f99** in `esbuild <= 0.24.2` — is
resolved **without** the breaking Vite 8 migration, by pinning the patched esbuild
via an npm `overrides` block in `package.json`:

```json
"overrides": { "esbuild": "^0.25.0" }
```

This forces every transitive consumer (`vite@5`, `vitest`, `vite-node`,
`vite-plugin-pwa`) onto `esbuild@0.25.12`, which carries the fix, while keeping
Vite pinned at `5.4.21` and `vite-plugin-pwa` at `0.20.5` (no toolchain
migration). `npm audit` dropped from 7 advisories to 6, and the esbuild advisory
is gone. Verified end-to-end on the override: `npm run build` (incl. PWA
service-worker generation), 167 unit tests, ESLint, the bundle-size gate, and all
40 Playwright e2e flows (Mobile Safari + Chrome, which exercise the Vite
dev/preview server where esbuild actually runs) — all green. So Vite 5.4 runs
correctly against esbuild 0.25 despite its declared `^0.21.3` range.

> **Residual, now tracked separately:** clearing the esbuild advisory uncovered
> three *independent* Vite dev-server advisories (path traversal in optimized-deps
> `.map` handling; two Windows-only) that did **not** exist when this note was
> written and are first patched only in **Vite ≥ 6.4.3** (no patched Vite 5.x).
> Those still require the deferred Vite-major bump and are logged as
> **[DEBT-007](../007-vite-dev-server-advisories.md)**. Same risk profile: dev-only,
> zero production exposure (ADR-001 ships static precached files, no runtime server).

The original note follows for history.

---

> **Reviewed 2026-06-21 (tech-debt pass): still deferred.** `npm audit` still traces
> every advisory to esbuild `<= 0.24.2` via `vite@5`/`vitest`/`vite-plugin-pwa`. The
> only fix remains `npm audit fix --force` → **Vite 8** (a breaking major) plus a
> `vite-plugin-pwa` release that supports it — a toolchain migration, not a debt-pass
> change. Dev-only, zero production exposure (ADR-001 ships static precached files,
> no runtime server). Belongs to the PRD-011 / CI-hardening track.

## What

`npm audit` reports vulnerabilities that all trace to a single advisory:
**GHSA-67mh-4wv8-2f99** in `esbuild <= 0.24.2` — "esbuild enables any website to
send any requests to the development server and read the response."

It reaches the tree transitively through `vite`, and from there `vitest`,
`@vitest/coverage-v8`, `vite-node`, and `vite-plugin-pwa`. npm's headline counts
(moderate/high/critical) are all instances of this same root cause.

## Why deferred / why it's low risk here

- It affects the **dev server only**. "Literally" ships as static precached files
  (`vite build` → service worker); there is no server at runtime (ADR-001,
  network-never). Production users have zero exposure.
- The only exposure is a developer running `npm run dev` on an untrusted network
  while visiting a malicious page. Mitigate by developing on a trusted network.
- The offered fix is `npm audit fix --force`, which installs **`vite@8` (a major,
  breaking change)** and would also need a `vite-plugin-pwa` version that supports
  Vite 8. That's a toolchain migration, out of scope for Phase 0.

## Suggested resolution

Revisit during PRD-011 (Testing, QA & Launch) / CI hardening: bump to a Vite
major whose `esbuild` is `> 0.24.2` **once `vite-plugin-pwa` officially supports
it**, then re-run `npm audit`. Until then, document "develop on a trusted
network" and keep the dev-only scope in mind. No production action required.
