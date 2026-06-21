import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import { gameStorage } from './storage';

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

/** Clamp to an integer in [1,10]. Shared by stress and confidence. */
const clamp1to10 = (n: number): number =>
  Math.max(1, Math.min(10, Math.round(n)));

/** Task pool — both modes of a session share one subject (PRD-002 R02-4). */
export const TASKS: TaskId[] = ['house', 'cat', 'flower'];
// Math.random is fine at app runtime (only disallowed inside Workflow scripts).
const pickTask = (): TaskId => TASKS[Math.floor(Math.random() * TASKS.length)];

function newSession(): GameSession {
  return {
    id: uuid(),
    schemaVersion: SCHEMA_VERSION,
    task_id: pickTask(), // same subject used by both modes this session
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
    (set) => ({
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
          const v = clamp1to10(level);
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
          const v = clamp1to10(level); // same 1–10 clamp
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

      clearAllData: () => set({ sessions: [], draft: null, screen: 'welcome' }),

      setReducedIntensity: (v) => set({ reducedIntensity: v }),
    }),
    {
      name: 'literally:game', // storage key
      version: SCHEMA_VERSION,
      // Quota-guarded localStorage; swap → IndexedDB adapter here if needed.
      storage: gameStorage,
      // Only persist durable data; `screen`/`draft` are session-runtime UI state.
      // After a reload mid-session the app lands on Welcome, not mid-mode (OQ-7).
      partialize: (s) => ({
        sessions: s.sessions,
        reducedIntensity: s.reducedIntensity,
      }),
      migrate: (persisted, fromVersion) => migrate(persisted, fromVersion),
    },
  ),
);
