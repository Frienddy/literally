/**
 * Reflection — the side-by-side compare and "the reveal" (PRD-004 R04-4 shell,
 * _docs/06 §3.5). This PRD wires the skeleton: it reads the just-finalized session
 * and lays out the two attempts + their stress/confidence, plus the CTAs (Play
 * again → Welcome, History).
 *
 * Out of scope here: the target reveal + ghost overlay, the real saved-drawing
 * previews (PRD-008, via `engine/render.ts`), and — critically — the reviewed
 * reveal copy. The one place autism is named (ADR-008) is authored in PRD-009;
 * the paragraph below is a neutral placeholder, not the reveal.
 */
import { useGameStore } from '../../store/gameStore';
import { useLatestSession } from '../../store/selectors';
import { Button } from '../../components/Button';
import { strings } from '../../content/strings';

function AttemptCard({
  label,
  stress,
  confidence,
}: {
  label: string;
  stress: number | null;
  confidence: number | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="aspect-square rounded-card bg-surface"
        aria-label={`${label} drawing (preview in PRD-008)`}
      />
      <p className="text-center text-xs text-textMuted">
        {label}
        <br />
        stress {stress ?? '–'} · sure? {confidence ?? '–'}
      </p>
    </div>
  );
}

export function ReflectionScreen() {
  const session = useLatestSession();
  const go = useGameStore((s) => s.go);

  return (
    <main
      data-testid="screen-reflection"
      className="flex h-full flex-col gap-5 overflow-y-auto px-6 pb-8 pt-10"
    >
      <h1 className="text-center text-xl font-semibold">
        {strings.reflection.title}
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <AttemptCard
          label={strings.reflection.withoutSteps}
          stress={session?.mode_1_stress_level ?? null}
          confidence={session?.mode_1_confidence_level ?? null}
        />
        <AttemptCard
          label={strings.reflection.withSteps}
          stress={session?.mode_2_stress_level ?? null}
          confidence={session?.mode_2_confidence_level ?? null}
        />
      </div>

      <p className="text-center text-body text-textMuted">
        {strings.reflection.revealPlaceholder}
      </p>

      <div className="flex-1" />

      <div className="flex flex-col gap-3">
        <Button
          fullWidth
          onClick={() => go('welcome')}
          data-testid="reflection-play-again"
        >
          {strings.reflection.playAgain}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => go('history')}
          data-testid="reflection-history"
        >
          {strings.reflection.history}
        </Button>
      </div>
    </main>
  );
}
