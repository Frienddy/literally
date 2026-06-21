import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VagueInstruction } from '../../src/components/VagueInstruction';
import { fadeOpacity } from '../../src/lib/fade';

/**
 * The vague instruction simulates working-memory load: legible for a moment, then
 * it fades — and there is **no way to summon it back** (PRD-005 R05-3). Reduced
 * intensity raises its contrast so it stays uncomfortable, not unreadable (R05-11).
 */
describe('fadeOpacity (the decay curve)', () => {
  const cfg = { startDelayMs: 3000, durationMs: 9000, minOpacity: 0.06 };

  it('is fully legible until the start delay', () => {
    expect(fadeOpacity(0, cfg)).toBe(1);
    expect(fadeOpacity(3000, cfg)).toBe(1);
  });

  it('decays monotonically toward the floor and clamps there', () => {
    const mid = fadeOpacity(3000 + cfg.durationMs / 2, cfg);
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(cfg.minOpacity);
    // At/after the end it sits at the floor and never undershoots it.
    expect(fadeOpacity(3000 + cfg.durationMs, cfg)).toBeCloseTo(
      cfg.minOpacity,
      5,
    );
    expect(fadeOpacity(999_999, cfg)).toBeCloseTo(cfg.minOpacity, 5);
  });

  it('a higher floor (reduced intensity) keeps the text more readable', () => {
    const full = fadeOpacity(20_000, { ...cfg, minOpacity: 0.06 });
    const reduced = fadeOpacity(20_000, {
      ...cfg,
      durationMs: 12_000,
      minOpacity: 0.35,
    });
    expect(reduced).toBeGreaterThan(full);
  });
});

describe('VagueInstruction', () => {
  it('renders the ask + instruction and exposes NO recall control (R05-3)', () => {
    render(
      <VagueInstruction ask="the ask" instruction="draw a normal house" />,
    );
    expect(screen.getByText('the ask')).toBeInTheDocument();
    expect(screen.getByText('draw a normal house')).toBeInTheDocument();
    // No "show again" button, no interactive control to recall the fading text.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('raises contrast under reduced intensity (R05-11)', () => {
    const { rerender } = render(
      <VagueInstruction ask="a" instruction="b" reduced={false} />,
    );
    expect(screen.getByTestId('vague-instruction').className).toContain(
      'text-stormText',
    );
    rerender(<VagueInstruction ask="a" instruction="b" reduced />);
    expect(screen.getByTestId('vague-instruction').className).toContain(
      'text-text',
    );
  });
});
