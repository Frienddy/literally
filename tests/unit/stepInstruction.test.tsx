import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StepInstruction } from '../../src/components/StepInstruction';

/**
 * The structured experience hinges on this card behaving as the opposite of Mode
 * 1: exactly one persistent card, explicit progress, full control via Undo, and
 * **no timer**. Advancing is driven by the drawing itself — the screen moves to
 * the next step on each finished line — so this card exposes no Next CTA
 * (PRD-006 R06-3…R06-6, as amended by ADR-015's auto-advance).
 */
function renderStep(overrides = {}) {
  const props = {
    label: 'Step 3 of 9',
    instruction: 'Go right 4 squares.',
    undoLabel: 'Undo',
    canUndo: true,
    onUndo: vi.fn(),
    ...overrides,
  };
  render(<StepInstruction {...props} />);
  return props;
}

afterEach(() => vi.useRealTimers());

describe('StepInstruction (PRD-006)', () => {
  it('shows exactly one step card with explicit progress + instruction', () => {
    renderStep();
    expect(screen.getByText('Step 3 of 9')).toBeInTheDocument();
    expect(screen.getByText('Go right 4 squares.')).toBeInTheDocument();
  });

  it('exposes no Next CTA — drawing a line advances the step, not a button', () => {
    renderStep();
    expect(screen.queryByTestId('mode2-next')).not.toBeInTheDocument();
  });

  it('Undo reverts on an explicit press', () => {
    const { onUndo } = renderStep();
    fireEvent.click(screen.getByTestId('mode2-undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('disables Undo when there is nothing to revert', () => {
    renderStep({ canUndo: false });
    expect(screen.getByTestId('mode2-undo')).toBeDisabled();
  });

  it('never auto-advances on a timer — time passing changes nothing here', () => {
    vi.useFakeTimers();
    const { onUndo } = renderStep();
    act(() => vi.advanceTimersByTime(60_000));
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('hides the control row while the completion beat plays', () => {
    renderStep({ hideControls: true });
    expect(screen.queryByTestId('mode2-undo')).not.toBeInTheDocument();
  });
});
