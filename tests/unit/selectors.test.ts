import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useScreen,
  useDraft,
  useLatestSession,
  useSessions,
  useReflectionSession,
  useReducedIntensity,
} from '../../src/store/selectors';
import { useGameStore } from '../../src/store/gameStore';
import type { GameSession } from '../../src/types/session';

const session = (id: string): GameSession => ({
  id,
  schemaVersion: 1,
  task_id: 'alien',
  mode_1_drawing_data: null,
  mode_2_drawing_data: null,
  mode_1_stress_level: null,
  mode_2_stress_level: null,
  mode_1_confidence_level: null,
  mode_2_confidence_level: null,
  started_at: 1,
  completed_at: 2,
});

beforeEach(() => {
  useGameStore.setState({
    screen: 'history',
    draft: session('draft'),
    sessions: [session('a'), session('b')],
    selectedSessionId: null,
    reducedIntensity: true,
  });
});

describe('selectors', () => {
  it('read their narrow slices', () => {
    expect(renderHook(() => useScreen()).result.current).toBe('history');
    expect(renderHook(() => useDraft()).result.current?.id).toBe('draft');
    expect(renderHook(() => useLatestSession()).result.current?.id).toBe('a');
    expect(renderHook(() => useSessions()).result.current).toHaveLength(2);
    expect(renderHook(() => useReducedIntensity()).result.current).toBe(true);
  });

  it('useLatestSession returns null when there are no sessions', () => {
    useGameStore.setState({ sessions: [] });
    expect(renderHook(() => useLatestSession()).result.current).toBeNull();
  });

  it('useReflectionSession follows the selection, else the latest', () => {
    // No selection → the newest session (sessions[0]).
    expect(renderHook(() => useReflectionSession()).result.current?.id).toBe(
      'a',
    );

    // An explicit selection wins, even when it is not the newest.
    useGameStore.setState({ selectedSessionId: 'b' });
    expect(renderHook(() => useReflectionSession()).result.current?.id).toBe(
      'b',
    );

    // A stale/missing id falls back to null (never throws).
    useGameStore.setState({ selectedSessionId: 'gone' });
    expect(renderHook(() => useReflectionSession()).result.current).toBeNull();
  });
});
