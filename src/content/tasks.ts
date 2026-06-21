/**
 * Task content registry (PRD-006 R06-9, §5; supports FR-17, FR-20). Maps each
 * task subject to its Mode 2 step sequence + the hidden target Reflection reveals.
 * Both modes of a session share one `task_id` (picked in the store, PRD-002),
 * and this is where that id resolves to authored content.
 *
 * v1 authors the canonical **house** only. `cat`/`flower` are part of the task
 * pool (`gameStore.TASKS`) but their step sequences are authored in PRD-009; until
 * then `resolveTask` falls back to the house so a randomly-picked subject never
 * breaks the flow or the reveal. See `_debt/005-unauthored-task-subjects.md`.
 */
import type { GridDrawing, TaskId } from '../types/session';
import { config } from '../config';
import { houseSteps, houseTarget, type Mode2Step } from './mode2.steps';

export interface TaskContent {
  id: TaskId;
  /** Short, warm subject name for the giver's framing (e.g. "a little house"). */
  label: string;
  /** Ordered, literal Mode 2 steps (one segment each). */
  steps: Mode2Step[];
  /** The intended result — the hidden target. */
  target: GridDrawing;
  /** Logical grid size (nodes) this task's coordinates live on. */
  grid: { cols: number; rows: number };
}

const house: TaskContent = {
  id: 'house',
  label: 'a little house',
  steps: houseSteps,
  target: houseTarget,
  grid: { cols: config.grid.cols, rows: config.grid.rows },
};

/** Authored content per subject; `undefined` = not yet authored (PRD-009). */
export const TASK_CONTENT: Record<TaskId, TaskContent | undefined> = {
  house,
  cat: undefined,
  flower: undefined,
};

/** Resolve a task id to its content, falling back to the house until PRD-009. */
export const resolveTask = (id: TaskId): TaskContent =>
  TASK_CONTENT[id] ?? house;
