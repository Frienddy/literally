import { describe, it, expect } from 'vitest';
import { migrate, SCHEMA_VERSION } from '../../src/store/migrations';

describe('migrate', () => {
  it('passes a well-formed persisted blob through unchanged', () => {
    const good = { sessions: [] };
    expect(migrate(good, SCHEMA_VERSION)).toBe(good);
  });

  it('falls back to empty state for unknown / corrupt input (never throws)', () => {
    for (const bad of [
      undefined,
      null,
      'a string',
      42,
      {},
      { sessions: 'nope' },
      [],
    ]) {
      expect(() => migrate(bad, 0)).not.toThrow();
      expect(migrate(bad, 0)).toEqual({ sessions: [] });
    }
  });

  it('falls back to empty state if shape inspection itself throws', () => {
    const evil = {};
    Object.defineProperty(evil, 'sessions', {
      get() {
        throw new Error('boom');
      },
    });
    expect(() => migrate(evil, 0)).not.toThrow();
    expect(migrate(evil, 0)).toEqual({ sessions: [] });
  });

  it('SCHEMA_VERSION is a positive integer', () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('v1 → v3: drops incompatible line drawings (freehand + grid), keeps scores', () => {
    // Pre-pixel line drawings: a v1 freehand payload and a v2 grid-segment payload.
    // Neither can re-render as filled cells, so v3 nulls them on both attempts.
    const segments = {
      kind: 'grid',
      segments: [{ from: { col: 0, row: 0 }, to: { col: 0, row: 4 } }],
      grid: { cols: 8, rows: 10 },
    };
    const v1 = {
      sessions: [
        {
          id: 'legacy',
          schemaVersion: 1,
          task_id: 'house',
          mode_1_drawing_data: {
            kind: 'freehand',
            strokes: [],
            canvas: { width: 1, height: 1 },
          },
          mode_2_drawing_data: segments,
          mode_1_stress_level: 5,
          mode_2_stress_level: 2,
          mode_1_confidence_level: 3,
          mode_2_confidence_level: 9,
          started_at: 1,
          completed_at: 2,
        },
      ],
    };

    const out = migrate(v1, 1);
    // Both incompatible line drawings dropped; scores survive so the session
    // still reads on Reflection / History.
    expect(out.sessions[0].mode_1_drawing_data).toBeNull();
    expect(out.sessions[0].mode_2_drawing_data).toBeNull();
    expect(out.sessions[0].mode_1_stress_level).toBe(5);
    expect(out.sessions[0].mode_2_confidence_level).toBe(9);
  });

  it('v2 → v3: keeps pixel drawings, drops grid-segment drawings', () => {
    const pixel = {
      kind: 'pixel',
      cells: [{ col: 1, row: 1, color: '#ef4444' }],
      grid: { cols: 8, rows: 10 },
    };
    const segments = {
      kind: 'grid',
      segments: [{ from: { col: 0, row: 0 }, to: { col: 1, row: 1 } }],
      grid: { cols: 8, rows: 10 },
    };
    const v2 = {
      sessions: [
        {
          id: 'mixed',
          schemaVersion: 2,
          task_id: 'droid',
          mode_1_drawing_data: pixel,
          mode_2_drawing_data: segments,
          mode_1_stress_level: 4,
          mode_2_stress_level: 1,
          mode_1_confidence_level: 2,
          mode_2_confidence_level: 8,
          started_at: 1,
          completed_at: 2,
        },
      ],
    };

    const out = migrate(v2, 2);
    expect(out.sessions[0].mode_1_drawing_data).toEqual(pixel); // already pixel
    expect(out.sessions[0].mode_2_drawing_data).toBeNull(); // line drawing dropped
    expect(out.sessions[0].mode_1_stress_level).toBe(4);
  });
});
