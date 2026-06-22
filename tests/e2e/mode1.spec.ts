import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Mode 1 screen (PRD-005, ADR-015): the "without clear
 * instruction" half. It shares Mode 2's snap-to-grid canvas — the only difference
 * is the instruction (a single vague ask vs. literal counted steps). Here we
 * verify the *screen* wiring: a snapped segment commits, Undo reverts, the
 * slightly-understated Done opens the gently-puzzled beat and advances to
 * Feedback #1, and the calm Exit safety rail is reachable. Snap math itself is
 * covered by the engine harness E2E (canvas.spec.ts).
 */

type GridSpec = {
  cols: number;
  rows: number;
  cell: number;
  originX: number;
  originY: number;
};
type GridNode = { col: number; row: number };
type Drawing = { kind: string; segments: { from: GridNode; to: GridNode }[] };

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

async function reachMode1(page: Page) {
  await page.goto('/');
  await page.getByTestId('welcome-start').click();
  await expect(page.getByTestId('screen-mode1')).toBeVisible();
  await expect(page.getByTestId('mode1-canvas')).toBeVisible();
}

/** Drag node→node on the shared grid, returning after the segment commits. */
async function drawSegment(page: Page, from: GridNode, to: GridNode) {
  const g = await readJson<GridSpec>(page, 'mode1-grid-spec');
  const box = (await page.getByTestId('mode1-canvas').boundingBox())!;
  const px = (n: GridNode) => ({
    x: box.x + g.originX + n.col * g.cell,
    y: box.y + g.originY + n.row * g.cell,
  });
  const a = px(from);
  const b = px(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
}

test.describe('Mode 1 — without clear instruction', () => {
  test('snapped segment + Undo → Done → beat → Feedback #1', async ({
    page,
  }) => {
    await reachMode1(page);

    // Undo exists (same tools as Mode 2) but is disabled until something is drawn.
    await expect(page.getByTestId('mode1-undo')).toBeDisabled();

    await drawSegment(page, { col: 2, row: 4 }, { col: 2, row: 8 });

    // The finished drag commits exactly one snapped segment (integer nodes).
    let drawing = await readJson<Drawing>(page, 'mode1-drawing');
    expect(drawing.kind).toBe('grid');
    expect(drawing.segments).toHaveLength(1);
    expect(Number.isInteger(drawing.segments[0].from.col)).toBe(true);
    expect(drawing.segments[0].from).not.toEqual(drawing.segments[0].to);

    // Undo reverts the segment (R05 mirrors Mode 2's full control now).
    await expect(page.getByTestId('mode1-undo')).toBeEnabled();
    await page.getByTestId('mode1-undo').click();
    drawing = await readJson<Drawing>(page, 'mode1-drawing');
    expect(drawing.segments).toHaveLength(0);

    // Redraw, then Done → the puzzled beat → confirm → Feedback #1 (R05-8/R05-9).
    await drawSegment(page, { col: 2, row: 4 }, { col: 6, row: 4 });
    await page.getByTestId('mode1-done').click();
    await expect(page.getByTestId('mode1-complete')).toBeVisible();
    await page.getByTestId('mode1-complete-continue').click();
    await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '1',
    );
  });

  test('calm Exit leaves to Welcome without penalty (R05-10 / FR-22)', async ({
    page,
  }) => {
    await reachMode1(page);
    const exit = page.getByRole('button', { name: 'Exit' });
    await expect(exit).toBeVisible();
    await exit.click();
    await expect(page.getByTestId('screen-welcome')).toBeVisible();
  });
});
