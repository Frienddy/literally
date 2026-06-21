/**
 * Mode 1's fake-notification distraction layer (PRD-005 R05-4, GDD §3.4, _docs/06
 * §3.2). Mundane push toasts slide in from the top on a jittered ~4–8s cadence and
 * auto-dismiss after a couple of seconds, breaking focus the way a buzzing phone
 * does. They are the orchestration around the presentational `Notification`
 * component (PRD-004).
 *
 * Safety rails (R05-4): the toasts are **non-interactive** (`pointer-events-none`,
 * no handlers — tapping does nothing), they never cover the whole canvas, and they
 * always auto-dismiss (no toast can trap input). Reduced-intensity (R05-11) makes
 * them *fewer and slower* and the screen keeps them out of the canvas by placing
 * this rail above the drawing area.
 *
 * Timing is `setTimeout`-only (no rAF) so the cadence is deterministic under fake
 * timers; the slide in/out is a plain class toggle (the global reduced-motion rule
 * collapses it to instant, which is fine — appearing/dismissing still distracts).
 */
import { useEffect, useState } from 'react';
import { Notification } from './Notification';
import { config } from '../config';
import type { FakeNotification } from '../content/notifications';

/** ms to keep a toast mounted after it starts leaving, so the exit can animate. */
const EXIT_MS = 320;
/** ms after mount before flipping to the "shown" (slid-in) state. */
const ENTER_MS = 20;

export interface FakeNotificationsProps {
  items: readonly FakeNotification[];
  /** Sensory-safety softening: fewer + slower toasts (R05-11). */
  reduced?: boolean;
  /** Pause scheduling (e.g. once the completion beat is playing). */
  active?: boolean;
  className?: string;
}

export function FakeNotifications({
  items,
  reduced = false,
  active = true,
  className = '',
}: FakeNotificationsProps) {
  // Which item is mounted (null = none) and whether it is slid-in (shown).
  const [index, setIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active || items.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    // Reduced-intensity widens the gap window → fewer + slower toasts (R05-11).
    const [minGap, maxGap] = reduced
      ? config.notifications.reducedGapMs
      : config.notifications.gapMs;
    const jitter = () => minGap + Math.random() * (maxGap - minGap);
    let cursor = 0;

    const showNext = () => {
      const i = cursor % items.length;
      cursor += 1;
      setIndex(i);
      setShown(false);
      at(() => setShown(true), ENTER_MS); // slide in
      at(() => setShown(false), config.notifications.visibleMs); // start exit
      at(() => {
        setIndex(null); // unmount, then schedule the next on a jittered gap
        at(showNext, jitter());
      }, config.notifications.visibleMs + EXIT_MS);
    };

    at(showNext, config.notifications.firstDelayMs);
    return () => timers.forEach(clearTimeout);
  }, [active, reduced, items]);

  const item = index == null ? null : items[index];

  return (
    <div
      aria-hidden
      className={['pointer-events-none z-20', className].join(' ')}
    >
      {item && (
        <Notification
          title={item.title}
          body={item.body}
          icon={item.icon}
          visible={shown}
        />
      )}
    </div>
  );
}
