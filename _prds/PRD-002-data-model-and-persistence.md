# PRD-002 — Data Model & Persistence

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [03 (all)](../_docs/03-data-model-and-state.md), [02 §4](../_docs/02-architecture.md) |
| **Roadmap** | Phase 1 |
| **Depends on** | PRD-001 (project scaffold) |
| **Owns FR** | FR-10, FR-15 · supports FR-8, FR-17, FR-20 |

---

## 1. Objective

Define the offline data schema (`GameSession` and friends) and the **Zustand
store** that is the single source of truth: it holds the navigation FSM, the
in-progress draft, and the list of finalized sessions, and **persists** durable
data across reloads/offline. After this PRD a session created in devtools
survives a reload.

## 2. Background & context

The store is where navigation, lifecycle, and persistence converge. Screens are
thin: they read state and dispatch actions. Drawing data flows store → canvas and
back. See [02 §4](../_docs/02-architecture.md) and [03](../_docs/03-data-model-and-state.md).
Persistence decision is **ADR-002**: Zustand `persist` over localStorage by
default, with a one-line `storage:` seam to swap to IndexedDB if payloads grow.

## 3. Goals / Non-goals

**Goals:** types, store with actions, `persist` + `partialize` + `migrate`,
selectors, id/time libs, quota & corruption safety, the privacy wipe.

**Non-goals:** the screens that call these actions (PRD-004+), the canvas that
produces `DrawingData` (PRD-003), the export image lib (PRD-008).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R02-1 | `types/session.ts`: `Point`, `FreehandStroke`, `FreehandDrawing`, `GridNode`, `GridSegment`, `GridDrawing`, `DrawingData` union, `StressLevel`, `ConfidenceLevel`, `TaskId`, `GameSession`. | P0 | Types compile under strict TS; `DrawingData` discriminates on `kind`. |
| R02-2 | `GameSession` has all spec fields + `schemaVersion`, `started_at`, `task_id`, `mode_*_confidence_level`. | P0 (FR-8, FR-20) | A finalized session matches the example blob in [03 §7](../_docs/03-data-model-and-state.md). |
| R02-3 | `gameStore.ts` Zustand store: `screen` (FSM), `draft`, `sessions[]`, `reducedIntensity` + actions `go`, `startNewSession`, `saveMode1Drawing`, `saveMode2Drawing`, `setStress`, `setConfidence`, `finalizeSession`, `deleteSession`, `clearAllData`, `setReducedIntensity`. | P0 (FR-10) | Each action mutates state per [03 §3](../_docs/03-data-model-and-state.md); lifecycle test passes. |
| R02-4 | `startNewSession` picks a random `task_id` from the task pool; **both modes share it**. | P0 (FR-20) | New draft has a `task_id` ∈ pool; it is never reassigned mid-session. |
| R02-5 | Stress **and** confidence clamp to integers 1–10. | P0 (FR-8) | `setStress(0)`→1, `setStress(99)`→10, `setStress(7.4)`→7; same for confidence. |
| R02-6 | `finalizeSession` stamps `completed_at`, moves draft→`sessions[0]` (newest first), sets `screen:'reflection'`, clears draft. | P0 (FR-10) | After finalize, `sessions[0]` is the just-played session; `draft` is null. |
| R02-7 | `persist`: key `literally:game`, `version: SCHEMA_VERSION`, `createJSONStorage(()=>localStorage)`. | P0 (FR-10, NFR-2) | Reload restores `sessions` + `reducedIntensity`. |
| R02-8 | `partialize` persists **only** `sessions` + `reducedIntensity` (not `screen`/`draft`). | P0 | After reload mid-session, app lands on **Welcome**, not mid-mode (OQ-7). |
| R02-9 | `migrations.ts`: `SCHEMA_VERSION` + `migrate(persisted, from)`; corrupt/unknown blob → fall back to empty state, **never throw**. | P0 (NFR-7) | Feeding a corrupt blob boots the app to empty state, no crash. |
| R02-10 | Selectors: `useScreen`, `useDraft`, `useLatestSession`, `useSessions`, `useReducedIntensity` — each subscribes to the narrowest slice. | P0 | Components using a selector don't re-render on unrelated state changes. |
| R02-11 | `lib/id.ts` (`crypto.randomUUID` + fallback) and `lib/time.ts` (`now()`). | P0 | `uuid()` returns unique ids; works where `crypto.randomUUID` is missing. |
| R02-12 | Freehand drawings are **simplified (RDP) + quantized** before save (done at capture in PRD-003; store accepts the reduced payload). | P0 (NFR-3, NFR-7) | A saved freehand payload is materially smaller than raw points; shape preserved within epsilon. |
| R02-13 | Quota guard: a `QuotaExceededError` on write surfaces a friendly "storage full — clear old sessions?" path, not a silent failure. | P1 (NFR-7) | Simulated quota error shows the recovery message; app stays usable. |
| R02-14 | `clearAllData()` wipes sessions + draft, returns to Welcome — powers the visible "Delete all my data" control. | P0 (FR-15) | After clear, `sessions` empty, persisted blob reset, screen `welcome`. |
| R02-15 | IndexedDB escape hatch documented: swapping `storage:` to an `idb-keyval` `StateStorage` adapter is a one-line change; trigger if a session exceeds ~150KB. | P1 (ADR-002) | Code comment + adapter seam present; no behavior change until needed. |

## 5. Technical approach

Lift the reference implementations from [03](../_docs/03-data-model-and-state.md):
types (§2), store (§3), selectors (§4), migrations (§5). `Math.random()` for task
pick and `crypto.randomUUID()` are fine at app runtime. Keep the `storage:` line
isolated so the IndexedDB swap is trivial. Confidence reuses the same 1–10 clamp
as stress.

**Why grid stores nodes not pixels:** `(col,row)` segments are tiny, lossless, and
resolution-independent → perfect re-render at any size. Freehand must store pixels
+ capture canvas size to reproduce faithfully (and is therefore simplified +
quantized to control size).

## 6. Non-functional requirements

- **NFR-4 Privacy:** no PII; no demographic or "prior ASD knowledge" field is ever
  stored (the reveal stays unmeasured in production). `clearAllData` is the wipe.
- **NFR-7 Resilience:** versioned + migratable + quota-guarded + corruption-safe.
- **NFR-2:** persistence is the only durability mechanism; no network.

## 7. Dependencies & interfaces

- **Provides:** `useGameStore`, selectors, `GameSession`/`DrawingData` types,
  `uuid()`, `now()`.
- **Consumes:** scaffold from PRD-001. **Consumed by:** every screen (PRD-004+),
  the canvas `onChange` → `saveMode*Drawing` (PRD-003), feedback checks (PRD-007),
  reflection/history (PRD-008).

## 8. Test plan (unit — Vitest, target ≥90% on `store/`)

- Lifecycle: `start → saveMode1 → setStress(1) → setConfidence(1) → saveMode2 →
  setStress(2) → setConfidence(2) → finalize` yields a complete `GameSession` in
  `sessions[0]`.
- Stress **and** confidence clamp to 1–10.
- `task_id` is set and shared by both modes.
- `partialize` excludes `screen`/`draft`; reload lands on Welcome.
- `deleteSession` / `clearAllData` behave; persisted blob resets.
- `migrate` on unknown/corrupt blob → empty state, never throws.
- A fake session created in devtools survives a reload (manual/E2E).

## 9. Definition of Done

- A fake session created in devtools **survives a reload**.
- Stress/confidence clamp (1–10); `task_id` set + shared; `finalize` moves
  draft→sessions; `clearAllData` works; `partialize` excludes `screen`/`draft`.
- Migration fallback verified; quota guard path verified.
- Unit coverage on `store/` ≥ 90%.

## 10. Open questions & risks

- **OQ-2** localStorage vs IndexedDB — start localStorage, measure on device,
  swap if any session > ~150KB.
- **OQ-7** resume in-progress draft — **No** in v1 (land on Welcome). Schema
  already supports adding `draft` to `partialize` later.
- **OQ-12** confidence scale granularity — stored as 1–10 regardless of UI face
  count (UI decision in PRD-007).
- **Risk:** large freehand payloads → mitigated by R02-12 + R02-15.

## 11. Traceability

FR-10, FR-15 (owned); FR-8, FR-17, FR-20 (data support). NFR-2, NFR-4, NFR-7.
ADR-001, ADR-002, ADR-012 (confidence field). SC-5 (survives reload). Roadmap
Phase 1 DoD.
