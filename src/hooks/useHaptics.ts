/**
 * Haptics wrapper (PRD-003 R03-15, FR-6, ADR-003, _docs/05 §4).
 *
 * A thin, feature-detecting wrapper so the rest of the app never touches
 * `navigator.vibrate` directly. Haptics are an *enhancement*, never a
 * dependency: `navigator.vibrate` does not exist on iOS Safari, so this no-ops
 * cleanly there and the snap confirm must also read through visual + motion
 * channels. Honors the sensory-safety `reducedIntensity` toggle (soften the click).
 */
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { config } from '../config';

/** The shared snap-to-grid canvas fires one confirming pulse per new node. */
export type HapticKind = 'snap';

/** Detect at call time (not module load) so tests/late-polyfills are honored. */
function vibrateSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  );
}

export function useHaptics(): {
  vibrate: (kind: HapticKind) => void;
  supported: boolean;
} {
  const reduced = useGameStore((s) => s.reducedIntensity);

  const vibrate = useCallback(
    (_kind: HapticKind) => {
      if (!vibrateSupported()) return; // e.g. iOS Safari → no-op
      // crisp, satisfying click (softened in reduced-intensity mode)
      navigator.vibrate(
        reduced ? config.haptics.softClick : config.haptics.click,
      );
    },
    [reduced],
  );

  return { vibrate, supported: vibrateSupported() };
}
