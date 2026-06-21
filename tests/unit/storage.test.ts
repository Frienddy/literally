import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gameStorage, QUOTA_EXCEEDED_EVENT } from '../../src/store/storage';

const KEY = 'literally:test';
const value = { state: { sessions: [], reducedIntensity: false }, version: 1 };

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('guarded storage — happy path', () => {
  it('writes, reads back, and removes', () => {
    gameStorage.setItem(KEY, value);
    expect(gameStorage.getItem(KEY)).toEqual(value);

    gameStorage.removeItem(KEY);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(gameStorage.getItem(KEY)).toBeNull();
  });
});

describe('guarded storage — failure handling', () => {
  it('emits a recovery event and swallows a quota error', () => {
    const onQuota = vi.fn();
    window.addEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(() => gameStorage.setItem(KEY, value)).not.toThrow();
    expect(onQuota).toHaveBeenCalledTimes(1);
    window.removeEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
  });

  it('swallows non-quota write errors without emitting the event', () => {
    const onQuota = vi.fn();
    window.addEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private mode');
    });

    expect(() => gameStorage.setItem(KEY, value)).not.toThrow();
    expect(onQuota).not.toHaveBeenCalled();
    window.removeEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
  });

  it('returns null when a read throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(gameStorage.getItem(KEY)).toBeNull();
  });

  it('does not throw when a remove fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => gameStorage.removeItem(KEY)).not.toThrow();
  });
});
