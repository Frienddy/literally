import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FakeNotifications } from '../../src/components/FakeNotifications';
import { config } from '../../src/config';
import type { FakeNotification } from '../../src/content/mode1';

/**
 * The distraction layer must appear on a jittered cadence and **always
 * auto-dismiss** — never trapping input (PRD-005 R05-4). Reduced intensity makes
 * the toasts fewer + slower (R05-11).
 */
const ITEMS: FakeNotification[] = [
  { icon: '💬', title: 'New message', body: 'Tap to reply' },
  { icon: '🔋', title: 'Battery 20%' },
];

beforeEach(() => {
  vi.useFakeTimers();
  // Deterministic jitter for the inter-toast gap.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('FakeNotifications', () => {
  it('shows the first toast after the start delay, then auto-dismisses it', () => {
    render(<FakeNotifications items={ITEMS} />);

    // Nothing before the first-delay window.
    expect(screen.queryByText('New message')).toBeNull();

    act(() => vi.advanceTimersByTime(config.notifications.firstDelayMs + 50));
    expect(screen.getByText('New message')).toBeInTheDocument();

    // It leaves on its own — no tap required (auto-dismiss guarantee).
    act(() => vi.advanceTimersByTime(config.notifications.visibleMs + 400));
    expect(screen.queryByText('New message')).toBeNull();
  });

  it('cycles to the next toast after the jittered gap', () => {
    render(<FakeNotifications items={ITEMS} />);
    act(() => vi.advanceTimersByTime(config.notifications.firstDelayMs + 50));
    expect(screen.getByText('New message')).toBeInTheDocument();

    // Dismiss the first, then wait out the (jittered) gap → the second appears.
    act(() => vi.advanceTimersByTime(config.notifications.visibleMs + 400));
    const [, maxGap] = config.notifications.gapMs;
    act(() => vi.advanceTimersByTime(maxGap + 100));
    expect(screen.getByText('Battery 20%')).toBeInTheDocument();
  });

  it('is non-interactive: a pointer-events-none rail with no controls', () => {
    const { container } = render(<FakeNotifications items={ITEMS} />);
    act(() => vi.advanceTimersByTime(config.notifications.firstDelayMs + 50));
    const rail = container.firstChild as HTMLElement;
    expect(rail.className).toContain('pointer-events-none');
    // Tapping a fake notification does nothing — there are no buttons/links.
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('does not schedule anything while inactive (paused for the beat)', () => {
    render(<FakeNotifications items={ITEMS} active={false} />);
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.queryByText('New message')).toBeNull();
  });

  it('reduced intensity widens to a slower gap window (R05-11)', () => {
    const [fullMin] = config.notifications.gapMs;
    const [redMin] = config.notifications.reducedGapMs;
    expect(redMin).toBeGreaterThan(fullMin);
  });
});
