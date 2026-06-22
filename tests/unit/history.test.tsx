import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HistoryScreen } from '../../src/screens/history/HistoryScreen';
import { useGameStore } from '../../src/store/gameStore';
import type { GameSession } from '../../src/types/session';

const session = (
  id: string,
  startedAt: number,
  m1: number,
  m2: number,
): GameSession => ({
  id,
  schemaVersion: 1,
  task_id: 'droid',
  mode_1_drawing_data: null,
  mode_2_drawing_data: null,
  mode_1_stress_level: m1,
  mode_2_stress_level: m2,
  mode_1_confidence_level: null,
  mode_2_confidence_level: null,
  started_at: startedAt,
  completed_at: startedAt + 1,
});

beforeEach(() => {
  useGameStore.setState({
    screen: 'history',
    draft: null,
    // Store keeps sessions newest-first; mirror that here.
    sessions: [
      session('newer', Date.parse('2026-06-21'), 8, 2),
      session('older', Date.parse('2026-06-18'), 6, 3),
    ],
    selectedSessionId: null,
  });
});

describe('HistoryScreen (PRD-008 R08-9/R08-11)', () => {
  it('lists sessions newest-first with their stress arc', () => {
    render(<HistoryScreen />);
    const rows = within(screen.getByTestId('history-list')).getAllByRole(
      'listitem',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toMatch(/8 → 2/); // newest first
    expect(rows[1].textContent).toMatch(/6 → 3/);
  });

  it('tapping a row opens that exact session (R08-11)', () => {
    render(<HistoryScreen />);
    const rows = within(screen.getByTestId('history-list')).getAllByRole(
      'listitem',
    );
    fireEvent.click(within(rows[1]).getByRole('button'));
    expect(useGameStore.getState().selectedSessionId).toBe('older');
    expect(useGameStore.getState().screen).toBe('reflection');
  });

  it('shows the empty state and no delete control when there are no sessions', () => {
    useGameStore.setState({ sessions: [] });
    render(<HistoryScreen />);
    expect(screen.getByText('No past sessions yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('history-delete-all')).toBeNull();
  });
});
