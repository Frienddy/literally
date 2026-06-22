# `_debt/` — tracked technical debt

Out-of-scope issues discovered while implementing a PRD are logged here (one file
per item) rather than silently absorbed or fixed mid-scope. Each note states what
the debt is, why it was deferred, the risk, and a suggested resolution + owning
PRD/phase. Resolved notes move to [`archive/`](./archive/) (kept for history).

## Open

| # | Item | Severity | Surfaced by |
|---|------|----------|-------------|
| [001](./001-placeholder-pwa-icons.md) | Placeholder PWA icons (blue dot) | Low | PRD-001 |

## Archived (resolved)

| # | Item | Severity | Surfaced by | Resolved by |
|---|------|----------|-------------|-------------|
| [002](./archive/002-quota-recovery-ui.md) | Quota-exceeded recovery UI not wired | Low | PRD-002 | debt pass |
| [003](./archive/003-dev-dependency-audit-esbuild-vite.md) | `esbuild` dev-server advisory | Low (dev-only) | PRD-001 | esbuild `^0.25` override |
| [004](./archive/004-engine-palette-vs-tokens.md) | Engine palette duplicates/diverges from design tokens | Low | PRD-004 | debt pass |
| [005](./archive/005-unauthored-task-subjects.md) | `cat`/`flower` subjects unauthored | Low | PRD-006 | PRD-009 |
| [006](./archive/006-mode1-ink-contrast.md) | Mode 1 freehand ink near-invisible on the storm canvas | Medium | PRD-008 | debt pass |
| [007](./archive/007-vite-dev-server-advisories.md) | Vite dev-server advisories (need Vite-major bump) | Low (dev-only) | DEBT-003 | Vite-8 toolchain upgrade |
