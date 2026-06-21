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
});
