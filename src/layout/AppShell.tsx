import { useEffect, type ReactNode } from 'react';
import { usePreventGestures } from '../hooks/usePreventGestures';
import { useOrientation, tryLockPortrait } from '../hooks/useOrientation';
import { PortraitGuard } from './PortraitGuard';

/**
 * The rigid mobile shell every screen renders inside: applies the JS gesture
 * guard, enforces portrait, and pads for device safe-areas (notch / home
 * indicator). See _docs/05 §2 and ADR-004.
 */
export function AppShell({ children }: { children: ReactNode }) {
  usePreventGestures();
  const orientation = useOrientation();

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
      className="fixed inset-0 flex flex-col select-none touch-none overflow-hidden bg-ink text-slate-100"
      style={{
        // honor notch / home-indicator insets
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {orientation === 'landscape' ? <PortraitGuard /> : children}
    </div>
  );
}
