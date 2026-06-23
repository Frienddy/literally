import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameSession,
  PixelDrawing,
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
  | 'history'
  | 'examples';

interface GameState {
  /** Finite-state-machine: which screen is active. */
  screen: Screen;
  /** The session currently being played (not yet in `sessions` until complete). */
  draft: GameSession | null;
  /** All finalized sessions, newest first. */
  sessions: GameSession[];
  /**
   * Which past session the Reflection screen is viewing (PRD-008 R08-11).
   * `null` means "the one just finalized" (`sessions[0]`); set when opening a
   * session from History. Runtime-only — never persisted (not in `partialize`).
   */
  selectedSessionId: string | null;

  // --- navigation ---
  go: (screen: Screen) => void;
  /** Open a specific saved session's Reflection from History (R08-9/R08-11). */
  viewSession: (id: string) => void;

  // --- lifecycle ---
  startNewSession: () => void;
  saveMode1Drawing: (d: PixelDrawing) => void;
  saveMode2Drawing: (d: PixelDrawing) => void;
  setStress: (mode: 1 | 2, level: StressLevel) => void;
  setConfidence: (mode: 1 | 2, level: ConfidenceLevel) => void;
  finalizeSession: () => void;

  // --- history / privacy ---
  deleteSession: (id: string) => void;
  clearAllData: () => void;
  /**
   * Free storage by dropping older sessions, keeping only the most recent
   * (PRD-002 R02-13). The quota-recovery prompt calls this so "clear old
   * sessions" never discards the result the player is about to view — unlike
   * `clearAllData`, the newest session, the draft, and the current screen survive.
   */
  clearOldSessions: () => void;
}

/** Clamp to an integer in [1,10]. Shared by stress and confidence. */
const clamp1to10 = (n: number): number =>
  Math.max(1, Math.min(10, Math.round(n)));

/** Task pool — both modes of a session share one subject (PRD-002 R02-4). */
export const TASKS: TaskId[] = [
  'droid',
  'alien',
  'mario',
  'fighter',
  'monalisa',
  'ufo',
  'axolotl',
];
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
      selectedSessionId: null,

      go: (screen) => set({ screen }),

      viewSession: (id) => set({ selectedSessionId: id, screen: 'reflection' }),

      // Clearing `selectedSessionId` makes Reflection fall back to sessions[0].
      startNewSession: () =>
        set({ draft: newSession(), selectedSessionId: null, screen: 'mode1' }),

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
            selectedSessionId: null, // Reflection shows the just-finalized session
            screen: 'reflection',
          };
        }),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      clearAllData: () =>
        set({
          sessions: [],
          draft: null,
          selectedSessionId: null,
          screen: 'welcome',
        }),

      // Keep the newest, drop the rest. `sessions` is newest-first, so the
      // session the player just finished (sessions[0]) is preserved.
      clearOldSessions: () =>
        set((s) => ({ sessions: s.sessions.slice(0, 1) })),
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
      }),
      migrate: (persisted, fromVersion) => migrate(persisted, fromVersion),
    },
  ),
);
