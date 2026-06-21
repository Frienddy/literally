/**
 * Reads the `prefers-reduced-motion` user setting (sensory safety, PRD-005 R05-12 /
 * _docs/07 §3). The global CSS rule (index.css) already collapses CSS *transitions*
 * to instant; this hook lets JS-driven motion (e.g. Mode 1's drift) opt out too,
 * so reduced-motion gets no parallax/drift while still allowing a gentle opacity
 * fade.
 *
 * Guarded for jsdom/SSR where `matchMedia` is absent — defaults to "no preference"
 * (false) so tests and old engines never throw.
 */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function readPreference(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readPreference);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    // addEventListener is the modern API; older Safari only has addListener.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return reduced;
}
