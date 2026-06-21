import { lazy, Suspense } from 'react';
import { AppShell } from './layout/AppShell';
import { ScreenRouter } from './app/ScreenRouter';

// Lazy-loaded so it stays in its own chunk, off the main bundle and the normal
// app path. Only mounted with `?harness=canvas` (PRD-003 demo harness / E2E).
const CanvasDemo = lazy(() => import('./dev/CanvasDemo'));

/**
 * The app is a single document. `App` mounts the rigid mobile shell (PRD-001) and
 * hands off to the store-driven `ScreenRouter` (PRD-004) — navigation is an
 * in-store FSM, not a URL router (ADR-004). The `?harness=canvas` escape hatch
 * keeps the PRD-003 canvas E2E harness reachable until the mode screens own it.
 */
export default function App() {
  const harness = new URLSearchParams(window.location.search).get('harness');

  if (harness === 'canvas') {
    return (
      <AppShell>
        <Suspense fallback={null}>
          <CanvasDemo />
        </Suspense>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenRouter />
    </AppShell>
  );
}
