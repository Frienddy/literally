import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptics } from '../../src/hooks/useHaptics';

describe('useHaptics (PRD-003 R03-15, ADR-003)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('no-ops where navigator.vibrate is unsupported (e.g. iOS Safari)', () => {
    // jsdom provides no vibrate.
    const { result } = renderHook(() => useHaptics());
    expect(result.current.supported).toBe(false);
    expect(() => result.current.vibrate('snap')).not.toThrow();
  });

  it('fires a crisp click on snap', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const { result } = renderHook(() => useHaptics());

    expect(result.current.supported).toBe(true);
    result.current.vibrate('snap');
    expect(vibrate).toHaveBeenCalledWith(15);
  });
});
