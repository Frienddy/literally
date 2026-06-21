/**
 * Single tunables surface for designers / playtesters (PRD-001 R01-12, _docs/02 §6).
 *
 * Everything a non-engineer might want to tweak — wobble amplitude, notification
 * cadence, grid size, fade timings, haptic patterns — lives here so tuning never
 * means hunting through components. Later PRDs (003 canvas, 005/006 modes) read
 * from this object. Values are seeded defaults; refine in playtests.
 */
export const config = {
  /** Mode 1 freehand wobble (PRD-003/005). */
  wobble: {
    /** Max perpendicular jitter added to each point, in px. */
    amplitude: 4,
    /** Spatial frequency of the noise (higher = jitterier). */
    frequency: 0.15,
  },

  /** Mode 2 snap-to-grid (PRD-003/006). */
  grid: {
    cols: 8,
    rows: 10,
    /** Snap radius as a fraction of cell size. */
    snapTolerance: 0.45,
  },

  /**
   * Mode 1 vague-instruction fade behavior (PRD-005, GDD §3.2). The ask is fully
   * legible for ~`startDelayMs`, then decays to `minOpacity` over `durationMs` so
   * it is gone (from memory) by ~12s — you must act from a fuzzy recollection,
   * with no way to summon it back. Reduced-intensity keeps it *uncomfortable, not
   * unreadable* (raised floor + gentler, slower fade — R05-11).
   */
  fade: {
    /** ms the instruction stays fully legible before fading. */
    startDelayMs: 3000,
    /** ms over which it fades toward `minOpacity` (gone by ~12s). */
    durationMs: 9000,
    /** Lowest opacity the text fades to (full intensity). */
    minOpacity: 0.06,
    /** Raised floor under reduced-intensity — readable but still uneasy. */
    reducedMinOpacity: 0.35,
    /** Gentler, slower fade under reduced-intensity. */
    reducedDurationMs: 12000,
    /** Subtle upward drift in px (suppressed under prefers-reduced-motion). */
    driftPx: 10,
  },

  /**
   * Mode 1 fake-notification cadence (PRD-005, GDD §3.4). Jittered toasts slide in
   * ~every 4–8s and auto-dismiss; reduced-intensity makes them fewer + slower and
   * keeps them out of the canvas (R05-11). Gaps are `[min, max]` jitter windows.
   */
  notifications: {
    firstDelayMs: 2500,
    gapMs: [4000, 8000],
    visibleMs: 2200,
    reducedGapMs: [10000, 16000],
  },

  /** Haptic pattern presets (PRD-003, _docs/05 §4). Durations in ms. */
  haptics: {
    erratic: [10, 30, 15, 40], // Mode 1 "move": arrhythmic, unpleasant
    click: 15, // Mode 2 "snap": crisp, satisfying
    softClick: 8, // reduced-intensity variant
  },
} as const;

export type AppConfig = typeof config;
