/**
 * Quota-recovery prompt (PRD-002 R02-13 / _debt/002). `store/storage.ts` already
 * guards persistence writes so a full device never crashes the session — it
 * swallows the `QuotaExceededError`, keeps working in memory, and dispatches the
 * `literally:quota-exceeded` event. This is the missing **UI listener**: it
 * surfaces a calm "storage full — clear old sessions?" path instead of failing
 * silently.
 *
 * Mounted once globally (in `App`, over the `ScreenRouter`) so it can appear on
 * whichever screen triggered the write — realistically the finalize step, where
 * both Mode drawings get persisted. "Clear older sessions" frees space via
 * `clearOldSessions`, which keeps the just-finished session intact (ADR-001 keeps
 * everything local, so the only recovery is to make room on-device).
 */
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { QUOTA_EXCEEDED_EVENT } from '../store/storage';
import { strings } from '../content/strings';
import { Button } from './Button';

export function QuotaNotice() {
  const [open, setOpen] = useState(false);
  const clearOldSessions = useGameStore((s) => s.clearOldSessions);

  useEffect(() => {
    const onQuota = () => setOpen(true);
    window.addEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
    return () => window.removeEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
  }, []);

  if (!open) return null;

  const onClear = () => {
    clearOldSessions(); // the smaller state re-persists successfully
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-5 pb-[max(env(safe-area-inset-bottom),1rem)]"
      data-testid="quota-notice"
    >
      <div
        role="alertdialog"
        aria-labelledby="quota-title"
        aria-describedby="quota-body"
        className="w-full max-w-md rounded-card bg-surface p-5 text-text shadow-xl"
      >
        <h2 id="quota-title" className="text-lg font-semibold">
          {strings.quota.title}
        </h2>
        <p id="quota-body" className="mt-2 text-sm text-textMuted">
          {strings.quota.body}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={onClear}
            data-testid="quota-clear"
          >
            {strings.quota.clear}
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            data-testid="quota-dismiss"
            className="min-h-touch text-sm text-textMuted active:text-text"
          >
            {strings.quota.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
