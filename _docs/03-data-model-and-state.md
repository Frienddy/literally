# 03 — Data Model & Local State

Defines the offline data schema (`GameSession` and friends) and the Zustand store
that saves/retrieves it across reloads. This is one of the explicit deliverables
in the spec's Output Request.

---

## 1. Storage decision

The spec mentions "Zustand (with persist) **or** localStorage/IndexedDB."

**Decision (ADR-002, see [10](./10-glossary-and-decisions.md)):** Use **Zustand
`persist`** as the primary mechanism.

- **localStorage** backend by default — simplest, synchronous, perfect for the
  small metadata (screen, stress levels, session list).
- **Drawing payloads can get large** (hundreds of points). To stay under the
  ~5MB localStorage budget, we (a) **downsample/compress** path points before
  saving (store integers, drop sub-pixel precision, optional RDP simplification),
  and (b) keep a clean seam so we can swap the persist backend to **IndexedDB**
  (via a tiny `idb-keyval` storage adapter implementing Zustand's `StateStorage`)
  if real-device payloads exceed budget. The store code below is written so this
  swap is a one-line `storage:` change.

> Rule of thumb: if a single session's serialized drawing data exceeds ~150KB
> after simplification, move the persist backend to IndexedDB. Until then,
> localStorage keeps things synchronous and dead-simple.

> **On the "zero-knowledge audience" reframing:** it does *not* change this schema.
> We deliberately store **no** demographic or "prior ASD knowledge" field — the
> experiential reveal stays on-device and unmeasured in production (privacy, see
> [07](./07-accessibility-and-ethics.md) §5). Newcomer comprehension (SC-2b) is
> validated in *playtest* ([09](./09-testing-and-qa.md) §5), never by instrumenting users.

## 2. Type definitions

`src/types/session.ts`

```ts
/** A raw 2D point in CSS pixels (relative to the canvas top-left). */
export interface Point {
  x: number;
  y: number;
  /** ms offset from stroke start — optional, used for replay/feel analysis. */
  t?: number;
}

/** Mode 1: freehand. A drawing is a list of strokes; each stroke is a polyline.
 *  Points here are the *rendered* (wobbled) points so the saved drawing recreates
 *  exactly what the player saw. */
export interface FreehandStroke {
  points: Point[];
  /** stroke width in px at capture time (for faithful re-render). */
  width: number;
}

export interface FreehandDrawing {
  kind: 'freehand';
  strokes: FreehandStroke[];
  /** CSS size of the canvas at capture, for correct scaling on replay. */
  canvas: { width: number; height: number };
}

/** Mode 2: snap-to-grid. A drawing is a list of segments between integer grid
 *  nodes (col,row), independent of pixel size so it scales to any screen. */
export interface GridNode {
  col: number;
  row: number;
}

export interface GridSegment {
  from: GridNode;
  to: GridNode;
}

export interface GridDrawing {
  kind: 'grid';
  segments: GridSegment[];
  grid: { cols: number; rows: number };
}

/** Discriminated union — `kind` tells the renderer which path to take. */
export type DrawingData = FreehandDrawing | GridDrawing;

/** Stress is an integer 1–10 (validated on input). */
export type StressLevel = number; // 1..10

/** Confidence ("how sure you did it right") — same shape as stress. The Mode-1 vs
 *  Mode-2 confidence gap is the key measure of the product goal. */
export type ConfidenceLevel = number; // 1..10

/** Which simple task subject the session used; both modes share one. */
export type TaskId = 'house' | 'cat' | 'flower';

/** The persisted record. Matches the spec's GameSession, expanded for safety. */
export interface GameSession {
  /** UUID generated locally (crypto.randomUUID). */
  id: string;
  /** Schema version for migrations. */
  schemaVersion: number;
  /** Which task subject this session used (e.g. 'house'); shared by both modes. */
  task_id: TaskId;
  mode_1_drawing_data: FreehandDrawing | null;
  mode_2_drawing_data: GridDrawing | null;
  mode_1_stress_level: StressLevel | null;
  mode_2_stress_level: StressLevel | null;
  /** "How sure were you that you did it right?" — the goal's key signal. */
  mode_1_confidence_level: ConfidenceLevel | null;
  mode_2_confidence_level: ConfidenceLevel | null;
  /** epoch ms when the session was started. */
  started_at: number;
  /** epoch ms when the reflection was reached / session finalized. */
  completed_at: number | null;
}
```

> **Spec mapping:** the required fields (`mode_1_drawing_data`,
> `mode_2_drawing_data`, `mode_1_stress_level`, `mode_2_stress_level`,
> `completed_at`, `id`) are all present. We add `schemaVersion`, `started_at`,
> `task_id`, and the two `*_confidence_level` fields for robustness and to measure
> the goal (the confidence gap) — all additive, non-breaking.

### Why grid drawings store nodes, not pixels
Mode 2 output is described as "grid nodes connected" in the spec. Storing
`(col,row)` integer segments (not pixels) makes the data tiny, lossless, and
**resolution-independent** — it re-renders perfectly on any screen size. Mode 1,
being freehand, must store pixels + the capture canvas size to reproduce faithfully.

## 3. The Zustand store (reference implementation)

`src/store/gameStore.ts`

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GameSession,
  FreehandDrawing,
  GridDrawing,
  StressLevel,
  ConfidenceLevel,
  TaskId,
} from '../types/session';
import { uuid } from '../lib/id';
import { now } from '../lib/time';
import { migrate, SCHEMA_VERSION } from './migrations';

export type Screen =
  | 'welcome'
  | 'mode1'
  | 'stress1'
  | 'mode2'
  | 'stress2'
  | 'reflection'
  | 'history';

interface GameState {
  /** Finite-state-machine: which screen is active. */
  screen: Screen;
  /** The session currently being played (not yet in `sessions` until complete). */
  draft: GameSession | null;
  /** All finalized sessions, newest first. */
  sessions: GameSession[];
  /** Sensory-safety: user can dial down Mode 1 intensity (see doc 07). */
  reducedIntensity: boolean;

  // --- navigation ---
  go: (screen: Screen) => void;

  // --- lifecycle ---
  startNewSession: () => void;
  saveMode1Drawing: (d: FreehandDrawing) => void;
  saveMode2Drawing: (d: GridDrawing) => void;
  setStress: (mode: 1 | 2, level: StressLevel) => void;
  setConfidence: (mode: 1 | 2, level: ConfidenceLevel) => void;
  finalizeSession: () => void;

  // --- history / privacy ---
  deleteSession: (id: string) => void;
  clearAllData: () => void;
  setReducedIntensity: (v: boolean) => void;
}

const clampStress = (n: number): StressLevel =>
  Math.max(1, Math.min(10, Math.round(n)));

const TASKS: TaskId[] = ['house', 'cat', 'flower'];
// Math.random is fine at app runtime (only disallowed inside Workflow scripts).
const pickTask = (): TaskId => TASKS[Math.floor(Math.random() * TASKS.length)];

function newSession(): GameSession {
  return {
    id: uuid(),
    schemaVersion: SCHEMA_VERSION,
    task_id: pickTask(),            // same subject used by both modes this session
    mode_1_drawing_data: null,
    mode_2_drawing_data: null,
    mode_1_stress_level: null,
    mode_2_stress_level: null,
    mode_1_confidence_level: null,
    mode_2_confidence_level: null,
    started_at: now(),
    completed_at: null,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'welcome',
      draft: null,
      sessions: [],
      reducedIntensity: false,

      go: (screen) => set({ screen }),

      startNewSession: () => set({ draft: newSession(), screen: 'mode1' }),

      saveMode1Drawing: (d) =>
        set((s) =>
          s.draft ? { draft: { ...s.draft, mode_1_drawing_data: d } } : s,
        ),

      saveMode2Drawing: (d) =>
        set((s) =>
          s.draft ? { draft: { ...s.draft, mode_2_drawing_data: d } } : s,
        ),

      setStress: (mode, level) =>
        set((s) => {
          if (!s.draft) return s;
          const v = clampStress(level);
          return {
            draft:
              mode === 1
                ? { ...s.draft, mode_1_stress_level: v }
                : { ...s.draft, mode_2_stress_level: v },
          };
        }),

      setConfidence: (mode, level) =>
        set((s) => {
          if (!s.draft) return s;
          const v = clampStress(level); // same 1–10 clamp
          return {
            draft:
              mode === 1
                ? { ...s.draft, mode_1_confidence_level: v }
                : { ...s.draft, mode_2_confidence_level: v },
          };
        }),

      finalizeSession: () =>
        set((s) => {
          if (!s.draft) return s;
          const finalized: GameSession = { ...s.draft, completed_at: now() };
          return {
            draft: null,
            sessions: [finalized, ...s.sessions],
            screen: 'reflection',
          };
        }),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      clearAllData: () =>
        set({ sessions: [], draft: null, screen: 'welcome' }),

      setReducedIntensity: (v) => set({ reducedIntensity: v }),
    }),
    {
      name: 'literally:game',                  // storage key
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage), // swap → IndexedDB adapter if needed
      // Only persist durable data; `screen`/`draft` are session-runtime UI state.
      partialize: (s) => ({
        sessions: s.sessions,
        reducedIntensity: s.reducedIntensity,
      }),
      migrate: (persisted, fromVersion) => migrate(persisted, fromVersion),
    },
  ),
);
```

### Notes on the store design
- **FSM lives in the store** (`screen` + `go`), so navigation is testable and the
  back/forward flow can't get into impossible states. `App.tsx`/`ScreenRouter`
  just renders `screen`.
- **`partialize`** persists only `sessions` + `reducedIntensity`. We deliberately
  **do not** persist `screen`/`draft`: reopening the app should land on Welcome,
  not mid-Sensory-Storm. (If "resume in-progress session" is desired later, add
  `draft` to `partialize` — the schema already supports a partial draft.)
- **Reflection reads `sessions[0]`** (the just-finalized session) via a selector.
- **`reducedIntensity`** is wired here so the sensory-safety toggle survives
  reloads — see [07](./07-accessibility-and-ethics.md).

## 4. Selectors

`src/store/selectors.ts`

```ts
import { useGameStore } from './gameStore';

export const useScreen = () => useGameStore((s) => s.screen);
export const useDraft = () => useGameStore((s) => s.draft);
export const useLatestSession = () => useGameStore((s) => s.sessions[0] ?? null);
export const useSessions = () => useGameStore((s) => s.sessions);
export const useReducedIntensity = () => useGameStore((s) => s.reducedIntensity);
```

Subscribe to the **narrowest** slice in each component to avoid needless re-renders
(important while the canvas is active).

## 5. Migrations

`src/store/migrations.ts`

```ts
export const SCHEMA_VERSION = 1;

/** Transform older persisted blobs into the current shape.
 *  Add a case per version bump; never throw on unknown — fail safe to empty. */
export function migrate(persisted: unknown, from: number): unknown {
  try {
    let state = persisted as any;
    // Example for a future bump:
    // if (from < 2) { state = { ...state, sessions: state.sessions.map(upgradeV1toV2) }; }
    return state;
  } catch {
    // Corrupt data → start clean rather than crash the app.
    return { sessions: [], reducedIntensity: false };
  }
}
```

## 6. Quota & corruption safety

- **Simplify before save:** run freehand strokes through Ramer–Douglas–Peucker
  (`engine/geometry.ts`) and round coordinates to integers in `saveMode1Drawing`'s
  upstream capture, cutting payload size ~50–80% with no visible quality loss.
- **Quota guard:** wrap persistence writes so a `QuotaExceededError` surfaces a
  friendly "storage full — clear old sessions?" rather than a silent failure.
  (Zustand `persist` errors can be observed via `onRehydrateStorage`/try-catch in
  a custom storage adapter.)
- **Versioned + migratable:** `version` + `migrate` mean a future schema change
  won't brick existing installs.
- **Privacy:** `clearAllData()` powers a visible "Delete all my data" control
  (FR-15) — important for a trust-sensitive, install-on-personal-phone app.

## 7. Example persisted blob

```jsonc
{
  "state": {
    "sessions": [
      {
        "id": "a1b2c3d4-…",
        "schemaVersion": 1,
        "task_id": "house",
        "mode_1_drawing_data": {
          "kind": "freehand",
          "strokes": [{ "points": [{ "x": 40, "y": 120 }, …], "width": 3 }],
          "canvas": { "width": 360, "height": 520 }
        },
        "mode_2_drawing_data": {
          "kind": "grid",
          "segments": [{ "from": { "col": 2, "row": 1 }, "to": { "col": 2, "row": 5 } }],
          "grid": { "cols": 8, "rows": 10 }
        },
        "mode_1_stress_level": 7,
        "mode_2_stress_level": 2,
        "mode_1_confidence_level": 3,
        "mode_2_confidence_level": 9,
        "started_at": 1718971200000,
        "completed_at": 1718971440000
      }
    ],
    "reducedIntensity": false
  },
  "version": 1
}
```
