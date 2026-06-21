# `_prds/` — Product Requirement Documents for "Literally"

This folder turns the **blueprint** in [`../_docs/`](../_docs/) into a set of
**implementation-ready PRDs**. Where `_docs/` answers *why* and *what* at a vision
level (and holds the production-intent reference code), each PRD here is a
**buildable unit of work**: scoped goals, numbered functional requirements with
explicit acceptance criteria, dependencies, a test plan, and a Definition of Done.

> **Relationship to `_docs/`:** `_docs/` remains the **source of truth** for design
> rationale and reference code. PRDs **reference** the docs (by file + section)
> rather than duplicating large code blocks. When a PRD and a doc disagree,
> reconcile deliberately and update both (and the ADR/change log in
> [`../_docs/10-glossary-and-decisions.md`](../_docs/10-glossary-and-decisions.md)).

---

## The PRD set

| # | PRD | Scope | Roadmap phase | Primary source docs |
|---|-----|-------|---------------|---------------------|
| 000 | [Product Overview & Scope](./PRD-000-product-overview.md) | Vision, personas, success criteria, release scope, milestones, risks | — | 00, 01, 10 |
| 001 | [Platform Shell & PWA](./PRD-001-platform-shell-and-pwa.md) | Scaffold, offline PWA, gesture blocking, portrait lock, install | Phase 0 | 02, 05 |
| 002 | [Data Model & Persistence](./PRD-002-data-model-and-persistence.md) | Types, Zustand store, persist, migrations, quota safety | Phase 1 | 03 |
| 003 | [Canvas Engine & Haptics](./PRD-003-canvas-engine-and-haptics.md) | Pure engine, `useCanvas`, freehand/grid, `useHaptics` | Phase 2 | 04, 05 |
| 004 | [Design System & Navigation](./PRD-004-design-system-and-navigation.md) | Design tokens, FSM router, screen shells, shared components | Phase 3 | 02, 06 |
| 005 | [Mode 1 — Sensory Storm](./PRD-005-mode1-sensory-storm.md) | Freehand+wobble, fading text, fake notifications, erratic haptics, beat | Phase 4 | 01, 06 |
| 006 | [Mode 2 — Anchor Point](./PRD-006-mode2-anchor-point.md) | Snap-to-grid, step pagination, guidance, crisp haptics, completion | Phase 5 | 01, 06 |
| 007 | [Feedback Checks (Stress + Confidence)](./PRD-007-feedback-checks.md) | Emoji-face rating scale, two-question checks, confidence gap | Phases 3–5 | 01, 03 |
| 008 | [Reflection & History](./PRD-008-reflection-and-history.md) | Side-by-side compare, target reveal, the reveal, history, delete-all | Phase 6 | 01, 06 |
| 009 | [Content, Copy & Ethics Gate](./PRD-009-content-copy-and-ethics.md) | Content architecture, copy decks, show-don't-tell boundary, sensitivity review | Phase 7 | 01, 02, 07 |
| 010 | [Accessibility & Sensory Safety](./PRD-010-accessibility-and-sensory-safety.md) | WCAG-minded a11y, reduced-intensity, reduced-motion, calm exit | Cross-cutting | 07 |
| 011 | [Testing, QA & Launch](./PRD-011-testing-qa-and-launch.md) | Test pyramid, device matrix, perf budgets, CI, polish, launch gates | Phase 8 | 08, 09 |

**Build order** (from [`../_docs/08`](../_docs/08-implementation-roadmap.md)):
001 → 002 → 003 → 004 → (005 ‖ 006) → 007 → 008 → 009 → 011. PRD-010 is
cross-cutting and is satisfied incrementally inside the others (its checklist is
the release gate). PRD-007 is built alongside the navigation skeleton (004) and
completed when both modes feed it (005/006).

---

## PRD conventions

**Document template.** Every PRD follows the same structure:

1. **Metadata** — status, source docs, roadmap phase, dependencies.
2. **Objective** — one paragraph: what this unit delivers and why it matters.
3. **Background & context** — the design intent this implements.
4. **Goals / Non-goals** — scoped to this feature.
5. **Functional requirements** — table of `REQ` rows, each with an acceptance
   criterion. Verifiable, not aspirational.
6. **Technical approach** — how to build it; points at the reference code in
   `_docs/`. PRDs don't re-paste code that already lives in a doc.
7. **Non-functional requirements** — perf, a11y, privacy, resilience as relevant.
8. **Dependencies & interfaces** — what must exist first; what this exposes.
9. **Test plan** — unit / component / E2E / manual, tied to
   [`../_docs/09`](../_docs/09-testing-and-qa.md).
10. **Definition of Done** — the checklist that closes the PRD.
11. **Traceability** — maps every requirement back to FR-/NFR-/SC-/ADR-/FR IDs in
    `_docs/` so nothing is dropped.
12. **Open questions & risks** — live `OQ-*` items and mitigations.

**Requirement IDs.** Each PRD numbers its requirements `R<nn>-<seq>` where `<nn>`
is the PRD number — e.g. `R05-3` is the third requirement in PRD-005. Each row
also lists the **upstream** ID(s) it satisfies (e.g. `FR-2`, `NFR-1`, `ADR-006`,
`SC-3`) from the docs, so traceability is bidirectional.

**Priorities.** `P0` = required for v1 (blocks release). `P1` = important, ship if
possible in v1. `P2` = nice-to-have / v1.1 candidate. Mirrors PRD-000 §6.

**Status values.** `Draft` · `Ready` (reviewed, buildable) · `In progress` ·
`Done` · `Blocked`. Update the metadata block as work proceeds.

---

## Master traceability summary

Every functional requirement from [`../_docs/00`](../_docs/00-product-requirements.md)
§5 is owned by exactly one PRD (acceptance lives there):

| FR | Requirement | Owning PRD |
|----|-------------|-----------|
| FR-1 | Two playable modes | 005, 006 |
| FR-2 | Freehand + wobble (M1) | 003, 005 |
| FR-3 | Snap-to-grid (M2) | 003, 006 |
| FR-4 | Step pagination Next/Undo (M2) | 006 |
| FR-5 | Vague fading instruction (M1) | 005 |
| FR-6 | Haptics erratic (M1) / crisp (M2) | 003, 005, 006 |
| FR-7 | Fake notifications (M1) | 005 |
| FR-8 | Stress + confidence rating | 007 |
| FR-9 | Reflection compare + reveal + deltas | 008 |
| FR-10 | Persist `GameSession` offline | 002 |
| FR-11 | History list + view | 008 |
| FR-12 | Installable offline PWA | 001 |
| FR-13 | Portrait lock + gesture block | 001 |
| FR-14 | Export comparison image | 008 (P2) |
| FR-15 | Clear all local data | 002, 008 |
| FR-16 | Instruction-giver framing | 005, 006, 009 |
| FR-17 | Hidden target, revealed at Reflection | 006, 008 |
| FR-18 | Mode 2 on-grid guidance | 003, 006 |
| FR-19 | M2 completion + M1 "not quite right" beat | 005, 006 |
| FR-20 | Task-variety pool | 002, 009 |
| FR-21 | Top-level progress indicator | 004 |
| FR-22 | Persistent Exit / reduce-intensity (M1) | 005, 010 |
| FR-23 | Two visual themes + transition | 004, 005, 006 |

Non-functional requirements (NFR-1…7), success criteria (SC-1…6), and ADRs
(001–013) are traced inside each PRD's §11.
