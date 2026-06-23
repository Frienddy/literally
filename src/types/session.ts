/** A raw 2D point in CSS pixels (relative to the canvas top-left). */
export interface Point {
  x: number;
  y: number;
  /** ms offset from stroke start — optional, used for replay/feel analysis. */
  t?: number;
}

/**
 * Pixel-art drawing. **Both modes** now paint colored squares on the same grid of
 * cells; a drawing is a list of filled `(col,row)` cells, each carrying a palette
 * color (hex). It's independent of pixel size so it scales to any screen. The
 * modes differ only in the *instruction* — Mode 1 gives one vague ask and a free
 * palette, Mode 2 walks one literal "fill this square <color>" step at a time —
 * never in the canvas itself (see ADR-015).
 *
 * (Pre-pixel sessions stored drawings as line `segments` between grid nodes; that
 * mechanic was removed when the canvas became a pixel-paint surface — the v2→v3
 * migration drops those incompatible payloads to `null`, see migrations.)
 */
export interface GridNode {
  col: number;
  row: number;
}

/** One painted cell: a grid coordinate plus its fill color (a hex string). */
export interface PixelCell {
  col: number;
  row: number;
  /** Fill color — a palette hex (e.g. `#ef4444`), so it renders standalone. */
  color: string;
}

export interface PixelDrawing {
  kind: 'pixel';
  cells: PixelCell[];
  grid: { cols: number; rows: number };
}

/**
 * A saved drawing. Both modes share the pixel-paint canvas (ADR-015), so there is
 * one shape. Kept as a named alias so the renderer/preview signatures read
 * intentionally.
 */
export type DrawingData = PixelDrawing;

/** Stress is an integer 1–10 (validated on input). */
export type StressLevel = number; // 1..10

/**
 * Confidence ("how sure you did it right") — same shape as stress. The Mode-1 vs
 * Mode-2 confidence gap is the key measure of the product goal.
 */
export type ConfidenceLevel = number; // 1..10

/** Which simple task subject the session used; both modes share one. */
export type TaskId =
  | 'droid'
  | 'alien'
  | 'mario'
  | 'fighter'
  | 'monalisa'
  | 'ufo'
  | 'axolotl';

/** The persisted record. Matches the spec's GameSession, expanded for safety. */
export interface GameSession {
  /** UUID generated locally (crypto.randomUUID). */
  id: string;
  /** Schema version for migrations. */
  schemaVersion: number;
  /** Which task subject this session used (e.g. 'droid'); shared by both modes. */
  task_id: TaskId;
  /**
   * Both modes paint on the shared pixel canvas (ADR-015), so each attempt is a
   * `PixelDrawing`. (Pre-pixel sessions stored line-segment drawings; the v3
   * migration drops those incompatible payloads to `null` — see migrations.)
   */
  mode_1_drawing_data: PixelDrawing | null;
  mode_2_drawing_data: PixelDrawing | null;
  mode_1_stress_level: StressLevel | null;
  mode_2_stress_level: StressLevel | null;
  /** "How sure were you that you did it right?" — the goal's key signal. */
  mode_1_confidence_level: ConfidenceLevel | null;
  mode_2_confidence_level: ConfidenceLevel | null;
  /** epoch ms when the session was started. */
  started_at: number;
  /** epoch ms when the reflection was reached / session finalized. */
  completed_at: number | null;
}
