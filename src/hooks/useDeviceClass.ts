import { useEffect, useState } from 'react';

/**
 * Is this an actual handheld phone? (ADR-014)
 *
 * Used to decide who still sees `PortraitGuard`: a real phone turned sideways is
 * told to rotate, but a laptop/desktop/tablet in landscape gets the responsive
 * `wide:` layout instead. Width + orientation alone can't tell a large phone in
 * landscape from a small laptop window, so we combine a touch-input signal with a
 * physical-size check:
 *
 *  - **touch-primary** — `(pointer: coarse)` (the *primary* pointer is touch, so
 *    laptops/touch-laptops whose primary pointer is a trackpad report `fine` and
 *    are excluded) OR `navigator.maxTouchPoints > 0` as a cross-engine fallback
 *    (WebKit's media-feature emulation is less reliable than Chromium's);
 *  - **phone-sized** — short viewport side `< 600px`, which excludes tablets/iPads
 *    (short side ≥ ~768px) so those get the roomy wide layout, and excludes a plain
 *    desktop window the user happened to size short (no touch → not a phone).
 *
 * Guarded for jsdom/SSR where `matchMedia` is absent (mirrors
 * `usePrefersReducedMotion`): defaults to `false` (treat as not-a-phone /
 * desktop) so unit renders never throw and never trip the guard.
 */
const COARSE_QUERY = '(pointer: coarse)';
const PHONE_MAX_SHORT_SIDE = 600;

function detectPhone(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  if (shortSide >= PHONE_MAX_SHORT_SIDE) return false;
  const coarsePrimary = window.matchMedia(COARSE_QUERY).matches;
  const touchCapable =
    typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0;
  return coarsePrimary || touchCapable;
}

export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState<boolean>(detectPhone);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const update = () => setIsPhone(detectPhone());
    const mq = window.matchMedia(COARSE_QUERY);
    mq.addEventListener('change', update);
    // The short-side check also depends on viewport size, not just input class.
    window.addEventListener('resize', update);
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return isPhone;
}
