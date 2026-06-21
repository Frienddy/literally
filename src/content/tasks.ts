/**
 * Task content registry (PRD-006 R06-9, PRD-009 R09-7; FR-17, FR-20). Maps each
 * task subject to everything both modes need: the warm label, the vague Mode-1
 * block, the literal Mode-2 step sequence, and the hidden target Reflection
 * reveals. Both modes of a session share one `task_id` (picked in the store,
 * PRD-002), and this is where that id resolves to authored content.
 *
 * PRD-009 closes the pool: **house, cat and flower are all authored** (was
 * house-only with a fallback — see `_debt/005`, now resolved), so a randomly-picked
 * subject drives a coherent vague ask (M1), step sequence (M2), and target
 * (Reflection) end to end.
 */
import type { GridDrawing, TaskId } from '../types/session';
import { config } from '../config';
import {
  houseSteps,
  houseTarget,
  catSteps,
  catTarget,
  flowerSteps,
  flowerTarget,
  type Mode2Step,
} from './mode2.steps';
import {
  houseVague,
  catVague,
  flowerVague,
  type VagueInstruction,
} from './mode1.instructions';

export interface TaskContent {
  id: TaskId;
  /** Short, warm subject name for the giver's framing (e.g. "a little house"). */
  label: string;
  /** The vague, fading Mode 1 instruction block for this subject (FR-5). */
  vague: VagueInstruction;
  /** Ordered, literal Mode 2 steps (one segment each). */
  steps: Mode2Step[];
  /** The intended result — the hidden target. */
  target: GridDrawing;
  /** Logical grid size (nodes) this task's coordinates live on. */
  grid: { cols: number; rows: number };
}

const grid = { cols: config.grid.cols, rows: config.grid.rows };

const house: TaskContent = {
  id: 'house',
  label: 'a little house',
  vague: houseVague,
  steps: houseSteps,
  target: houseTarget,
  grid,
};

const cat: TaskContent = {
  id: 'cat',
  label: 'a cat',
  vague: catVague,
  steps: catSteps,
  target: catTarget,
  grid,
};

const flower: TaskContent = {
  id: 'flower',
  label: 'a flower',
  vague: flowerVague,
  steps: flowerSteps,
  target: flowerTarget,
  grid,
};

/** Authored content per subject — every `TaskId` in the pool is now authored. */
export const TASK_CONTENT: Record<TaskId, TaskContent> = {
  house,
  cat,
  flower,
};

/** Resolve a task id to its authored content. */
export const resolveTask = (id: TaskId): TaskContent => TASK_CONTENT[id];
