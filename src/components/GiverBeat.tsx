/**
 * The instruction-giver's reaction beat (PRD-006 R06-12 completion; reused by
 * PRD-005's Mode 1 "not quite right" beat). ADR-011, _docs/01 §4.4 / §3.
 *
 * A brief, non-blocking overlay where the Grown-up reacts to the finished
 * attempt — beaming "Perfect — exactly right!" in Mode 2, gently puzzled in
 * Mode 1. It auto-advances after `durationMs` and is **always skippable** (a
 * Continue control), so it never traps the player or gates progress. Difficulty
 * is the *instructions'* doing, never the player's — Mode 2 simply earns the
 * warm payoff (ethics, _docs/07 §2).
 */
import { useEffect, useRef } from 'react';
import { Button } from './Button';
import { GuideMascot, type GuideMood } from './GuideMascot';
import { tokens } from '../styles/tokens';

export interface GiverBeatProps {
  mood: GuideMood;
  /** The giver's single line for this beat. */
  line: string;
  /** Resolved skip/advance control label. */
  continueLabel: string;
  /** Called once when the beat ends — by the timer or the Continue control. */
  onDone: () => void;
  /** How long the beat plays before auto-advancing (default `giverBeatMs`). */
  durationMs?: number;
  /** Base test id; the Continue control is `${testId}-continue`. */
  testId?: string;
}

export function GiverBeat({
  mood,
  line,
  continueLabel,
  onDone,
  durationMs = tokens.motion.giverBeatMs,
  testId = 'giver-beat',
}: GiverBeatProps) {
  // Fire `onDone` exactly once whether the timer elapses or the player skips.
  const firedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    const id = setTimeout(finish, durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);

  return (
    <div
      data-testid={testId}
      role="status"
      className="absolute inset-0 z-10 grid place-items-center bg-bg/70 p-6"
    >
      <div className="max-w-xs rounded-card bg-surface p-6 text-center">
        <div className="flex justify-center">
          <GuideMascot mood={mood} />
        </div>
        <p className="mt-3 text-step text-text">{line}</p>
        <Button
          fullWidth
          className="mt-5"
          onClick={finish}
          data-testid={`${testId}-continue`}
        >
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}
