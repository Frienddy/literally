import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Button } from '../../src/components/Button';
import { ProgressDots } from '../../src/components/ProgressDots';
import { FlowProgress } from '../../src/components/FlowProgress';
import { useGameStore } from '../../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState({
    screen: 'welcome',
    draft: null,
    sessions: [],
  });
});

describe('Button', () => {
  it('renders each variant with a ≥44pt touch target', () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    // 44pt min target (R04-8): min-h/min-w map to the `touch` spacing token.
    expect(btn.className).toContain('min-h-touch');
    expect(btn.className).toContain('min-w-touch');
    expect(btn.className).toContain('bg-primary');
    expect(btn).toHaveAttribute('type', 'button');

    rerender(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole('button').className).toContain('bg-surface');

    rerender(<Button variant="ghost">Go</Button>);
    expect(screen.getByRole('button').className).toContain('bg-transparent');
  });
});

describe('ProgressDots', () => {
  it('fills dots up to and including the current index', () => {
    const { container } = render(<ProgressDots total={5} current={2} />);
    const dots = container.querySelectorAll('span[aria-hidden]');
    expect(dots).toHaveLength(5);
    // classList.contains is exact-token: it won't match unfilled `bg-textMuted/40`.
    const filled = Array.from(dots).filter((d) =>
      d.classList.contains('bg-text'),
    );
    expect(filled).toHaveLength(3); // indices 0,1,2
  });
});

describe('FlowProgress', () => {
  it('reflects the active screen as a step of 5', () => {
    useGameStore.setState({ screen: 'mode1' });
    const { rerender } = render(<FlowProgress />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Progress: step 1 of 5',
    );

    act(() => useGameStore.setState({ screen: 'mode2' }));
    rerender(<FlowProgress />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Progress: step 3 of 5',
    );
  });

  it('shows no filled step on Welcome (the pre-roll)', () => {
    useGameStore.setState({ screen: 'welcome' });
    const { container } = render(<FlowProgress />);
    const filled = Array.from(
      container.querySelectorAll('span[aria-hidden]'),
    ).filter((d) => d.classList.contains('bg-text'));
    expect(filled).toHaveLength(0);
  });
});
