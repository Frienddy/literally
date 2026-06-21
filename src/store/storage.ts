import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Fired (on `window`) when a persistence write fails because storage is full.
 * UI can listen for this to surface a "storage full — clear old sessions?" path
 * (PRD-002 R02-13). The in-memory store keeps working regardless — a failed
 * write is never allowed to throw and break the session.
 */
export const QUOTA_EXCEEDED_EVENT = 'literally:quota-exceeded';

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    // 22 = QuotaExceededError, 1014 = Firefox NS_ERROR_DOM_QUOTA_REACHED
    (err.code === 22 ||
      err.code === 1014 ||
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/**
 * localStorage wrapped so a `QuotaExceededError` (or any write failure) surfaces a
 * recoverable signal instead of a silent failure or a crash.
 *
 * IndexedDB escape hatch (ADR-002 / PRD-002 R02-15): if a single session's
 * serialized drawing payload exceeds ~150KB, swap this for an `idb-keyval`-backed
 * `StateStorage` adapter — it's a one-line change at the `storage:` seam in
 * `gameStore.ts`; nothing else needs to move.
 */
const guardedStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      if (isQuotaError(err)) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(QUOTA_EXCEEDED_EVENT));
        }
        console.warn(
          '[literally] storage full — session kept in memory but not persisted.',
        );
        return; // swallow: app stays usable
      }
      // Non-quota failures (e.g. private-mode disabled storage) also stay silent
      // rather than crashing the session.
      console.warn('[literally] persistence write failed:', err);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* no-op */
    }
  },
};

// Non-null: our factory always returns a concrete storage, so callers (and the
// `persist` middleware) get a defined `PersistStorage` rather than `| undefined`.
export const gameStorage = createJSONStorage(() => guardedStorage)!;
