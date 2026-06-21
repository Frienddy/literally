/**
 * Reflection — the payoff (PRD-008, _docs/01 §6, _docs/06 §3.5). The contrast was
 * *felt* in the two modes; here it is *named*. The screen:
 *  - reveals the hidden target the player was never shown (ADR-010, R08-3);
 *  - shows both attempts side by side — the Mode 1 freehand with the target
 *    ghosted behind it so the gap is visible, the Mode 2 grid clean (R08-2);
 *  - shows the personal stress + confidence deltas (R08-6);
 *  - delivers "the reveal" — the first and only place autism is named — from
 *    `content/reveal.ts` (ADR-008, R08-5), with the three required disclaimers.
 *
 * It renders either the just-finalized session or one opened from History, via
 * `useReflectionSession` (R08-1/R08-11). All drawings re-render through the shared
 * `DrawingPreview` so saved work looks exactly as drawn.
 */
import { useGameStore } from '../../store/gameStore';
import { useReflectionSession } from '../../store/selectors';
import { resolveTask } from '../../content/tasks';
import { strings } from '../../content/strings';
import { reveal } from '../../content/reveal';
import { Button } from '../../components/Button';
import { DrawingPreview } from '../../components/DrawingPreview';
import { TargetReveal } from '../../components/TargetReveal';
import { exportComparison, isExportSupported } from '../../lib/exportImage';
import type { GameSession } from '../../types/session';

function Attempt({
  testId,
  label,
  summary,
  drawing,
  ghostTarget,
  scoreLine,
}: {
  testId: string;
  label: string;
  summary: string;
  drawing:
    | GameSession['mode_1_drawing_data']
    | GameSession['mode_2_drawing_data'];
  ghostTarget?: GameSession['mode_2_drawing_data'];
  scoreLine: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <p className="text-sm font-medium text-text">{label}</p>
      <DrawingPreview
        drawing={drawing}
        ghostTarget={ghostTarget ?? null}
        label={summary}
        data-testid={testId}
        className="aspect-square w-full"
      />
      <p className="text-center text-xs text-textMuted">{scoreLine}</p>
    </div>
  );
}

export function ReflectionScreen() {
  const session = useReflectionSession();
  const go = useGameStore((s) => s.go);

  // Defensive: Reflection should always have a session, but never crash without.
  if (!session) {
    return (
      <main
        data-testid="screen-reflection"
        className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center"
      >
        <p className="text-textMuted">{strings.history.empty}</p>
        <Button
          onClick={() => go('welcome')}
          data-testid="reflection-play-again"
        >
          {strings.reflection.playAgain}
        </Button>
      </main>
    );
  }

  const task = resolveTask(session.task_id);
  // P2 (FR-14): offer a local PNG export only where the platform supports it.
  const canExport = isExportSupported();

  return (
    <main
      data-testid="screen-reflection"
      className="flex h-full flex-col gap-5 overflow-y-auto px-6 pb-10 pt-10"
    >
      <h1 className="text-center text-xl font-semibold">
        {strings.reflection.title(task.label)}
      </h1>

      {/* The hidden target, revealed for the first time. */}
      <TargetReveal
        target={task.target}
        heading={reveal.targetHeading}
        label={strings.reflection.targetSummary(task.label)}
        className="self-center"
      />

      {/* Indicts the instructions, never the player. */}
      <p className="text-center text-body leading-relaxed text-text">
        {reveal.framing}
      </p>

      {/* Both attempts side by side; stacks on very small screens. */}
      <div className="grid grid-cols-2 gap-4 max-[340px]:grid-cols-1">
        <Attempt
          testId="reflection-preview-without"
          label={strings.reflection.withoutSteps}
          summary={strings.reflection.summaryWithout(task.label)}
          drawing={session.mode_1_drawing_data}
          ghostTarget={task.target}
          scoreLine={strings.reflection.scoreLine(
            session.mode_1_stress_level,
            session.mode_1_confidence_level,
          )}
        />
        <Attempt
          testId="reflection-preview-with"
          label={strings.reflection.withSteps}
          summary={strings.reflection.summaryWith(task.label)}
          drawing={session.mode_2_drawing_data}
          scoreLine={strings.reflection.scoreLine(
            session.mode_2_stress_level,
            session.mode_2_confidence_level,
          )}
        />
      </div>

      {/* Personal deltas — reflection, never a grade. */}
      <section
        data-testid="reflection-deltas"
        className="rounded-card bg-surface px-4 py-3 text-center"
      >
        <p className="text-xs uppercase tracking-wide text-textMuted">
          {reveal.deltaHeading}
        </p>
        <p className="mt-1 text-body text-text">
          {strings.reflection.delta(
            strings.reflection.stressLabel,
            session.mode_1_stress_level,
            session.mode_2_stress_level,
          )}
          {'  ·  '}
          {strings.reflection.delta(
            strings.reflection.confidenceLabel,
            session.mode_1_confidence_level,
            session.mode_2_confidence_level,
          )}
        </p>
      </section>

      {/* The reveal: the first and only place autism is named (ADR-008). */}
      <section
        data-testid="reflection-debrief"
        className="flex flex-col gap-3 text-body leading-relaxed text-text"
      >
        {reveal.debrief.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <ul className="mt-1 flex flex-col gap-1 text-xs text-textMuted">
          {reveal.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-success">
        {strings.reflection.saved}
      </p>

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
        {canExport && (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => void exportComparison(session, task)}
            aria-label={strings.reflection.exportAria}
            data-testid="reflection-export"
          >
            {strings.reflection.exportImage}
          </Button>
        )}
      </div>
    </main>
  );
}
