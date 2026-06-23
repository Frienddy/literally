/**
 * Single tunables surface for designers / playtesters (PRD-001 R01-12, _docs/02 §6).
 *
 * Everything a non-engineer might want to tweak — the pixel-grid size, the color
 * palette, haptic patterns — lives here so tuning never means hunting through
 * components. Values are seeded defaults; refine in playtests.
 */
export const config = {
  /** Shared pixel-paint canvas (both modes, ADR-015). */
  grid: {
    // The canvas is a grid of square *cells* you fill with color (pixel art).
    // `cols`/`rows` count those cells. Kept modest so each cell is a comfortable
    // tap target on a phone and the Mode-2 sprites stay recognisable.
    cols: 16,
    rows: 20,
    /**
     * Breathing room (px) between the cell field and the canvas edge. Smaller =
     * bigger cells for a fixed cell count — the lever for cramped phones, where
     * vertical space is tight and the cell count stays fixed (Mode-2 sprite
     * coordinates depend on it).
     */
    pad: 12,
    /**
     * Mode-2 only: a wider margin so the numbered row/col labels (the "with clear
     * instruction" coordinate guides) have room in the gutter around the grid. Mode
     * 1 keeps the tighter {@link pad}; bigger here trades a little cell size for
     * legible axis numbers.
     */
    labelPad: 24,
  },

  /**
   * Fixed pixel-art palette (PRD-003). A small, bold set of swatches the player
   * picks from — `name` is shown in the Mode-2 "fill this square <name>" steps and
   * read by screen readers; `hex` is what gets painted and persisted on each cell.
   * Tweak freely: order is the on-screen swatch order, `[0]` is the default color.
   */
  palette: [
    { name: 'black', hex: '#1f2937' },
    { name: 'grey', hex: '#9ca3af' },
    { name: 'red', hex: '#ef4444' },
    { name: 'orange', hex: '#f97316' },
    { name: 'yellow', hex: '#facc15' },
    { name: 'green', hex: '#22c55e' },
    { name: 'teal', hex: '#14b8a6' },
    { name: 'blue', hex: '#3b82f6' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'brown', hex: '#92400e' },
    { name: 'peach', hex: '#f7c59f' },
  ],

  /** Haptic pattern presets (PRD-003, _docs/05 §4). Durations in ms. */
  haptics: {
    click: 15, // "fill": crisp, satisfying confirm on each painted square
  },
} as const;

export type AppConfig = typeof config;

/** One palette entry: the swatch the player taps (warm `name`, painted `hex`). */
export type PaletteColor = AppConfig['palette'][number];

/** The default color a fresh canvas paints with (the first swatch). */
export const DEFAULT_COLOR = config.palette[0].hex;
