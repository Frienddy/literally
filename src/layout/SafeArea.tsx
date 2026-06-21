import type { CSSProperties, ReactNode } from 'react';

type Edge = 'top' | 'bottom' | 'left' | 'right';

const INSET: Record<Edge, string> = {
  top: 'env(safe-area-inset-top)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
  right: 'env(safe-area-inset-right)',
};

/**
 * Pads its children by the device safe-area insets (notch / home indicator).
 * `AppShell` already pads the outer frame; use this inside screens that need to
 * re-assert an inset (e.g. a full-bleed canvas with a pinned toolbar).
 */
export function SafeArea({
  edges = ['top', 'bottom', 'left', 'right'],
  className,
  children,
}: {
  edges?: Edge[];
  className?: string;
  children: ReactNode;
}) {
  const style: CSSProperties = {};
  if (edges.includes('top')) style.paddingTop = INSET.top;
  if (edges.includes('bottom')) style.paddingBottom = INSET.bottom;
  if (edges.includes('left')) style.paddingLeft = INSET.left;
  if (edges.includes('right')) style.paddingRight = INSET.right;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
