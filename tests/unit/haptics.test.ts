import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useGameStore } from '../../src/store/gameStore';

describe('useHaptics (PRD-003 R03-15, ADR-003)', () => {
  beforeEach(() => useGameStore.setState({ reducedIntensity: false }));
  afterEach(() => {
    vi.unstubAllGlobals();
    useGameStore.setState({ reducedIntensity: false });
  });

  it('no-ops where navigator.vibrate is unsupported (e.g. iOS Safari)', () => {
    // jsdom provides no vibrate.
    const { result } = renderHook(() => useHaptics());
    expect(result.current.supported).toBe(false);
    expect(() => {
      result.current.vibrate('snap');
      result.current.vibrate('move');
    }).not.toThrow();
  });

  it('fires the erratic pattern on move and a crisp click on snap', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const { result } = renderHook(() => useHaptics());

    expect(result.current.supported).toBe(true);
    result.current.vibrate('move');
    expect(vibrate).toHaveBeenCalledWith([10, 30, 15, 40]);
    result.current.vibrate('snap');
    expect(vibrate).toHaveBeenCalledWith(15);
  });

  it('reduced intensity suppresses the erratic buzz and softens the click', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    useGameStore.setState({ reducedIntensity: true });
    const { result } = renderHook(() => useHaptics());

    result.current.vibrate('move'); // suppressed entirely
    expect(vibrate).not.toHaveBeenCalled();

    result.current.vibrate('snap'); // softened click
    expect(vibrate).toHaveBeenCalledWith(8);
  });
});
