import type { GameSession } from '../types/session';

// v2 (ADR-015): both modes share the snap-to-grid canvas, so `mode_1_drawing_data`
// is now a `GridDrawing`. v1 sessions stored Mode 1 as freehand pixels, which can't
// be re-rendered on the grid preview — the migration drops that payload to `null`.
export const SCHEMA_VERSION = 2;

/** The subset of store state that is actually persisted (see `partialize`). */
export interface PersistedState {
  sessions: GameSession[];
}

const EMPTY: PersistedState = { sessions: [] };

/** Defensive shape check — a persisted blob can be anything (old/corrupt). */
function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.sessions);
}

/**
 * v1 → v2: Mode 1 stopped being freehand (ADR-015). A persisted freehand payload
 * (`kind: 'freehand'`) is incompatible with the grid preview, so we null it; the
 * rest of the session (scores, target, Mode 2) is untouched and still re-renders.
 */
function upgradeV1toV2(state: PersistedState): PersistedState {
  const sessions = state.sessions.map((s) => {
    const m1 = s.mode_1_drawing_data as unknown as { kind?: string } | null;
    return m1 && m1.kind !== 'grid' ? { ...s, mode_1_drawing_data: null } : s;
  });
  return { ...state, sessions };
}

/**
 * Transform older persisted blobs into the current shape.
 *
 * Add a `from < N` branch per version bump. Never throw on unknown/corrupt input:
 * a bad blob must boot the app to an empty (but working) state rather than crash
 * (PRD-002 R02-9 / NFR-7).
 */
export function migrate(persisted: unknown, from: number): PersistedState {
  try {
    if (!isPersistedState(persisted)) return { ...EMPTY };
    let state: PersistedState = persisted;
    if (from < 2) state = upgradeV1toV2(state);
    return state;
  } catch {
    // Corrupt data → start clean rather than crash the app.
    return { ...EMPTY };
  }
}
