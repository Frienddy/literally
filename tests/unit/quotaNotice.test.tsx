import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuotaNotice } from '../../src/components/QuotaNotice';
import { useGameStore } from '../../src/store/gameStore';
import { QUOTA_EXCEEDED_EVENT } from '../../src/store/storage';
import { strings } from '../../src/content/strings';
import type { GameSession } from '../../src/types/session';

const session = (id: string, startedAt: number): GameSession => ({
  id,
  schemaVersion: 1,
  task_id: 'droid',
  mode_1_drawing_data: null,
  mode_2_drawing_data: null,
  mode_1_stress_level: null,
  mode_2_stress_level: null,
  mode_1_confidence_level: null,
  mode_2_confidence_level: null,
  started_at: startedAt,
  completed_at: startedAt + 1,
});

const fireQuota = () =>
  act(() => {
    window.dispatchEvent(new CustomEvent(QUOTA_EXCEEDED_EVENT));
  });

beforeEach(() => {
  useGameStore.setState({
    screen: 'reflection',
    draft: null,
    sessions: [session('newer', 2), session('older', 1)],
    selectedSessionId: null,
  });
});

describe('QuotaNotice (PRD-002 R02-13 / _debt/002)', () => {
  it('stays hidden until the quota event fires', () => {
    render(<QuotaNotice />);
    expect(screen.queryByTestId('quota-notice')).toBeNull();

    fireQuota();
    expect(screen.getByTestId('quota-notice')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      strings.quota.title,
    );
  });

  it('"clear older sessions" frees space but keeps the newest, then dismisses', () => {
    render(<QuotaNotice />);
    fireQuota();

    fireEvent.click(screen.getByTestId('quota-clear'));

    const sessions = useGameStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('newer');
    expect(screen.queryByTestId('quota-notice')).toBeNull();
  });

  it('"not now" dismisses without touching the sessions', () => {
    render(<QuotaNotice />);
    fireQuota();

    fireEvent.click(screen.getByTestId('quota-dismiss'));
    expect(screen.queryByTestId('quota-notice')).toBeNull();
    expect(useGameStore.getState().sessions).toHaveLength(2);
  });
});
