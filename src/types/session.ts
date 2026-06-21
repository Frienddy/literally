/** A raw 2D point in CSS pixels (relative to the canvas top-left). */
export interface Point {
  x: number;
  y: number;
  /** ms offset from stroke start — optional, used for replay/feel analysis. */
  t?: number;
}

/**
 * Mode 1: freehand. A drawing is a list of strokes; each stroke is a polyline.
 * Points here are the *rendered* (wobbled) points so the saved drawing recreates
 * exactly what the player saw.
 */
export interface FreehandStroke {
  points: Point[];
  /** stroke width in px at capture time (for faithful re-render). */
  width: number;
}

export interface FreehandDrawing {
  kind: 'freehand';
  strokes: FreehandStroke[];
  /** CSS size of the canvas at capture, for correct scaling on replay. */
  canvas: { width: number; height: number };
}

/**
 * Mode 2: snap-to-grid. A drawing is a list of segments between integer grid
 * nodes (col,row), independent of pixel size so it scales to any screen.
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

/** Discriminated union — `kind` tells the renderer which path to take. */
export type DrawingData = FreehandDrawing | GridDrawing;

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
  mode_1_drawing_data: FreehandDrawing | null;
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
