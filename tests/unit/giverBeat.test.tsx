import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GiverBeat } from '../../src/components/GiverBeat';

/**
 * The giver beat must be gentle and **never block** progress (PRD-006 R06-12,
 * PRD-005 R05-8): it auto-advances after its duration, is skippable, and fires
 * its `onDone` exactly once either way.
 */
afterEach(() => vi.useRealTimers());

describe('GiverBeat (ADR-011)', () => {
  it('auto-advances after the beat duration', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <GiverBeat
        mood="beaming"
        line="Perfect — exactly right!"
        continueLabel="Continue"
        onDone={onDone}
        durationMs={2000}
      />,
    );
    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('is skippable and fires onDone exactly once (skip then timer)', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <GiverBeat
        mood="beaming"
        line="Perfect — exactly right!"
        continueLabel="Continue"
        onDone={onDone}
        durationMs={2000}
        testId="mode2-complete"
      />,
    );
    fireEvent.click(screen.getByTestId('mode2-complete-continue'));
    expect(onDone).toHaveBeenCalledTimes(1);
    // A later timer must not double-fire.
    act(() => vi.advanceTimersByTime(5000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
