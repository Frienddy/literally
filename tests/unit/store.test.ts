import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore, TASKS, type Screen } from '../../src/store/gameStore';
import type { FreehandDrawing, GridDrawing } from '../../src/types/session';

const fakeFreehand: FreehandDrawing = {
  kind: 'freehand',
  strokes: [{ points: [{ x: 1, y: 2 }], width: 3 }],
  canvas: { width: 360, height: 520 },
};

const fakeGrid: GridDrawing = {
  kind: 'grid',
  segments: [{ from: { col: 0, row: 0 }, to: { col: 1, row: 1 } }],
  grid: { cols: 8, rows: 10 },
};

const reset = () =>
  useGameStore.setState({
    screen: 'welcome' as Screen,
    draft: null,
    sessions: [],
    reducedIntensity: false,
  });

beforeEach(() => {
  reset();
  localStorage.clear();
});

describe('lifecycle', () => {
  it('produces a complete GameSession in sessions[0] after a full play', () => {
    const s = useGameStore.getState();
    s.startNewSession();
    expect(useGameStore.getState().screen).toBe('mode1');

    useGameStore.getState().saveMode1Drawing(fakeFreehand);
    useGameStore.getState().setStress(1, 7);
    useGameStore.getState().setConfidence(1, 3);
    useGameStore.getState().saveMode2Drawing(fakeGrid);
    useGameStore.getState().setStress(2, 2);
    useGameStore.getState().setConfidence(2, 9);
    useGameStore.getState().finalizeSession();

    const state = useGameStore.getState();
    expect(state.draft).toBeNull();
    expect(state.screen).toBe('reflection');
    expect(state.sessions).toHaveLength(1);

    const session = state.sessions[0];
    expect(session.mode_1_drawing_data).toEqual(fakeFreehand);
    expect(session.mode_2_drawing_data).toEqual(fakeGrid);
    expect(session.mode_1_stress_level).toBe(7);
    expect(session.mode_2_stress_level).toBe(2);
    expect(session.mode_1_confidence_level).toBe(3);
    expect(session.mode_2_confidence_level).toBe(9);
    expect(typeof session.started_at).toBe('number');
    expect(typeof session.completed_at).toBe('number');
    expect(session.id).toBeTruthy();
    expect(session.schemaVersion).toBe(1);
  });

  it('newest session goes to the front of the list', () => {
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    const firstId = useGameStore.getState().sessions[0].id;

    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();

    const ids = useGameStore.getState().sessions.map((s) => s.id);
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(firstId); // older session is now second
  });

  it('drawing/stress/confidence setters no-op without a draft', () => {
    useGameStore.getState().saveMode1Drawing(fakeFreehand);
    useGameStore.getState().setStress(1, 5);
    useGameStore.getState().setConfidence(2, 5);
    useGameStore.getState().finalizeSession();
    expect(useGameStore.getState().draft).toBeNull();
    expect(useGameStore.getState().sessions).toHaveLength(0);
  });
});

describe('task pool', () => {
  it('assigns a task_id from the pool and shares it across the session', () => {
    useGameStore.getState().startNewSession();
    const draftTask = useGameStore.getState().draft!.task_id;
    expect(TASKS).toContain(draftTask);

    // task_id must not be reassigned by any mid-session action.
    useGameStore.getState().saveMode1Drawing(fakeFreehand);
    useGameStore.getState().saveMode2Drawing(fakeGrid);
    expect(useGameStore.getState().draft!.task_id).toBe(draftTask);

    useGameStore.getState().finalizeSession();
    expect(useGameStore.getState().sessions[0].task_id).toBe(draftTask);
  });
});

describe('clamping (stress & confidence share the 1–10 clamp)', () => {
  beforeEach(() => useGameStore.getState().startNewSession());

  it('clamps low / high / fractional values', () => {
    const d = () => useGameStore.getState().draft!;

    useGameStore.getState().setStress(1, 0);
    expect(d().mode_1_stress_level).toBe(1);

    useGameStore.getState().setStress(1, 99);
    expect(d().mode_1_stress_level).toBe(10);

    useGameStore.getState().setStress(1, 7.4);
    expect(d().mode_1_stress_level).toBe(7);

    useGameStore.getState().setConfidence(2, 0);
    expect(d().mode_2_confidence_level).toBe(1);

    useGameStore.getState().setConfidence(2, 99);
    expect(d().mode_2_confidence_level).toBe(10);

    useGameStore.getState().setConfidence(2, 7.4);
    expect(d().mode_2_confidence_level).toBe(7);
  });
});

describe('navigation FSM', () => {
  it('go() sets the active screen', () => {
    useGameStore.getState().go('history');
    expect(useGameStore.getState().screen).toBe('history');
  });
});

describe('history & privacy', () => {
  it('deleteSession removes only the matching session', () => {
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();

    const [a] = useGameStore.getState().sessions;
    useGameStore.getState().deleteSession(a.id);
    const remaining = useGameStore.getState().sessions;
    expect(remaining).toHaveLength(1);
    expect(remaining.find((s) => s.id === a.id)).toBeUndefined();
  });

  it('clearAllData wipes sessions + draft and returns to Welcome', () => {
    useGameStore.getState().startNewSession();
    useGameStore.getState().finalizeSession();
    useGameStore.getState().setReducedIntensity(true);

    useGameStore.getState().clearAllData();
    const state = useGameStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.draft).toBeNull();
    expect(state.screen).toBe('welcome');

    // The persisted blob no longer carries any session.
    const blob = JSON.parse(localStorage.getItem('literally:game') ?? '{}');
    expect(blob.state.sessions).toEqual([]);
  });

  it('setReducedIntensity toggles the flag', () => {
    useGameStore.getState().setReducedIntensity(true);
    expect(useGameStore.getState().reducedIntensity).toBe(true);
  });
});

describe('persistence (partialize)', () => {
  it('persists only sessions + reducedIntensity, never screen/draft', () => {
    useGameStore.getState().startNewSession(); // sets screen=mode1 + a draft
    useGameStore.getState().setReducedIntensity(true);

    const blob = JSON.parse(localStorage.getItem('literally:game') ?? '{}');
    expect(Object.keys(blob.state).sort()).toEqual([
      'reducedIntensity',
      'sessions',
    ]);
    expect(blob.state).not.toHaveProperty('screen');
    expect(blob.state).not.toHaveProperty('draft');
  });

  it('rehydrates persisted data and still lands on Welcome', async () => {
    const session = {
      id: 'seed-1',
      schemaVersion: 1,
      task_id: 'house',
      mode_1_drawing_data: null,
      mode_2_drawing_data: null,
      mode_1_stress_level: null,
      mode_2_stress_level: null,
      mode_1_confidence_level: null,
      mode_2_confidence_level: null,
      started_at: 1,
      completed_at: 2,
    };
    localStorage.setItem(
      'literally:game',
      JSON.stringify({
        state: { sessions: [session], reducedIntensity: true },
        version: 1,
      }),
    );

    await useGameStore.persist.rehydrate();

    const state = useGameStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe('seed-1');
    expect(state.reducedIntensity).toBe(true);
    expect(state.screen).toBe('welcome'); // screen is never restored
  });

  it('falls back to empty state on a corrupt persisted blob (never throws)', async () => {
    localStorage.setItem(
      'literally:game',
      JSON.stringify({ state: 'totally-not-valid', version: 0 }),
    );

    await expect(useGameStore.persist.rehydrate()).resolves.not.toThrow();
    expect(useGameStore.getState().sessions).toEqual([]);
  });
});

describe('quota guard', () => {
  it('does not throw and signals when a write hits the quota', async () => {
    const { gameStorage, QUOTA_EXCEEDED_EVENT } =
      await import('../../src/store/storage');
    const onQuota = vi.fn();
    window.addEventListener(QUOTA_EXCEEDED_EVENT, onQuota);

    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });

    expect(() =>
      gameStorage.setItem('literally:game', {
        state: { sessions: [], reducedIntensity: false },
        version: 1,
      }),
    ).not.toThrow();
    expect(onQuota).toHaveBeenCalledTimes(1);

    spy.mockRestore();
    window.removeEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
  });
});
