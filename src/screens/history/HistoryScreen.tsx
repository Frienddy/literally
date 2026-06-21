/**
 * History — past sessions + the privacy wipe (PRD-008 R08-9/R08-10/R08-11,
 * _docs/06 §3.6). Lists finalized sessions newest-first; each row shows the date,
 * the Mode 1 → Mode 2 stress arc, and thumbnails of both drawings, and opens that
 * session's Reflection via `viewSession(id)` (so the *tapped* session is shown,
 * not just the latest).
 *
 * "Delete all my data" (FR-15) is a genuinely destructive, irreversible local
 * wipe, so it takes an explicit in-app confirm step (R08-10 / PRD-010) rather than
 * firing on the first tap. Back returns to Welcome.
 */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSessions } from '../../store/selectors';
import { strings } from '../../content/strings';
import { DrawingPreview } from '../../components/DrawingPreview';
import type { GameSession } from '../../types/session';

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

function SessionRow({
  session,
  onOpen,
}: {
  session: GameSession;
  onOpen: () => void;
}) {
  const date = fmtDate(session.started_at);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={strings.history.openAria(date)}
        className="flex min-h-touch w-full items-center gap-3 rounded-card bg-surface px-4 py-3 text-left active:brightness-110"
      >
        <span className="flex-1 text-sm">
          {strings.history.arc(
            date,
            session.mode_1_stress_level,
            session.mode_2_stress_level,
          )}
        </span>
        <span className="flex gap-1" aria-hidden>
          <DrawingPreview
            drawing={session.mode_1_drawing_data}
            label=""
            className="h-12 w-12"
          />
          <DrawingPreview
            drawing={session.mode_2_drawing_data}
            label=""
            className="h-12 w-12"
          />
        </span>
        <span aria-hidden className="text-textMuted">
          ›
        </span>
      </button>
    </li>
  );
}

export function HistoryScreen() {
  const sessions = useSessions();
  const go = useGameStore((s) => s.go);
  const viewSession = useGameStore((s) => s.viewSession);
  const clearAllData = useGameStore((s) => s.clearAllData);
  const [confirming, setConfirming] = useState(false);

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
              <SessionRow
                key={s.id}
                session={s}
                onOpen={() => viewSession(s.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {sessions.length > 0 &&
        (confirming ? (
          <div
            data-testid="history-delete-confirm-row"
            className="mt-4 flex flex-col gap-2 rounded-card bg-surface p-3 text-center"
          >
            <p className="text-sm text-text">{strings.history.confirmPrompt}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                data-testid="history-delete-cancel"
                className="min-h-touch flex-1 rounded-button bg-surface px-3 text-sm text-textMuted active:text-text"
              >
                {strings.history.confirmNo}
              </button>
              <button
                type="button"
                onClick={clearAllData}
                data-testid="history-delete-confirm"
                className="min-h-touch flex-1 rounded-button px-3 text-sm font-medium text-stormWarn active:brightness-110"
              >
                {strings.history.confirmYes}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            data-testid="history-delete-all"
            className="mt-4 min-h-touch text-sm text-stormWarn active:brightness-110"
          >
            {strings.history.deleteAll}
          </button>
        ))}
    </main>
  );
}
