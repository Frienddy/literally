import { useEffect, useState } from 'react';

export type Orientation = 'portrait' | 'landscape';

/** Tracks portrait vs landscape via a media query (re-renders on change). */
export function useOrientation(): Orientation {
  const get = (): Orientation =>
    window.matchMedia('(orientation: portrait)').matches
      ? 'portrait'
      : 'landscape';

  const [orientation, setOrientation] = useState<Orientation>(get);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = () => setOrientation(get());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return orientation;
}

/**
 * Opportunistically lock to portrait. Only works in installed/standalone PWAs on
 * Android and is a no-op on iOS Safari — so we never depend on it; `PortraitGuard`
 * is the universal fallback. Call once on first user gesture.
 */
export function tryLockPortrait(): void {
  try {
    // The lock() signature is not in all lib.dom versions; guard defensively.
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    orientation.lock?.('portrait').catch(() => {});
  } catch {
    /* no-op: unsupported (e.g. iOS Safari) */
  }
}
