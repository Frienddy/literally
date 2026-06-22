/**
 * Task content registry (FR-17, FR-20). Maps each task subject to everything both
 * modes need: the warm label, the vague Mode-1 block, the literal Mode-2 step
 * sequence, and the hidden target the Reflection reveals. Both modes of a session
 * share one `task_id` (picked in the store), and this is where that id resolves to
 * authored content.
 *
 * The pool is five "I-know-it-but-can't-draw-it" subjects — **droid, alien, mario,
 * fighter and monalisa** are all authored end to end, so a randomly-picked subject
 * drives a coherent vague ask (M1), step sequence (M2), and target (Reflection).
 */
import type { GridDrawing, TaskId } from '../types/session';
import { config } from '../config';
import {
  droidSteps,
  droidTarget,
  alienSteps,
  alienTarget,
  marioSteps,
  marioTarget,
  fighterSteps,
  fighterTarget,
  monalisaSteps,
  monalisaTarget,
  type Mode2Step,
} from './mode2.steps';
import {
  droidVague,
  alienVague,
  marioVague,
  fighterVague,
  monalisaVague,
  type VagueInstruction,
} from './mode1.instructions';

export interface TaskContent {
  id: TaskId;
  /** Short, warm subject name for the giver's framing (e.g. "a little robot droid"). */
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

const droid: TaskContent = {
  id: 'droid',
  label: 'a little robot droid',
  vague: droidVague,
  steps: droidSteps,
  target: droidTarget,
  grid,
};

const alien: TaskContent = {
  id: 'alien',
  label: 'a space alien',
  vague: alienVague,
  steps: alienSteps,
  target: alienTarget,
  grid,
};

const mario: TaskContent = {
  id: 'mario',
  label: 'a jumping Mario',
  vague: marioVague,
  steps: marioSteps,
  target: marioTarget,
  grid,
};

const fighter: TaskContent = {
  id: 'fighter',
  label: 'a space fighter',
  vague: fighterVague,
  steps: fighterSteps,
  target: fighterTarget,
  grid,
};

const monalisa: TaskContent = {
  id: 'monalisa',
  label: 'the Mona Lisa',
  vague: monalisaVague,
  steps: monalisaSteps,
  target: monalisaTarget,
  grid,
};

/** Authored content per subject — every `TaskId` in the pool is authored. */
export const TASK_CONTENT: Record<TaskId, TaskContent> = {
  droid,
  alien,
  mario,
  fighter,
  monalisa,
};

/** Fallback when a (possibly legacy) id isn't in the current pool. */
const FALLBACK_TASK_ID: TaskId = 'droid';

/**
 * Resolve a task id to its authored content. Accepts any string so a session
 * persisted under a *previous* pool (e.g. the old house/cat/flower subjects) still
 * renders — an id with no authored content falls back to the first pool subject
 * instead of crashing History/Reflection (PRD-002 R02-9 / NFR-7).
 */
export const resolveTask = (id: string): TaskContent =>
  TASK_CONTENT[id as TaskId] ?? TASK_CONTENT[FALLBACK_TASK_ID];
