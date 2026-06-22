import { describe, it, expect } from 'vitest';
import { migrate, SCHEMA_VERSION } from '../../src/store/migrations';

describe('migrate', () => {
  it('passes a well-formed persisted blob through unchanged', () => {
    const good = { sessions: [], reducedIntensity: true };
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
      { sessions: [], reducedIntensity: 'yes' },
      [],
    ]) {
      expect(() => migrate(bad, 0)).not.toThrow();
      expect(migrate(bad, 0)).toEqual({
        sessions: [],
        reducedIntensity: false,
      });
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
    expect(migrate(evil, 0)).toEqual({ sessions: [], reducedIntensity: false });
  });

  it('SCHEMA_VERSION is a positive integer', () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('v1 → v2 (ADR-015): drops a freehand Mode 1 payload, keeps grid + scores', () => {
    const grid = { kind: 'grid', segments: [], grid: { cols: 8, rows: 10 } };
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
          mode_2_drawing_data: grid,
          mode_1_stress_level: 5,
          mode_2_stress_level: 2,
          mode_1_confidence_level: 3,
          mode_2_confidence_level: 9,
          started_at: 1,
          completed_at: 2,
        },
        {
          id: 'fresh',
          schemaVersion: 2,
          task_id: 'cat',
          mode_1_drawing_data: grid,
          mode_2_drawing_data: grid,
          mode_1_stress_level: null,
          mode_2_stress_level: null,
          mode_1_confidence_level: null,
          mode_2_confidence_level: null,
          started_at: 3,
          completed_at: 4,
        },
      ],
      reducedIntensity: false,
    };

    const out = migrate(v1, 1);
    // legacy freehand Mode 1 → null; everything else survives.
    expect(out.sessions[0].mode_1_drawing_data).toBeNull();
    expect(out.sessions[0].mode_2_drawing_data).toEqual(grid);
    expect(out.sessions[0].mode_1_stress_level).toBe(5);
    // a session that already stored a grid Mode 1 is left untouched.
    expect(out.sessions[1].mode_1_drawing_data).toEqual(grid);
  });
});
