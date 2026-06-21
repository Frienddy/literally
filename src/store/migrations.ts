import type { GameSession } from '../types/session';

export const SCHEMA_VERSION = 1;

/** The subset of store state that is actually persisted (see `partialize`). */
export interface PersistedState {
  sessions: GameSession[];
  reducedIntensity: boolean;
}

const EMPTY: PersistedState = { sessions: [], reducedIntensity: false };

/** Defensive shape check — a persisted blob can be anything (old/corrupt). */
function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.sessions) && typeof v.reducedIntensity === 'boolean';
}

/**
 * Transform older persisted blobs into the current shape.
 *
 * Add a `from < N` branch per version bump. Never throw on unknown/corrupt input:
 * a bad blob must boot the app to an empty (but working) state rather than crash
 * (PRD-002 R02-9 / NFR-7).
 */
export function migrate(persisted: unknown, _from: number): PersistedState {
  try {
    // (future) if (_from < 2) persisted = upgradeV1toV2(persisted);
    if (!isPersistedState(persisted)) return { ...EMPTY };
    return persisted;
  } catch {
    // Corrupt data → start clean rather than crash the app.
    return { ...EMPTY };
  }
}
