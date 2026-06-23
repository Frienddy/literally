import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { ScreenRouter } from '../../src/app/ScreenRouter';
import { useGameStore } from '../../src/store/gameStore';
import {
  TRANSITIONS,
  FLOW_STEPS,
  nextScreen,
  flowStepIndex,
} from '../../src/app/routes';
import { TASK_CONTENT } from '../../src/content/tasks';

const reset = () =>
  useGameStore.setState({
    screen: 'welcome',
    draft: null,
    sessions: [],
    selectedSessionId: null,
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

    // Mode 2's pixel canvas needs real layout geometry to commit filled cells
    // (filling a square is what advances the step now — ADR-015), which jsdom
    // can't provide: with no canvas measurement there's no grid and nothing to
    // paint. That screen-level wiring is covered by tests/e2e/mode2.spec.ts; here
    // we drive the store through the transition the completed screen performs, to
    // keep walking the FSM into Feedback #2.
    act(() => {
      const store = useGameStore.getState();
      store.saveMode2Drawing({
        kind: 'pixel',
        cells: [],
        grid: { cols: 8, rows: 10 },
      });
      store.go('stress2');
    });
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

  it('Welcome → Examples shows every task drawing, and Back returns', () => {
    render(<ScreenRouter />);

    fireEvent.click(screen.getByTestId('welcome-examples'));
    expect(screen.getByTestId('screen-examples')).toBeInTheDocument();
    // One tile per authored task in the pool.
    expect(
      within(screen.getByTestId('examples-list')).getAllByRole('listitem'),
    ).toHaveLength(Object.keys(TASK_CONTENT).length);

    fireEvent.click(screen.getByTestId('examples-back'));
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
  });

  it('Mode 1 calm Exit returns to Welcome (FR-22)', () => {
    useGameStore.getState().startNewSession();
    render(<ScreenRouter />);
    expect(screen.getByTestId('screen-mode1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Exit'));
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
  });

  it('History delete-all needs a confirm, then wipes + returns to Welcome (FR-15)', () => {
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    useGameStore.setState({ screen: 'history' });
    render(<ScreenRouter />);

    // First tap only arms the confirm — nothing is deleted yet (R08-10).
    fireEvent.click(screen.getByTestId('history-delete-all'));
    expect(useGameStore.getState().sessions).toHaveLength(1);

    // Cancel backs out without deleting.
    fireEvent.click(screen.getByTestId('history-delete-cancel'));
    expect(useGameStore.getState().sessions).toHaveLength(1);

    // Confirm wipes everything and lands on Welcome.
    fireEvent.click(screen.getByTestId('history-delete-all'));
    fireEvent.click(screen.getByTestId('history-delete-confirm'));
    expect(useGameStore.getState().sessions).toHaveLength(0);
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument();
  });

  it('History opens the tapped session in Reflection (R08-11)', () => {
    // Two finalized sessions; the older one is sessions[1].
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    const older = useGameStore.getState().sessions[1].id;

    useGameStore.setState({ screen: 'history' });
    render(<ScreenRouter />);

    const rows = within(screen.getByTestId('history-list')).getAllByRole(
      'listitem',
    );
    fireEvent.click(within(rows[1]).getByRole('button')); // the older row
    expect(useGameStore.getState().selectedSessionId).toBe(older);
    expect(screen.getByTestId('screen-reflection')).toBeInTheDocument();
  });
});
