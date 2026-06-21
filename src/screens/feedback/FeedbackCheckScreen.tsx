/**
 * Feedback check — stress + confidence, the single screen reused for #1 (after
 * Mode 1) and #2 (after Mode 2) (PRD-007, _docs/06 §3.3). The active FSM screen
 * (`stress1` vs `stress2`) selects which mode the ratings are stored against.
 *
 * Two `RatingScale`s (stress, then confidence) sit above one Continue. Selecting a
 * face stores its integer immediately via `setStress`/`setConfidence` (R07-7); the
 * store clamps to [1,10] (R07-5). Continue is the only forward action and there is
 * no path back into the just-played mode (R07-6) — matching Mode 1's "no redo"
 * truth. It stays disabled until both questions are answered, so the confidence
 * gap (SC-2c) and the Reflection deltas (PRD-008) never read a null.
 *
 * Continue advances the FSM: after #1 → Mode 2; after #2 → `finalizeSession`
 * stamps `completed_at`, moves draft → sessions, and lands on Reflection (R07-10).
 */
import { useGameStore } from '../../store/gameStore';
import { useDraft, useScreen } from '../../store/selectors';
import { Button } from '../../components/Button';
import { RatingScale } from '../../components/RatingScale';
import { strings } from '../../content/strings';
import { stressScale, confidenceScale } from '../../content/feedback';

export function FeedbackCheckScreen() {
  const screen = useScreen();
  const mode: 1 | 2 = screen === 'stress1' ? 1 : 2;
  const draft = useDraft();
  const setStress = useGameStore((s) => s.setStress);
  const setConfidence = useGameStore((s) => s.setConfidence);
  const finalizeSession = useGameStore((s) => s.finalizeSession);
  const go = useGameStore((s) => s.go);

  const stress =
    mode === 1 ? draft?.mode_1_stress_level : draft?.mode_2_stress_level;
  const confidence =
    mode === 1
      ? draft?.mode_1_confidence_level
      : draft?.mode_2_confidence_level;

  // Both answers are required before advancing — neither signal is optional.
  const ready = stress != null && confidence != null;

  const onContinue = () => {
    if (!ready) return;
    if (mode === 1) go('mode2');
    else finalizeSession(); // stamps completed_at, moves draft → reflection
  };

  return (
    <main
      data-testid="screen-feedback"
      data-mode={mode}
      className="flex h-full flex-col gap-10 px-8 pb-8 pt-12"
    >
      <RatingScale
        question={strings.feedback.stressQuestion}
        scale={stressScale}
        value={stress ?? null}
        onChange={(v) => setStress(mode, v)}
        data-testid="feedback-stress"
      />

      <RatingScale
        question={strings.feedback.confidenceQuestion}
        scale={confidenceScale}
        value={confidence ?? null}
        onChange={(v) => setConfidence(mode, v)}
        data-testid="feedback-confidence"
      />

      <div className="flex-1" />

      <Button
        fullWidth
        onClick={onContinue}
        disabled={!ready}
        data-testid="feedback-continue"
      >
        {strings.common.continue}
      </Button>
    </main>
  );
}
