# `_debt/` — tracked technical debt

Out-of-scope issues discovered while implementing a PRD are logged here (one file
per item) rather than silently absorbed or fixed mid-scope. Each note states what
the debt is, why it was deferred, the risk, and a suggested resolution + owning
PRD/phase.

| # | Item | Severity | Surfaced by |
|---|------|----------|-------------|
| [001](./001-placeholder-pwa-icons.md) | Placeholder PWA icons (blue dot) | Low | PRD-001 |
| [002](./002-quota-recovery-ui.md) | Quota-exceeded recovery UI not wired | Low | PRD-002 |
| [003](./003-dev-dependency-audit-esbuild-vite.md) | `esbuild`/`vite` dev-server advisory | Low (dev-only) | PRD-001 |
| [004](./004-engine-palette-vs-tokens.md) | Engine palette duplicates/diverges from design tokens | Low | PRD-004 |
| ~~[005](./005-unauthored-task-subjects.md)~~ | ~~`cat`/`flower` subjects unauthored~~ — ✅ resolved in PRD-009 | Low | PRD-006 |
| [006](./006-mode1-ink-contrast.md) | Mode 1 freehand ink near-invisible on the storm canvas | Medium | PRD-008 |
