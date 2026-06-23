import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Anchor Point screen (PRD-006): the player builds the droid via
 * literal, coordinate-based steps on the numbered pixel canvas. Each step is a
 * horizontal *run* ("start at row R, col C: fill N squares → with color K"); filling
 * a run's squares auto-advances to the next step (ADR-015), Undo reverts the last
 * square and the pager with it, and filling the final square opens the completion
 * beat that advances to Feedback #2. Paint math itself is covered by the engine
 * harness E2E (canvas.spec.ts); here we verify the *screen* wiring.
 *
 * Two authored seams keep this subject-agnostic: `mode2-steps` is the flattened
 * cells in fill order ({cell, color}); `mode2-runs` is the run view ({start, length,
 * cells, color, colorIndex}). Drift in the sprite changes the counts, not this test.
 */

type GridSpec = {
  cols: number;
  rows: number;
  cell: number;
  originX: number;
  originY: number;
};
type GridNode = { col: number; row: number };
type Step = { cell: GridNode; color: string };
type Run = {
  start: GridNode;
  length: number;
  cells: GridNode[];
  color: string;
  colorIndex: number;
};
type Drawing = {
  kind: string;
  cells: { col: number; row: number; color: string }[];
};

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

/** Navigate Welcome → Mode 1 (stub) → Feedback #1 → Mode 2. */
async function reachMode2(page: Page) {
  // Pin the random task pick to the pool's first subject (droid) so the step
  // count is stable across runs.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByTestId('welcome-start').click();
  await page.getByTestId('mode1-done').click();
  await page.getByTestId('feedback-stress').getByRole('radio').nth(2).click();
  await page
    .getByTestId('feedback-confidence')
    .getByRole('radio')
    .nth(2)
    .click();
  await page.getByTestId('feedback-continue').click();
  await expect(page.getByTestId('screen-mode2')).toBeVisible();
  await expect(page.getByTestId('mode2-canvas')).toBeVisible();
}

test.describe('Mode 2 — Anchor Point', () => {
  test('builds the droid square by square → reaches Feedback #2', async ({
    page,
  }) => {
    await reachMode2(page);
    const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
    const steps = await readJson<Step[]>(page, 'mode2-steps');
    const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
    const cellPx = (n: GridNode) => ({
      x: box.x + g.originX + (n.col + 0.5) * g.cell,
      y: box.y + g.originY + (n.row + 0.5) * g.cell,
    });

    for (let i = 0; i < steps.length; i++) {
      const p = cellPx(steps[i].cell);
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.up();

      const drawing = await readJson<Drawing>(page, 'mode2-drawing');
      // One clean filled cell per tap; coords are integer grid cells.
      expect(drawing.cells).toHaveLength(i + 1);
      const c = drawing.cells[i];
      expect(Number.isInteger(c.col)).toBe(true);
      expect(Number.isInteger(c.row)).toBe(true);

      // No Next button — filling the square is what advances the step (ADR-015).
    }

    // Filling the final square opens the completion moment → confirm → Feedback #2.
    await expect(page.getByTestId('mode2-complete')).toBeVisible();
    await page.getByTestId('mode2-complete-continue').click();
    await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '2',
    );
  });

  test('a run advances the pager only when its squares are filled; Undo regresses', async ({
    page,
  }) => {
    await reachMode2(page);
    const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
    const runs = await readJson<Run[]>(page, 'mode2-runs');
    const total = runs.length;
    const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
    const tap = async (n: GridNode) => {
      const p = {
        x: box.x + g.originX + (n.col + 0.5) * g.cell,
        y: box.y + g.originY + (n.row + 0.5) * g.cell,
      };
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.up();
    };
    const filledLen = async () =>
      (await readJson<Drawing>(page, 'mode2-drawing')).cells.length;

    // Run 1 spans 2+ cells (droid's antenna): filling its first square must NOT
    // advance — the pager moves only once the whole run is filled.
    expect(runs[0].length).toBeGreaterThan(1);
    await tap(runs[0].cells[0]);
    await expect(page.getByText(`Step 1 of ${total}`)).toBeVisible();

    // Finish run 1 → advance to step 2.
    for (let i = 1; i < runs[0].length; i++) await tap(runs[0].cells[i]);
    await expect(page.getByText(`Step 2 of ${total}`)).toBeVisible();
    expect(await filledLen()).toBe(runs[0].length);

    // Finish run 2 → advance to step 3.
    for (const c of runs[1].cells) await tap(c);
    await expect(page.getByText(`Step 3 of ${total}`)).toBeVisible();
    expect(await filledLen()).toBe(runs[0].length + runs[1].length);

    // Undo: reverts the last square and steps the pager back to run 2 (R06-5).
    await page.getByTestId('mode2-undo').click();
    expect(await filledLen()).toBe(runs[0].length + runs[1].length - 1);
    await expect(page.getByText(`Step 2 of ${total}`)).toBeVisible();
  });
});
