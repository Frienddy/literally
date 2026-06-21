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

  /** Mode 1 vague-instruction fade behavior (PRD-005). */
  fade: {
    /** ms before the instruction text begins fading. */
    startDelayMs: 1500,
    /** ms over which it fades to unreadable. */
    durationMs: 4000,
    /** Lowest opacity the text fades to. */
    minOpacity: 0.05,
  },

  /** Mode 1 fake-notification cadence (PRD-005). */
  notifications: {
    firstDelayMs: 2500,
    intervalMs: 3500,
    visibleMs: 2200,
  },

  /** Haptic pattern presets (PRD-003, _docs/05 §4). Durations in ms. */
  haptics: {
    erratic: [10, 30, 15, 40], // Mode 1 "move": arrhythmic, unpleasant
    click: 15, // Mode 2 "snap": crisp, satisfying
    softClick: 8, // reduced-intensity variant
  },
} as const;

export type AppConfig = typeof config;
