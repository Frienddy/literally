import { describe, it, expect, afterEach, vi } from 'vitest';
import { uuid } from '../../src/lib/id';
import { now } from '../../src/lib/time';

const V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuid', () => {
  it('returns a v4-shaped, unique id', () => {
    const a = uuid();
    const b = uuid();
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(a).not.toBe(b);
  });

  it('stays unique across many calls', () => {
    const set = new Set(Array.from({ length: 1000 }, () => uuid()));
    expect(set.size).toBe(1000);
  });
});

describe('uuid fallbacks (R02-11 — works where crypto.randomUUID is missing)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the getRandomValues path when randomUUID is absent', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = (i * 37 + 11) & 0xff;
        return arr;
      },
    });
    expect(uuid()).toMatch(V4);
  });

  it('uses the non-crypto fallback when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(uuid()).toMatch(V4);
  });
});

describe('now', () => {
  it('returns a millisecond timestamp', () => {
    const t = now();
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThan(0);
  });
});
