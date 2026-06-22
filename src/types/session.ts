/** A raw 2D point in CSS pixels (relative to the canvas top-left). */
export interface Point {
  x: number;
  y: number;
  /** ms offset from stroke start — optional, used for replay/feel analysis. */
  t?: number;
}

/**
 * Snap-to-grid drawing. **Both modes** now draw on the same dotted grid; a drawing
 * is a list of segments between integer grid nodes (col,row), independent of pixel
 * size so it scales to any screen. The modes differ only in the *instruction* —
 * Mode 1 gives one vague ask, Mode 2 gives literal directional steps — never in
 * the canvas (see ADR-015).
 */
export interface GridNode {
  col: number;
  row: number;
}

export interface GridSegment {
  from: GridNode;
  to: GridNode;
}

export interface GridDrawing {
  kind: 'grid';
  segments: GridSegment[];
  grid: { cols: number; rows: number };
}

/**
 * A saved drawing. Historically a discriminated union (freehand vs grid); since
 * both modes share the snap-to-grid canvas (ADR-015) there is one shape. Kept as a
 * named alias so the renderer/preview signatures read intentionally.
 */
export type DrawingData = GridDrawing;

/** Stress is an integer 1–10 (validated on input). */
export type StressLevel = number; // 1..10

/**
 * Confidence ("how sure you did it right") — same shape as stress. The Mode-1 vs
 * Mode-2 confidence gap is the key measure of the product goal.
 */
export type ConfidenceLevel = number; // 1..10

/** Which simple task subject the session used; both modes share one. */
export type TaskId = 'house' | 'cat' | 'flower';

/** The persisted record. Matches the spec's GameSession, expanded for safety. */
export interface GameSession {
  /** UUID generated locally (crypto.randomUUID). */
  id: string;
  /** Schema version for migrations. */
  schemaVersion: number;
  /** Which task subject this session used (e.g. 'house'); shared by both modes. */
  task_id: TaskId;
  /**
   * Both modes draw on the shared snap-to-grid canvas (ADR-015), so each attempt
   * is a `GridDrawing`. (Pre-ADR-015 sessions stored Mode 1 as freehand pixels;
   * the v2 migration drops that incompatible payload to `null` — see migrations.)
   */
  mode_1_drawing_data: GridDrawing | null;
  mode_2_drawing_data: GridDrawing | null;
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
