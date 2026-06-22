/**
 * Single tunables surface for designers / playtesters (PRD-001 R01-12, _docs/02 §6).
 *
 * Everything a non-engineer might want to tweak — grid size, snap tolerance,
 * haptic patterns — lives here so tuning never means hunting through components.
 * Values are seeded defaults; refine in playtests.
 */
export const config = {
  /** Shared snap-to-grid canvas (PRD-003/006, ADR-015 — both modes). */
  grid: {
    // Fine dot grid: each legacy cell is split 3× (was 8×10). Authored Mode-2
    // coordinates were scaled ×3 to match, so drawings render unchanged on a
    // denser field of dots. `n-1` cells span, so 22/28 nodes ⇒ 21×27 cells.
    cols: 22,
    rows: 28,
    /** Snap radius as a fraction of cell size. */
    snapTolerance: 0.45,
    /**
     * Breathing room (px) between the dot field and the canvas edge. Smaller =
     * bigger cells (more space *between* dots) for a fixed node count — the lever
     * for the cramped-dots-on-phones fix, where vertical space is tight and the
     * 22×28 grid stays fixed (its authored Mode-2 coordinates depend on it).
     */
    pad: 12,
  },

  /** Haptic pattern presets (PRD-003, _docs/05 §4). Durations in ms. */
  haptics: {
    click: 15, // "snap": crisp, satisfying confirm on each new node
  },
} as const;

export type AppConfig = typeof config;
