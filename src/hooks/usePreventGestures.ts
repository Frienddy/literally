import { useEffect } from 'react';

/**
 * Belt-and-suspenders for browsers that ignore `overscroll-behavior`, and to stop
 * iOS pinch-zoom / double-tap zoom which CSS can't fully prevent.
 *
 * Blocks pull-to-refresh, rubber-band overscroll, pinch & double-tap zoom.
 */
export function usePreventGestures(): void {
  useEffect(() => {
    // Prevent multi-touch pinch zoom (iOS Safari ignores user-scalable=no in PWAs sometimes).
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    // Prevent double-tap-to-zoom.
    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const tNow = e.timeStamp;
      if (tNow - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = tNow;
    };
    // Block gesture* events (older iOS pinch).
    const onGesture = (e: Event) => e.preventDefault();

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('gesturestart', onGesture as EventListener);

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('gesturestart', onGesture as EventListener);
    };
  }, []);
}
