/**
 * Welcome — the calm, gentle first impression (PRD-004 R04-4, _docs/06 §3.1).
 *
 * SHOW, DON'T TELL (ADR-008): this screen sets up a task and gets out of the way.
 * It must **not** name or explain autism/ASD — that happens only at Reflection.
 * Copy lives in `content/strings.ts` (the reviewed `welcome.copy.ts` + content
 * test land with PRD-009).
 *
 * Thumb-first layout: the primary Start CTA sits in the bottom third (_docs/06 §1).
 */
import { useGameStore } from '../../store/gameStore';
import { useReducedIntensity } from '../../store/selectors';
import { Button } from '../../components/Button';
import { GuideMascot } from '../../components/GuideMascot';
import { InstallHint } from '../../components/InstallHint';
import { strings } from '../../content/strings';

export function WelcomeScreen() {
  const startNewSession = useGameStore((s) => s.startNewSession);
  const go = useGameStore((s) => s.go);
  const setReducedIntensity = useGameStore((s) => s.setReducedIntensity);
  const reducedIntensity = useReducedIntensity();

  return (
    <main
      data-testid="screen-welcome"
      className="flex h-full flex-col px-8 pb-8 pt-12 text-center"
    >
      <header className="flex flex-col items-center gap-3">
        <GuideMascot mood="clear" />
        <h1 className="text-3xl font-semibold tracking-tight">
          {strings.app.name}
        </h1>
      </header>

      <div className="mt-8 flex flex-col items-center gap-1">
        <p className="text-body">{strings.welcome.hook}</p>
        <p className="text-body text-textMuted">{strings.welcome.subhook}</p>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-4">
        <Button fullWidth onClick={startNewSession} data-testid="welcome-start">
          {strings.common.start}
        </Button>

        <label className="flex min-h-touch items-center gap-2 text-sm text-textMuted">
          <input
            type="checkbox"
            checked={reducedIntensity}
            onChange={(e) => setReducedIntensity(e.target.checked)}
            data-testid="welcome-reduce-intensity"
            className="h-5 w-5 accent-primary"
          />
          {strings.welcome.reduceIntensity}
        </label>

        <button
          type="button"
          onClick={() => go('history')}
          data-testid="welcome-history"
          className="min-h-touch text-sm text-textMuted active:text-text"
        >
          {strings.welcome.viewHistory} ›
        </button>

        <InstallHint />
      </div>
    </main>
  );
}
