import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { FeedbackCheckScreen } from '../../src/screens/feedback/FeedbackCheckScreen';
import { useGameStore } from '../../src/store/gameStore';

/**
 * The single reused feedback screen (PRD-007). The active FSM screen picks which
 * mode the ratings store against; one Continue advances the flow and there is no
 * path back into the just-played mode.
 */
const reset = () =>
  useGameStore.setState({
    screen: 'welcome',
    draft: null,
    sessions: [],
    reducedIntensity: false,
  });

/** Start a draft and land on the given feedback screen. */
const arrive = (s: 'stress1' | 'stress2') => {
  useGameStore.getState().startNewSession();
  useGameStore.setState({ screen: s });
};

const stressRadios = () =>
  within(screen.getByTestId('feedback-stress')).getAllByRole('radio');
const confidenceRadios = () =>
  within(screen.getByTestId('feedback-confidence')).getAllByRole('radio');
const continueBtn = () => screen.getByTestId('feedback-continue');

beforeEach(() => {
  reset();
  localStorage.clear();
});

describe('FeedbackCheckScreen', () => {
  it('renders both scales and a single Continue (R07-1/R07-4/R07-6)', () => {
    arrive('stress1');
    render(<FeedbackCheckScreen />);
    expect(screen.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '1',
    );
    expect(screen.getByTestId('feedback-stress')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-confidence')).toBeInTheDocument();
    // The only forward control — no "back to drawing" path (R07-6).
    expect(screen.getAllByRole('button', { name: /continue/i })).toHaveLength(
      1,
    );
  });

  it('stores stress + confidence against mode 1 immediately on selection (R07-2/3/7)', () => {
    arrive('stress1');
    render(<FeedbackCheckScreen />);

    fireEvent.click(stressRadios()[3]); // value 8
    fireEvent.click(confidenceRadios()[0]); // value 2

    const draft = useGameStore.getState().draft!;
    expect(draft.mode_1_stress_level).toBe(8);
    expect(draft.mode_1_confidence_level).toBe(2);
    // mode 2 fields untouched by a mode-1 check.
    expect(draft.mode_2_stress_level).toBeNull();
    expect(draft.mode_2_confidence_level).toBeNull();
  });

  it('the same component stores against mode 2 when on stress2 (R07-1)', () => {
    arrive('stress2');
    render(<FeedbackCheckScreen />);
    expect(screen.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '2',
    );

    fireEvent.click(stressRadios()[0]); // value 2
    fireEvent.click(confidenceRadios()[4]); // value 10

    const draft = useGameStore.getState().draft!;
    expect(draft.mode_2_stress_level).toBe(2);
    expect(draft.mode_2_confidence_level).toBe(10);
  });

  it('gates Continue until both questions are answered', () => {
    arrive('stress1');
    render(<FeedbackCheckScreen />);

    expect(continueBtn()).toBeDisabled();
    fireEvent.click(stressRadios()[2]);
    expect(continueBtn()).toBeDisabled(); // confidence still missing
    fireEvent.click(confidenceRadios()[2]);
    expect(continueBtn()).toBeEnabled();
  });

  it('check #1 Continue advances to Mode 2 without finalizing (R07-6)', () => {
    arrive('stress1');
    render(<FeedbackCheckScreen />);
    fireEvent.click(stressRadios()[4]);
    fireEvent.click(confidenceRadios()[0]);
    fireEvent.click(continueBtn());

    expect(useGameStore.getState().screen).toBe('mode2');
    expect(useGameStore.getState().draft).not.toBeNull(); // not finalized yet
    expect(useGameStore.getState().sessions).toHaveLength(0);
  });

  it('check #2 Continue finalizes the session and lands on Reflection (R07-10)', () => {
    arrive('stress2');
    // Pretend mode 1 was already rated this session.
    useGameStore.getState().setStress(1, 9);
    useGameStore.getState().setConfidence(1, 2);
    render(<FeedbackCheckScreen />);

    fireEvent.click(stressRadios()[0]); // 2
    fireEvent.click(confidenceRadios()[4]); // 10
    fireEvent.click(continueBtn());

    const state = useGameStore.getState();
    expect(state.screen).toBe('reflection');
    expect(state.draft).toBeNull();
    expect(state.sessions).toHaveLength(1);
    const saved = state.sessions[0];
    expect(saved.completed_at).not.toBeNull();
    expect(saved.mode_2_stress_level).toBe(2);
    expect(saved.mode_2_confidence_level).toBe(10);
  });
});
