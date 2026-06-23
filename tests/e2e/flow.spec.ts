import { test, expect, type Page } from '@playwright/test';

/**
 * The navigation skeleton walks end to end with stub UIs (PRD-004 R04-5), and the
 * single-document FSM means browser-back does nothing destructive (R04-6 / SC-4).
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

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

async function rate(page: Page) {
  await page.getByTestId('feedback-stress').getByRole('radio').nth(4).click();
  await page
    .getByTestId('feedback-confidence')
    .getByRole('radio')
    .nth(2)
    .click();
}

/**
 * Build the Mode 2 subject by filling each authored square on the pixel grid.
 * There is no Next button — each filled square auto-advances (ADR-015), and the
 * final square opens the completion beat we then confirm.
 */
async function buildMode2(page: Page) {
  const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
  const steps = await readJson<Step[]>(page, 'mode2-steps');
  const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
  const cellPx = (n: GridNode) => ({
    x: box.x + g.originX + (n.col + 0.5) * g.cell,
    y: box.y + g.originY + (n.row + 0.5) * g.cell,
  });
  for (const { cell } of steps) {
    const p = cellPx(cell);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.up();
  }
  await page.getByTestId('mode2-complete-continue').click();
}

test.describe('walkable flow (FSM)', () => {
  test('welcome → … → reflection → history → welcome', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('screen-welcome')).toBeVisible();
    await page.getByTestId('welcome-start').click();

    // Mode 1 → Feedback #1
    await expect(page.getByTestId('screen-mode1')).toBeVisible();
    await page.getByTestId('mode1-done').click();
    await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '1',
    );
    await rate(page);
    await page.getByTestId('feedback-continue').click();

    // Mode 2: draw the literal steps (each line auto-advances), then confirm the
    // completion beat.
    await expect(page.getByTestId('screen-mode2')).toBeVisible();
    await expect(page.getByTestId('mode2-canvas')).toBeVisible();
    await buildMode2(page);

    // Feedback #2 → Reflection
    await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '2',
    );
    await rate(page);
    await page.getByTestId('feedback-continue').click();
    await expect(page.getByTestId('screen-reflection')).toBeVisible();

    // Reflection → History (one saved session) → Welcome
    await page.getByTestId('reflection-history').click();
    await expect(page.getByTestId('screen-history')).toBeVisible();
    await expect(
      page.getByTestId('history-list').getByRole('listitem'),
    ).toHaveCount(1);
    await page.getByTestId('history-back').click();
    await expect(page.getByTestId('screen-welcome')).toBeVisible();
  });

  test('FSM transitions push no browser history and never change the URL', async ({
    page,
  }) => {
    await page.goto('/');
    const url0 = page.url();
    const len0 = await page.evaluate(() => history.length);

    // Advance several screens through the in-store FSM.
    await page.getByTestId('welcome-start').click();
    await expect(page.getByTestId('screen-mode1')).toBeVisible();
    await page.getByTestId('mode1-done').click();
    await expect(page.getByTestId('screen-feedback')).toBeVisible();

    // No URL router, no history stack to swipe back through (ADR-004 / SC-4).
    expect(page.url()).toBe(url0);
    expect(await page.evaluate(() => history.length)).toBe(len0);
  });
});
