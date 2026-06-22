/**
 * Welcome — the calm, gentle first impression (PRD-004 R04-4, _docs/06 §3.1).
 *
 * SHOW, DON'T TELL (ADR-008): this screen sets up a task and gets out of the way.
 * It must **not** name or explain autism/ASD — that happens only at Reflection.
 * Copy lives in `content/welcome.copy.ts` (no-spoiler) — a content test forbids any
 * autism/ASD term here. The sensory-safety note is a *consent* disclosure (never
 * deferred), even though the topic is (doc 07 §1).
 *
 * Thumb-first layout: the primary Start CTA sits in the bottom third (_docs/06 §1).
 */
import { useGameStore } from '../../store/gameStore';
import { Button } from '../../components/Button';
import { GuideMascot } from '../../components/GuideMascot';
import { InstallHint } from '../../components/InstallHint';
import { strings } from '../../content/strings';
import { welcome } from '../../content/welcome.copy';

export function WelcomeScreen() {
  const startNewSession = useGameStore((s) => s.startNewSession);
  const go = useGameStore((s) => s.go);

  return (
    <main
      data-testid="screen-welcome"
      className="flex h-full flex-col px-8 pb-8 pt-12 text-center wide:mx-auto wide:max-w-4xl wide:flex-row wide:items-center wide:justify-center wide:gap-12 wide:px-12"
    >
      {/* Brand + hook + consent. On a laptop this becomes the left column; the
          actions move to the right column (ADR-014). */}
      <div className="flex flex-col items-center wide:flex-1">
        <header className="flex flex-col items-center gap-3">
          <GuideMascot mood="clear" size="lg" />
          <h1 className="text-3xl font-semibold tracking-tight">
            {strings.app.name}
          </h1>
        </header>

        <div className="mt-8 flex flex-col items-center gap-1">
          <p className="text-body">{welcome.hook}</p>
          <p className="text-body text-textMuted">{welcome.subhook}</p>
        </div>

        {/* Consent disclosure: the sensory note + the honest "explained at the
            end" promise. Deferring the topic is deliberate; the sensory risk
            is not. */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <p
            data-testid="welcome-sensory-note"
            className="max-w-xs text-sm leading-relaxed text-textMuted"
          >
            {welcome.sensoryNote}
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-textMuted">
            {welcome.afterNote}
          </p>
        </div>
      </div>

      {/* Thumb-reach spacer pins the CTA to the bottom in portrait; in the wide
          two-column layout the columns are simply centered instead. */}
      <div className="flex-1 wide:hidden" />

      <div className="flex flex-col items-center gap-4 wide:flex-1">
        <Button fullWidth onClick={startNewSession} data-testid="welcome-start">
          {strings.common.start}
        </Button>

        <button
          type="button"
          onClick={() => go('history')}
          data-testid="welcome-history"
          className="min-h-touch text-sm text-textMuted active:text-text"
        >
          {welcome.viewHistory} ›
        </button>

        <button
          type="button"
          onClick={() => go('examples')}
          data-testid="welcome-examples"
          className="min-h-touch text-sm text-textMuted active:text-text"
        >
          {welcome.viewExamples} ›
        </button>

        <InstallHint />

        {/* Maker credit — a plain, optional link, kept quiet so it never
            competes with the Start CTA (copy in welcome.copy.ts, ADR-007). */}
        <a
          href={welcome.madeByUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="welcome-madeby"
          className="min-h-touch text-xs font-medium text-brand active:opacity-70"
        >
          {welcome.madeBy} ›
        </a>
      </div>
    </main>
  );
}
