# "Literally" — Documentation Index

> A mobile-first, offline PWA serious game for people who may know nothing about
> autism. It builds empathy **not by explaining ASD, but by letting players
> *feel* it** — no lecture, no jargon — through the difference between following
> vague, sensory-overloaded instructions (you're never quite told what to do) and
> clear, literal, step-by-step ones. **Show, don't tell.**

This `_docs/` folder is the complete build blueprint. Everything needed to
implement the app — product intent, game design, architecture, data model,
reference code, UI specs, ethics, and a phased roadmap — lives here. The
documents are numbered in the recommended reading order.

---

## How to read these docs

| # | Document | What it answers | Primary audience |
|---|----------|-----------------|------------------|
| 00 | [Product Requirements](./00-product-requirements.md) | *Why* are we building this? Who is it for? What is success? | Everyone — read first |
| 01 | [Game Design Document](./01-game-design.md) | *What* exactly happens in each mode, second by second? | Devs, designers |
| 02 | [Technical Architecture](./02-architecture.md) | *How* is the code organized? Tech stack & folder structure. | Devs |
| 03 | [Data Model & State](./03-data-model-and-state.md) | How is a `GameSession` stored offline? Zustand store reference. | Devs |
| 04 | [Canvas Engine](./04-canvas-engine.md) | The `useCanvas` hook: freehand + snap-to-grid reference code. | Devs |
| 05 | [PWA & Mobile Shell](./05-pwa-and-mobile-shell.md) | Manifest, service worker, gesture blocking, layout component. | Devs |
| 06 | [UI / UX Specification](./06-ui-ux-spec.md) | Screen-by-screen flows, wireframes, design tokens. | Devs, designers |
| 07 | [Accessibility & Ethics](./07-accessibility-and-ethics.md) | How to represent ASD responsibly; a11y guardrails. | Everyone |
| 08 | [Implementation Roadmap](./08-implementation-roadmap.md) | Phased task breakdown, milestones, definition of done. | Devs, PM |
| 09 | [Testing & QA](./09-testing-and-qa.md) | What we test, on what devices, and how. | Devs, QA |
| 10 | [Glossary & Decisions](./10-glossary-and-decisions.md) | Shared vocabulary + an Architecture Decision log. | Everyone |

---

## The one-paragraph pitch

A player completes the **same drawing task twice**. First in **"Sensory Storm"** —
a blank canvas, a single wall of vague text that fades from memory, wobbly
unpredictable strokes, erratic haptics, and fake notifications stealing focus.
Then in **"Anchor Point"** — a crisp high-contrast grid, one clear step-by-step
instruction at a time, lines that snap satisfyingly to nodes, an Undo button,
and zero time pressure. Afterward they rate their stress for each and see both
drawings side by side. The contrast *is* the lesson. A warm grown-up sets the
*same* simple task both times — vaguely first, clearly second — and the final
screen reveals what was actually being asked, so the player sees how a simple task
becomes hard for an autistic kid when the instructions aren't direct. The player
walks in knowing nothing about autism; only at that final screen — **the reveal** —
do we name what they just felt. Nobody is *told* the lesson. They *live* it, then
recognize it.

## Core constraints (the non-negotiables)

- **Frontend only.** No backend, no network calls at runtime. Everything runs
  and persists on-device.
- **Offline-first PWA.** Installable, works in airplane mode after first load.
- **Mobile-first, portrait-locked.** Designed for a phone held in one hand.
- **Zero-latency touch.** Drawing must feel immediate; no input lag.
- **Show, don't tell (for an audience that starts from zero).** The primary
  player may have never thought about autism. We never explain it up front — they
  learn by *feeling* the difference, and the connection to ASD is revealed only
  *after* the experience. See [01](./01-game-design.md) §1.1.
- **Respectful by design.** This simulates *one slice* of ASD experience to build
  empathy — it is not a diagnosis, a test, or a claim that all autistic people
  experience the world identically. See [07](./07-accessibility-and-ethics.md).

## Tech stack at a glance

React 18 · TypeScript · Vite · Tailwind CSS · Zustand (+ `persist`) ·
HTML5 Canvas · `navigator.vibrate()` · `vite-plugin-pwa` (Workbox).

See [02-architecture.md](./02-architecture.md) for the rationale behind each choice.

## Status

These are planning/blueprint documents. No application code has been scaffolded
yet. The reference implementations inside docs 03–05 are production-intent and
ready to be lifted into `src/` when implementation begins (see the roadmap).
