import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StepInstruction } from '../../src/components/StepInstruction';

/**
 * The structured experience hinges on this card behaving as the opposite of Mode
 * 1: exactly one persistent card, explicit progress, full control, and crucially
 * **no timer / no auto-advance** (PRD-006 R06-3…R06-6).
 */
function renderStep(overrides = {}) {
  const props = {
    label: 'Step 3 of 9',
    instruction: 'Go right 4 squares.',
    nextLabel: 'Next step',
    undoLabel: 'Undo',
    canUndo: true,
    onNext: vi.fn(),
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

  it('advances only on an explicit Next press', () => {
    const { onNext } = renderStep();
    expect(onNext).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('mode2-next'));
    expect(onNext).toHaveBeenCalledTimes(1);
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

  it('never auto-advances — time passing does not call onNext (no timer)', () => {
    vi.useFakeTimers();
    const { onNext } = renderStep();
    act(() => vi.advanceTimersByTime(60_000));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('hides the control row while the completion beat plays', () => {
    renderStep({ hideControls: true });
    expect(screen.queryByTestId('mode2-next')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mode2-undo')).not.toBeInTheDocument();
  });
});
