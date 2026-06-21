/**
 * History — past sessions + the privacy wipe (PRD-004 R04-4 shell, _docs/06 §3.6).
 * Lists finalized sessions (newest first) with their stress arc (M1 → M2) and a
 * "Delete all my data" control wired to `clearAllData` (FR-15). Back returns to
 * Welcome.
 *
 * Out of scope here (PRD-008): opening a specific saved reflection with its real
 * drawing thumbnails, and (PRD-010) a confirm step on the destructive wipe.
 */
import { useGameStore } from '../../store/gameStore';
import { useSessions } from '../../store/selectors';
import { strings } from '../../content/strings';

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

export function HistoryScreen() {
  const sessions = useSessions();
  const go = useGameStore((s) => s.go);
  const clearAllData = useGameStore((s) => s.clearAllData);

  return (
    <main
      data-testid="screen-history"
      className="flex h-full flex-col px-6 pb-8 pt-10"
    >
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{strings.history.title}</h1>
        <button
          type="button"
          onClick={() => go('welcome')}
          aria-label={strings.common.back}
          data-testid="history-back"
          className="min-h-touch px-2 text-textMuted active:text-text"
        >
          ‹ {strings.common.back}
        </button>
      </header>

      <div className="mt-6 flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="mt-8 text-center text-textMuted">
            {strings.history.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="history-list">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go('reflection')}
                  className="flex min-h-touch w-full items-center justify-between rounded-card bg-surface px-4 py-3 text-left active:brightness-110"
                >
                  <span className="text-sm">
                    {fmtDate(s.started_at)} · {s.mode_1_stress_level ?? '–'} →{' '}
                    {s.mode_2_stress_level ?? '–'}
                  </span>
                  <span aria-hidden className="text-textMuted">
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sessions.length > 0 && (
        <button
          type="button"
          onClick={clearAllData}
          data-testid="history-delete-all"
          className="mt-4 min-h-touch text-sm text-stormWarn active:brightness-110"
        >
          {strings.history.deleteAll}
        </button>
      )}
    </main>
  );
}
