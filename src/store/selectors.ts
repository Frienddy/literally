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
export const useReducedIntensity = () =>
  useGameStore((s) => s.reducedIntensity);
