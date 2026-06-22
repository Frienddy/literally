import { useGameStore } from './gameStore';

/**
 * Each selector subscribes to the *narrowest* slice it needs so components don't
 * re-render on unrelated state changes (important while the canvas is active).
 */
export const useScreen = () => useGameStore((s) => s.screen);
export const useDraft = () => useGameStore((s) => s.draft);
export const useLatestSession = () =>
  useGameStore((s) => s.sessions[0] ?? null);
export const useSessions = () => useGameStore((s) => s.sessions);
/**
 * The session the Reflection screen should render: the one explicitly opened from
 * History (`selectedSessionId`), else the most recently finalized one (PRD-008
 * R08-1/R08-11). Returns the stored session object (a stable reference), or null.
 */
export const useReflectionSession = () =>
  useGameStore(
    (s) =>
      (s.selectedSessionId
        ? s.sessions.find((x) => x.id === s.selectedSessionId)
        : s.sessions[0]) ?? null,
  );
