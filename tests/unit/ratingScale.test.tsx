import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { RatingScale } from '../../src/components/RatingScale';
import { stressScale } from '../../src/content/feedback';

/**
 * RatingScale is the one reused scale component (PRD-007 R07-4). It is a labelled
 * radiogroup of face buttons that emits the selected integer; the screen does the
 * store wiring. Tests cover the contract + a11y (R07-8).
 */
describe('RatingScale', () => {
  const renderScale = (value: number | null, onChange = vi.fn()) => {
    render(
      <RatingScale
        question="How did that feel?"
        scale={stressScale}
        value={value}
        onChange={onChange}
        data-testid="scale"
      />,
    );
    return onChange;
  };

  it('renders one radio per face inside a radiogroup named by the question', () => {
    renderScale(null);
    const group = screen.getByRole('radiogroup', {
      name: 'How did that feel?',
    });
    expect(within(group).getAllByRole('radio')).toHaveLength(
      stressScale.faces.length,
    );
  });

  it('labels each face with its word, not just a number or color (R07-8)', () => {
    renderScale(null);
    // The shipped faces all expose their meaning as the accessible name.
    for (const face of stressScale.faces) {
      expect(
        screen.getByRole('radio', { name: face.label }),
      ).toBeInTheDocument();
    }
  });

  it('emits the face value on selection', () => {
    const onChange = renderScale(null);
    fireEvent.click(screen.getByRole('radio', { name: 'Overwhelmed' }));
    expect(onChange).toHaveBeenCalledWith(10); // last face → 10
  });

  it('marks the selected face as checked and leaves the rest unchecked', () => {
    renderScale(stressScale.faces[2].value); // value 6
    const radios = screen.getAllByRole('radio');
    const checked = radios.filter(
      (r) => r.getAttribute('aria-checked') === 'true',
    );
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName(stressScale.faces[2].label);
  });

  it('shows both endpoint anchors as a non-color cue', () => {
    renderScale(null);
    expect(screen.getByText(stressScale.lowAnchor)).toBeInTheDocument();
    expect(screen.getByText(stressScale.highAnchor)).toBeInTheDocument();
  });
});
