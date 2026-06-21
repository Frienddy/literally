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

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

test.describe('canvas engine — freehand (Mode 1)', () => {
  test('a drawn stroke emits a freehand DrawingData payload', async ({
    page,
  }) => {
    await page.goto('/?harness=canvas');
    const canvas = page.getByTestId('demo-canvas');
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;

    // Draw an L so the corner survives RDP simplification (> 1 point).
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 260, box.y + 60, { steps: 20 });
    await page.mouse.move(box.x + 260, box.y + 320, { steps: 20 });
    await page.mouse.up();

    const drawing = await readJson<{
      kind: string;
      strokes: { points: unknown[] }[];
    }>(page, 'last-change');
    expect(drawing.kind).toBe('freehand');
    expect(drawing.strokes.length).toBeGreaterThanOrEqual(1);
    expect(drawing.strokes[0].points.length).toBeGreaterThan(1);
  });

  test('freehand mode shows no Undo (per GDD)', async ({ page }) => {
    await page.goto('/?harness=canvas');
    await expect(page.getByTestId('demo-canvas')).toBeVisible();
    await expect(page.getByTestId('canvas-undo')).toHaveCount(0);
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

test.describe('canvas engine — grid (Mode 2)', () => {
  test('dragging node→node creates exactly one snapped segment + snap haptics', async ({
    page,
  }) => {
    await page.goto('/?harness=canvas&mode=grid');
    const canvas = page.getByTestId('demo-canvas');
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    const g = await readJson<GridSpec>(page, 'grid-spec');

    const nodePx = (col: number, row: number) => ({
      x: box.x + g.originX + col * g.cell,
      y: box.y + g.originY + row * g.cell,
    });
    const a = nodePx(2, 1);
    const b = nodePx(2, 5);

    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 30 });
    await page.mouse.up();

    const drawing = await readJson<{
      kind: string;
      segments: { from: { col: number; row: number }; to: GridSpec }[];
    }>(page, 'last-change');
    expect(drawing.kind).toBe('grid');
    expect(drawing.segments).toHaveLength(1);

    const seg = drawing.segments[0];
    expect(Number.isInteger(seg.from.col)).toBe(true);
    expect(Number.isInteger(seg.from.row)).toBe(true);
    expect(seg.from).not.toEqual(seg.to);

    // Crossing intermediate nodes fired at least one crisp snap haptic.
    const haptics = (await page.getByTestId('haptic-log').textContent()) ?? '';
    expect(haptics).toContain('snap');
  });

  test('Undo reverts the last segment in grid mode', async ({ page }) => {
    await page.goto('/?harness=canvas&mode=grid');
    const canvas = page.getByTestId('demo-canvas');
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    const g = await readJson<GridSpec>(page, 'grid-spec');
    const nodePx = (col: number, row: number) => ({
      x: box.x + g.originX + col * g.cell,
      y: box.y + g.originY + row * g.cell,
    });

    const a = nodePx(1, 1);
    const b = nodePx(5, 1);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 30 });
    await page.mouse.up();

    let drawing = await readJson<{ segments: unknown[] }>(page, 'last-change');
    expect(drawing.segments).toHaveLength(1);

    await page.getByTestId('canvas-undo').click();
    drawing = await readJson<{ segments: unknown[] }>(page, 'last-change');
    expect(drawing.segments).toHaveLength(0);
  });
});
