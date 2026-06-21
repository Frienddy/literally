# DEBT-003 — `esbuild`/`vite` dev-server advisory (dev-only)

**Status:** Open (deferred) · **Severity:** Low (development-only) · **Surfaced by:** PRD-001

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
