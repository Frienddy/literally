import { lazy, Suspense } from 'react';
import { AppShell } from './layout/AppShell';
import { useInstallPrompt } from './hooks/useInstallPrompt';

// Lazy-loaded so it stays in its own chunk, off the main bundle and the normal
// app path. Only mounted with `?harness=canvas` (PRD-003 demo harness / E2E).
const CanvasDemo = lazy(() => import('./dev/CanvasDemo'));

/**
 * Phase-0 placeholder. This is the production-grade *shell* only — the real
 * screen flow (Welcome → Mode 1 → … → Reflection) arrives with the FSM router in
 * PRD-004. Copy here is intentionally minimal and names nothing about the
 * lesson (ADR-008 "show, don't tell").
 */
export default function App() {
  const { canInstall, promptInstall, platform } = useInstallPrompt();
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
      <main className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Literally</h1>
        <p className="max-w-xs text-sm text-slate-400">
          Draw the same thing twice. Notice the difference.
        </p>

        {canInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-ink"
          >
            Add to Home Screen
          </button>
        ) : platform === 'ios' ? (
          <p className="max-w-xs text-xs text-slate-500">
            To install: tap the Share icon, then “Add to Home Screen”.
          </p>
        ) : null}
      </main>
    </AppShell>
  );
}
