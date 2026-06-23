import type { GameSession } from '../types/session';

// v3: the canvas became a pixel-paint surface, so both `mode_*_drawing_data`
// payloads are now `PixelDrawing` (kind: 'pixel'). Older sessions stored line
// drawings (v2 grid `segments`, or v1 freehand pixels) that can't be re-rendered
// as filled cells — the migration drops those incompatible payloads to `null`.
export const SCHEMA_VERSION = 3;

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
 * v2 → v3: the canvas became pixel-paint, so a drawing is now colored cells
 * (`kind: 'pixel'`), not line `segments`. Any payload that isn't already a pixel
 * drawing — including the v2 grid-segment shape — is dropped to `null` on BOTH
 * attempts (it can't be re-rendered as cells); scores + the resolved target keep
 * the session readable on Reflection / History.
 */
function upgradeV2toV3(state: PersistedState): PersistedState {
  const toPixelOrNull = (d: GameSession['mode_1_drawing_data']) => {
    const k = (d as unknown as { kind?: string } | null)?.kind;
    return k === 'pixel' ? d : null;
  };
  const sessions = state.sessions.map((s) => ({
    ...s,
    mode_1_drawing_data: toPixelOrNull(s.mode_1_drawing_data),
    mode_2_drawing_data: toPixelOrNull(s.mode_2_drawing_data),
  }));
  return { ...state, sessions };
}

/**
 * Transform older persisted blobs into the current shape.
 *
 * Add a `from < N` branch per version bump (run in order so old blobs upgrade
 * through each step). Never throw on unknown/corrupt input: a bad blob must boot
 * the app to an empty (but working) state rather than crash (PRD-002 R02-9 / NFR-7).
 */
export function migrate(persisted: unknown, from: number): PersistedState {
  try {
    if (!isPersistedState(persisted)) return { ...EMPTY };
    let state: PersistedState = persisted;
    if (from < 2) state = upgradeV1toV2(state);
    if (from < 3) state = upgradeV2toV3(state);
    return state;
  } catch {
    // Corrupt data → start clean rather than crash the app.
    return { ...EMPTY };
  }
}
