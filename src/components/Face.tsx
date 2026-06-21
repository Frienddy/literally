/**
 * Face — the app-shipped rating glyph (PRD-011 R11-10, R07-9; _docs/06 §5).
 *
 * Replaces the placeholder platform emoji on the rating scales. Platform emoji
 * render differently per device (and some don't render at all), so the five faces
 * looked inconsistent across phones. This is one parameterized SVG instead: a
 * single `mood` (−2 very negative … +2 very positive) drives the mouth curve and
 * a worried brow, so every device shows the exact same set.
 *
 * Purely decorative: the meaning is carried by the parent radio's word label
 * (R07-8), so the SVG is `aria-hidden`. Static geometry → nothing for
 * reduced-motion to collapse. Strokes use `currentColor` to inherit theme ink.
 */
export interface FaceProps {
  /** −2 (very negative) … +2 (very positive). Drives mouth + brow. */
  mood: number;
  className?: string;
}

export function Face({ mood, className = 'h-8 w-8' }: FaceProps) {
  const m = Math.max(-2, Math.min(2, mood));
  // Mouth: a quadratic whose control point bows down for a smile (+) and up for
  // a frown (−). At mood 0 the control sits on the baseline → a flat line.
  const mouth = `M 7.5 15 Q 12 ${15 + m * 3} 16.5 15`;
  // Worried brows appear only for negative moods; inner ends lift with severity.
  const lift = m < 0 ? -m * 0.9 : 0;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.7" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15.3" cy="10" r="0.6" fill="currentColor" stroke="none" />
      {lift > 0 && (
        <>
          <line x1="6.8" y1="7.8" x2="10.4" y2={(7.4 - lift).toFixed(2)} />
          <line x1="17.2" y1="7.8" x2="13.6" y2={(7.4 - lift).toFixed(2)} />
        </>
      )}
      <path d={mouth} />
    </svg>
  );
}
