/**
 * A small slide-in card used for Mode 1's *fake* notifications (the distraction
 * layer) and any transient toast (PRD-004 R04-8, _docs/06 §3.2). Presentational
 * only — the jittered cadence + auto-dismiss that make Mode 1 stressful live in
 * PRD-005; this component just renders one and animates its presence.
 *
 * NOTE: the placeholder emoji glyph is replaced by the custom icon set in PRD-009
 * (_docs/06 §5 — platform emoji render inconsistently).
 */
import type { ReactNode } from 'react';

export interface NotificationProps {
  title: string;
  body?: string;
  icon?: ReactNode;
  /** Controls the slide/fade in-out; defaults to visible. */
  visible?: boolean;
  className?: string;
}

export function Notification({
  title,
  body,
  icon = '💬',
  visible = true,
  className = '',
}: NotificationProps) {
  return (
    <div
      role="status"
      aria-hidden={!visible}
      className={[
        'pointer-events-none flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-lg',
        'transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
        className,
      ].join(' ')}
    >
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-text">{title}</div>
        {body && <div className="truncate text-xs text-textMuted">{body}</div>}
      </div>
    </div>
  );
}
