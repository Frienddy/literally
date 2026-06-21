# DEBT-005 — `cat` / `flower` task subjects are unauthored (fall back to house)

**Status:** Open · **Severity:** Low · **Surfaced by:** PRD-006 (Mode 2 — Anchor Point)

## What

A session's subject is chosen at random from the task pool
(`gameStore.TASKS = ['house', 'cat', 'flower']`, PRD-002 R02-4), and both modes
share that one `task_id`. PRD-006 authors the **house** only — its literal Mode 2
step sequence and hidden target live in `src/content/mode2.steps.ts`, registered
in `src/content/tasks.ts`. `cat` and `flower` are registered as `undefined`, and
`resolveTask` falls back to the house:

```ts
export const resolveTask = (id: TaskId): TaskContent => TASK_CONTENT[id] ?? house;
```

So a session that rolls `cat` or `flower` silently draws/guides/reveals the
**house** instead.

## Why deferred

Authoring the full task pool (each subject's step sequence, coordinates, target,
and the matching giver/notification copy) is explicitly **PRD-009** scope
(content, copy & ethics). PRD-006's mandate is the canonical subject + the Mode 2
mechanics, which are complete. Narrowing the pool to `['house']` in the store
would instead touch PRD-002's owned task-pool decision, so the non-breaking
fallback was chosen over a cross-PRD change.

## Risk

Low. The flow, persistence, and the Reflection reveal all work for every rolled
subject (they just render the house). The only user-visible gap is variety —
FR-20's "task-variety pool" is effectively a pool of one until PRD-009. No data
loss, no crash, no incorrect target (steps always match the drawn/ revealed
house).

## Suggested resolution

In **PRD-009**, author `cat` and `flower` (steps + coords + target + copy) and
populate `TASK_CONTENT`. Then either drop the `?? house` fallback or keep it as a
defensive default and add a unit test asserting every `TaskId` in
`gameStore.TASKS` resolves to authored content (no fallback). Until then, the
fallback keeps a randomly-picked subject from ever breaking the flow.
