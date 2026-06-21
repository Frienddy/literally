import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ScreenRouter } from '../../src/app/ScreenRouter';
import { useGameStore } from '../../src/store/gameStore';
import {
  TRANSITIONS,
  FLOW_STEPS,
  nextScreen,
  flowStepIndex,
} from '../../src/app/routes';

const reset = () =>
  useGameStore.setState({
    screen: 'welcome',
    draft: null,
    sessions: [],
    reducedIntensity: false,
  });

beforeEach(() => {
  reset();
  localStorage.clear();
});

describe('routes (FSM map)', () => {
  it('linear forward path matches the journey', () => {
    expect(nextScreen('welcome')).toBe('mode1');
    expect(nextScreen('mode1')).toBe('stress1');
    expect(nextScreen('stress1')).toBe('mode2');
    expect(nextScreen('mode2')).toBe('stress2');
    expect(nextScreen('stress2')).toBe('reflection');
    expect(nextScreen('reflection')).toBe('welcome');
    expect(nextScreen('history')).toBeNull();
  });

  it('every linear forward target is an allowed transition', () => {
    for (const from of Object.keys(TRANSITIONS) as Array<
      keyof typeof TRANSITIONS
    >) {
      const next = nextScreen(from);
      if (next) expect(TRANSITIONS[from]).toContain(next);
    }
  });

  it('flowStepIndex maps the 5 counted steps and excludes welcome/history', () => {
    expect(FLOW_STEPS).toHaveLength(5);
    expect(flowStepIndex('mode1')).toBe(0);
    expect(flowStepIndex('reflection')).toBe(4);
    expect(flowStepIndex('welcome')).toBe(-1);
    expect(flowStepIndex('history')).toBe(-1);
  });
});

describe('ScreenRouter — the flow is walkable with stubs', () => {
  it('traverses welcome → … → reflection → history → welcome', () => {
    render(<ScreenRouter />);

    // Welcome → Mode 1 (startNewSession creates a draft + shared task_id).
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('welcome-start'));
    expect(screen.getByTestId('screen-mode1')).toBeInTheDocument();
    expect(useGameStore.getState().draft).not.toBeNull();
    const taskId = useGameStore.getState().draft!.task_id;

    // Mode 1 → the gently-puzzled "not quite right" beat → confirm → Feedback #1.
    fireEvent.click(screen.getByTestId('mode1-done'));
    fireEvent.click(screen.getByTestId('mode1-complete-continue'));
    const fb1 = screen.getByTestId('screen-feedback');
    expect(fb1).toHaveAttribute('data-mode', '1');

    // Rate stress + confidence → stored against mode 1.
    fireEvent.click(
      within(screen.getByTestId('feedback-stress')).getAllByRole('radio')[4],
    );
    fireEvent.click(
      within(screen.getByTestId('feedback-confidence')).getAllByRole(
        'radio',
      )[0],
    );
    expect(useGameStore.getState().draft!.mode_1_stress_level).toBe(10);
    expect(useGameStore.getState().draft!.mode_1_confidence_level).toBe(2);

    // Feedback #1 → Mode 2.
    fireEvent.click(screen.getByTestId('feedback-continue'));
    expect(screen.getByTestId('screen-mode2')).toBeInTheDocument();

    // Step through Mode 2's literal steps; the final step opens the completion
    // beat (Next is replaced), which we confirm to advance to Feedback #2.
    for (let i = 0; i < 15; i++) {
      if (screen.queryByTestId('mode2-next')) {
        fireEvent.click(screen.getByTestId('mode2-next'));
      }
    }
    fireEvent.click(screen.getByTestId('mode2-complete-continue'));
    const fb2 = screen.getByTestId('screen-feedback');
    expect(fb2).toHaveAttribute('data-mode', '2');

    // task_id is unchanged across the whole session (FR-20).
    expect(useGameStore.getState().draft!.task_id).toBe(taskId);

    // Rate + Continue → finalize → Reflection.
    fireEvent.click(
      within(screen.getByTestId('feedback-stress')).getAllByRole('radio')[0],
    );
    fireEvent.click(
      within(screen.getByTestId('feedback-confidence')).getAllByRole(
        'radio',
      )[4],
    );
    fireEvent.click(screen.getByTestId('feedback-continue'));

    expect(screen.getByTestId('screen-reflection')).toBeInTheDocument();
    const state = useGameStore.getState();
    expect(state.draft).toBeNull();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].mode_2_stress_level).toBe(2);
    expect(state.sessions[0].mode_2_confidence_level).toBe(10);

    // Reflection → History → back to Welcome.
    fireEvent.click(screen.getByTestId('reflection-history'));
    expect(screen.getByTestId('screen-history')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('history-list')).getAllByRole('listitem'),
    ).toHaveLength(1);

    fireEvent.click(screen.getByTestId('history-back'));
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
  });

  it('Mode 1 calm Exit returns to Welcome (FR-22)', () => {
    useGameStore.getState().startNewSession();
    render(<ScreenRouter />);
    expect(screen.getByTestId('screen-mode1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Exit'));
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
  });

  it('Welcome reduce-intensity toggle persists to the store (FR-22)', () => {
    render(<ScreenRouter />);
    fireEvent.click(screen.getByTestId('welcome-reduce-intensity'));
    expect(useGameStore.getState().reducedIntensity).toBe(true);
  });

  it('History delete-all wipes sessions and returns to Welcome (FR-15)', () => {
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    useGameStore.setState({ screen: 'history' });
    render(<ScreenRouter />);

    fireEvent.click(screen.getByTestId('history-delete-all'));
    expect(useGameStore.getState().sessions).toHaveLength(0);
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
  });
});
