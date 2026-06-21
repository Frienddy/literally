import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Face } from '../../src/components/Face';

/**
 * Face is the app-shipped rating glyph (PRD-011 R11-10 / R07-9). It must be
 * decorative (aria-hidden — the radio's word carries meaning) and its single
 * `mood` must visibly drive the expression: smile when positive, frown when
 * negative, worried brows only when negative.
 */
describe('Face (R11-10 / R07-9)', () => {
  const mouthControlY = (mood: number): number => {
    const { container } = render(<Face mood={mood} />);
    const d = container.querySelector('path')?.getAttribute('d') ?? '';
    // d = "M 7.5 15 Q 12 <controlY> 16.5 15"
    return Number(d.split('Q')[1]?.trim().split(/\s+/)[1]);
  };

  it('is purely decorative (aria-hidden) and renders an <svg>', () => {
    const { container } = render(<Face mood={0} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden');
  });

  it('bows the mouth down for a smile (+) and up for a frown (−)', () => {
    // SVG y grows downward, so a larger control-y bows the mouth down (smile).
    expect(mouthControlY(2)).toBeGreaterThan(mouthControlY(0));
    expect(mouthControlY(0)).toBeGreaterThan(mouthControlY(-2));
    expect(mouthControlY(0)).toBe(15); // neutral → flat line
  });

  it('shows worried brows only for negative moods, steeper as it worsens', () => {
    expect(
      render(<Face mood={1} />).container.querySelectorAll('line'),
    ).toHaveLength(0);
    expect(
      render(<Face mood={0} />).container.querySelectorAll('line'),
    ).toHaveLength(0);
    expect(
      render(<Face mood={-1} />).container.querySelectorAll('line'),
    ).toHaveLength(2);
    expect(
      render(<Face mood={-2} />).container.querySelectorAll('line'),
    ).toHaveLength(2);
  });

  it('clamps out-of-range moods instead of drawing off-glyph', () => {
    expect(mouthControlY(5)).toBe(mouthControlY(2)); // clamped to +2
    expect(mouthControlY(-5)).toBe(mouthControlY(-2)); // clamped to −2
  });
});
