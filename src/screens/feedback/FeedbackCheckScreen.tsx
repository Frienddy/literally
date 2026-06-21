/**
 * Feedback check — stress + confidence, reused for #1 (after Mode 1) and #2 (after
 * Mode 2) (PRD-004 R04-4 shell, _docs/06 §3.3). The active screen (`stress1` vs
 * `stress2`) selects which mode the ratings are stored against. Continue advances
 * the FSM: after #1 → Mode 2; after #2 → finalize → Reflection.
 *
 * The polished emoji-face `RatingScale`, its 1–10 mapping, and the confidence-gap
 * signal are owned by PRD-007 — the scale below is a minimal placeholder so the
 * flow is walkable.
 */
import { useGameStore } from '../../store/gameStore';
import { useDraft, useScreen } from '../../store/selectors';
import { Button } from '../../components/Button';
import { strings } from '../../content/strings';

// Placeholder faces (_docs/06 §3.3). The shipped custom set is PRD-007/009.
const STRESS_FACES = ['😌', '🙂', '😐', '😟', '😣'];
const CONFIDENCE_FACES = ['🤷', '😕', '🙂', '😀', '💯'];
// Five faces → spread across the stored 1–10 range (final mapping is PRD-007).
const VALUES = [2, 4, 6, 8, 10];

function StubScale({
  faces,
  value,
  onChange,
  testid,
}: {
  faces: string[];
  value: number | null;
  onChange: (v: number) => void;
  testid: string;
}) {
  return (
    <div
      className="mt-3 flex justify-between"
      role="radiogroup"
      data-testid={testid}
    >
      {faces.map((face, i) => {
        const v = VALUES[i];
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${v} of 10`}
            onClick={() => onChange(v)}
            className={`grid h-touch w-touch place-items-center rounded-button text-2xl transition-[filter] ${
              selected ? 'bg-surface' : 'opacity-60 active:opacity-100'
            }`}
          >
            {face}
          </button>
        );
      })}
    </div>
  );
}

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

  const onContinue = () => {
    if (mode === 1) go('mode2');
    else finalizeSession(); // stamps completed_at, moves draft → reflection
  };

  return (
    <main
      data-testid="screen-feedback"
      data-mode={mode}
      className="flex h-full flex-col px-8 pb-8 pt-12"
    >
      <h2 className="text-xl font-semibold">
        {strings.feedback.stressQuestion}
      </h2>
      <StubScale
        faces={STRESS_FACES}
        value={stress ?? null}
        onChange={(v) => setStress(mode, v)}
        testid="feedback-stress"
      />

      <h2 className="mt-10 text-xl font-semibold">
        {strings.feedback.confidenceQuestion}
      </h2>
      <StubScale
        faces={CONFIDENCE_FACES}
        value={confidence ?? null}
        onChange={(v) => setConfidence(mode, v)}
        testid="feedback-confidence"
      />

      <div className="flex-1" />

      <Button fullWidth onClick={onContinue} data-testid="feedback-continue">
        {strings.common.continue}
      </Button>
    </main>
  );
}
