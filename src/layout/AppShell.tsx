import { useEffect, type ReactNode } from 'react';
import { usePreventGestures } from '../hooks/usePreventGestures';
import { useOrientation, tryLockPortrait } from '../hooks/useOrientation';
import { useIsPhone } from '../hooks/useDeviceClass';
import { PortraitGuard } from './PortraitGuard';

/**
 * The rigid mobile shell every screen renders inside: applies the JS gesture
 * guard, enforces portrait *on phones*, and pads for device safe-areas (notch /
 * home indicator). See _docs/05 §2, ADR-004, and ADR-014.
 *
 * Portrait is enforced only on actual phones (`useIsPhone`): a phone turned
 * sideways still gets `PortraitGuard`, but a laptop/desktop/tablet — always
 * landscape — renders the app and lays out via the `wide:` breakpoint (ADR-014).
 */
export function AppShell({ children }: { children: ReactNode }) {
  usePreventGestures();
  const orientation = useOrientation();
  const isPhone = useIsPhone();
  const blocked = isPhone && orientation === 'landscape';

  // Opportunistically lock to portrait on first user gesture (no-op where
  // unsupported — PortraitGuard remains the universal fallback).
  useEffect(() => {
    const onFirstGesture = () => {
      tryLockPortrait();
      window.removeEventListener('pointerdown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    return () => window.removeEventListener('pointerdown', onFirstGesture);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col select-none touch-none overflow-hidden bg-bg text-text font-body"
      style={{
        // honor notch / home-indicator insets
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {blocked ? <PortraitGuard /> : children}
    </div>
  );
}
