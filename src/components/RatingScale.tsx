/**
 * One emoji-anchored rating scale (PRD-007 R07-4) — a controlled radiogroup of
 * face buttons reused for both the stress and confidence questions. Presentational
 * + a11y only: it knows nothing about the store; the screen maps the emitted
 * integer to `setStress`/`setConfidence`.
 *
 * Accessibility (R07-8, PRD-010):
 * - the group is a labelled `radiogroup` (`aria-labelledby` → the question),
 * - each face is a `radio` whose accessible name is its *word* ("Calm" … "Very
 *   sure"), not a bare number or a color — meaning is never color-only,
 * - 44pt minimum targets (`min-h-touch`/`min-w-touch`), token-driven styling.
 *
 * Selection fires a crisp haptic tap — an enhancement only (ADR-003): it is
 * feature-detected and never gates anything.
 */
import { useId } from 'react';
import type { RatingScaleContent } from '../content/feedback';
import { useHaptics } from '../hooks/useHaptics';

export interface RatingScaleProps {
  /** The question this scale answers — names the radiogroup for screen readers. */
  question: string;
  /** Faces + endpoint anchors, authored as data in `content/feedback.ts`. */
  scale: RatingScaleContent;
  /** Currently-selected stored value, or null before the player has answered. */
  value: number | null;
  /** Emits the selected integer (the screen clamps + stores it). */
  onChange: (value: number) => void;
  'data-testid'?: string;
}

export function RatingScale({
  question,
  scale,
  value,
  onChange,
  'data-testid': testid,
}: RatingScaleProps) {
  const labelId = useId();
  const { vibrate } = useHaptics();

  const select = (v: number) => {
    onChange(v);
    vibrate('snap'); // crisp confirm — enhancement only, no-ops where unsupported
  };

  return (
    <section aria-labelledby={labelId}>
      <h2 id={labelId} className="text-xl font-semibold">
        {question}
      </h2>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        data-testid={testid}
        className="mt-3 flex items-stretch justify-between gap-1"
      >
        {scale.faces.map((face) => {
          const selected = value === face.value;
          return (
            <button
              key={face.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={face.label}
              onClick={() => select(face.value)}
              className={[
                'grid min-h-touch min-w-touch flex-1 place-items-center',
                'rounded-button text-3xl transition-[filter,background-color,opacity]',
                selected
                  ? 'bg-surface opacity-100 ring-2 ring-primary'
                  : 'opacity-60 active:opacity-100',
              ].join(' ')}
            >
              <span aria-hidden>{face.emoji}</span>
            </button>
          );
        })}
      </div>

      {/* Endpoint words — a redundant, non-color cue for the scale direction. */}
      <div
        aria-hidden
        className="mt-1 flex justify-between text-sm text-textMuted"
      >
        <span>{scale.lowAnchor}</span>
        <span>{scale.highAnchor}</span>
      </div>
    </section>
  );
}
