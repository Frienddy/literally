import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Anchor Point screen (PRD-006): the player builds the droid via
 * literal, one-at-a-time steps on the pixel canvas. Each filled square auto-
 * advances to the next step (ADR-015); Undo reverts the last square and the card
 * with it; filling the final square opens the completion beat that advances to
 * Feedback #2. Paint math itself is covered by the engine harness E2E
 * (canvas.spec.ts); here we verify the *screen* wiring.
 *
 * The authored steps are read from the `mode2-steps` seam (each `{cell, color}`),
 * so this spec drives whatever the sprite says without hard-coding coordinates —
 * drift in the sprite changes the step count, not this test.
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
      // One clean filled cell per step; coords are integer grid cells.
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

  test('Undo reverts the last square and returns to the prior card', async ({
    page,
  }) => {
    await reachMode2(page);
    const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
    const steps = await readJson<Step[]>(page, 'mode2-steps');
    const total = steps.length;
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

    // Step 1: filling the first square auto-advances to step 2 (ADR-015).
    await tap(steps[0].cell);
    await expect(page.getByText(`Step 2 of ${total}`)).toBeVisible();

    // Step 2: filling the second square auto-advances to step 3.
    await tap(steps[1].cell);
    expect((await readJson<Drawing>(page, 'mode2-drawing')).cells).toHaveLength(
      2,
    );
    await expect(page.getByText(`Step 3 of ${total}`)).toBeVisible();

    // Undo: reverts the last square AND returns to the prior card (R06-5).
    await page.getByTestId('mode2-undo').click();
    expect((await readJson<Drawing>(page, 'mode2-drawing')).cells).toHaveLength(
      1,
    );
    await expect(page.getByText(`Step 2 of ${total}`)).toBeVisible();
  });
});
