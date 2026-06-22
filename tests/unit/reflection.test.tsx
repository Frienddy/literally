import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReflectionScreen } from '../../src/screens/reflection/ReflectionScreen';
import { useGameStore } from '../../src/store/gameStore';
import { resolveTask } from '../../src/content/tasks';
import type { GameSession } from '../../src/types/session';

const seeded: GameSession = {
  id: 's1',
  schemaVersion: 2,
  task_id: 'droid',
  mode_1_drawing_data: {
    kind: 'grid',
    segments: [{ from: { col: 1, row: 1 }, to: { col: 3, row: 5 } }],
    grid: { cols: 8, rows: 10 },
  },
  mode_2_drawing_data: {
    kind: 'grid',
    segments: [{ from: { col: 0, row: 0 }, to: { col: 0, row: 4 } }],
    grid: { cols: 8, rows: 10 },
  },
  mode_1_stress_level: 7,
  mode_2_stress_level: 2,
  mode_1_confidence_level: 3,
  mode_2_confidence_level: 9,
  started_at: 1,
  completed_at: 2,
};

beforeEach(() => {
  useGameStore.setState({
    screen: 'reflection',
    draft: null,
    sessions: [seeded],
    selectedSessionId: null,
  });
});

describe('ReflectionScreen (PRD-008)', () => {
  it('reveals the target and renders both attempts with a11y summaries', () => {
    render(<ReflectionScreen />);
    const label = resolveTask('droid').label;

    // The hidden target, revealed (R08-3).
    expect(screen.getByTestId('target-reveal')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: `The intended ${label}.` }),
    ).toBeInTheDocument();

    // Both attempts, labelled for screen readers (R08-2).
    expect(
      screen.getByRole('img', {
        name: `Your drawing of ${label}, made without clear steps.`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Your drawing of ${label}, made with clear steps.`,
      }),
    ).toBeInTheDocument();
  });

  it('shows both stress and confidence deltas (R08-6)', () => {
    render(<ReflectionScreen />);
    const deltas = screen.getByTestId('reflection-deltas');
    expect(deltas).toHaveTextContent('Stress 7 → 2');
    expect(deltas).toHaveTextContent('Sure? 3 → 9');
  });

  it('the reveal names autism and carries the disclaimers (R08-5/R08-7)', () => {
    render(<ReflectionScreen />);
    const debrief = screen.getByTestId('reflection-debrief');
    expect(debrief.textContent ?? '').toMatch(/autis/i);
    expect(debrief.textContent ?? '').toMatch(/not a (diagnosis|test)/i);
  });

  it('Play again → Welcome, View past sessions → History (R08-8)', () => {
    render(<ReflectionScreen />);
    fireEvent.click(screen.getByTestId('reflection-history'));
    expect(useGameStore.getState().screen).toBe('history');

    useGameStore.setState({ screen: 'reflection' });
    fireEvent.click(screen.getByTestId('reflection-play-again'));
    expect(useGameStore.getState().screen).toBe('welcome');
  });

  it('falls back gracefully when there is no session', () => {
    useGameStore.setState({ sessions: [], selectedSessionId: null });
    render(<ReflectionScreen />);
    expect(screen.getByTestId('screen-reflection')).toBeInTheDocument();
    expect(screen.getByTestId('reflection-play-again')).toBeInTheDocument();
  });
});
