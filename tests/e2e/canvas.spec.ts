import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the PRD-003 demo harness (`?harness=canvas`) to verify the engine +
 * useCanvas end to end with synthetic pointer input. Real haptics still require
 * a physical device (_docs/09 §6) — here we assert the engine *fired* the haptic
 * callback (logged by the harness), independent of actual vibration support.
 */

type GridSpec = {
  cols: number;
  rows: number;
  cell: number;
  originX: number;
  originY: number;
};

type PixelCell = { col: number; row: number; color: string };
type Drawing = { kind: string; cells: PixelCell[] };

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

test.describe('canvas engine — pixel paint (shared by both modes)', () => {
  test('dragging across cells fills them + fires fill haptics', async ({
    page,
  }) => {
    await page.goto('/?harness=canvas');
    const canvas = page.getByTestId('demo-canvas');
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    const g = await readJson<GridSpec>(page, 'grid-spec');

    const cellPx = (col: number, row: number) => ({
      x: box.x + g.originX + (col + 0.5) * g.cell,
      y: box.y + g.originY + (row + 0.5) * g.cell,
    });
    const a = cellPx(2, 1);
    const b = cellPx(2, 5);

    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 30 });
    await page.mouse.up();

    const drawing = await readJson<Drawing>(page, 'last-change');
    expect(drawing.kind).toBe('pixel');
    // A drag down a column fills several distinct cells (integer coords + a color).
    expect(drawing.cells.length).toBeGreaterThan(1);
    const c = drawing.cells[0];
    expect(Number.isInteger(c.col)).toBe(true);
    expect(Number.isInteger(c.row)).toBe(true);
    expect(typeof c.color).toBe('string');

    // Each newly-filled cell fired a crisp confirm haptic.
    const haptics = (await page.getByTestId('haptic-log').textContent()) ?? '';
    expect(haptics).toContain('snap');
  });

  test('Undo reverts the last stroke', async ({ page }) => {
    await page.goto('/?harness=canvas');
    const canvas = page.getByTestId('demo-canvas');
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    const g = await readJson<GridSpec>(page, 'grid-spec');
    const cellPx = (col: number, row: number) => ({
      x: box.x + g.originX + (col + 0.5) * g.cell,
      y: box.y + g.originY + (row + 0.5) * g.cell,
    });

    const a = cellPx(1, 1);
    const b = cellPx(5, 1);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 30 });
    await page.mouse.up();

    let drawing = await readJson<Drawing>(page, 'last-change');
    expect(drawing.cells.length).toBeGreaterThan(0);

    await page.getByTestId('canvas-undo').click();
    drawing = await readJson<Drawing>(page, 'last-change');
    expect(drawing.cells).toHaveLength(0); // one drag = one undo step
  });

  test('drawing on the canvas does not scroll the page', async ({ page }) => {
    await page.goto('/?harness=canvas');
    const canvas = page.getByTestId('demo-canvas');
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 360, { steps: 20 });
    await page.mouse.up();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
