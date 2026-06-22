import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Anchor Point screen (PRD-006): the player builds the house via
 * literal, one-at-a-time steps on the snap-to-grid canvas. Each finished line
 * auto-advances to the next step (ADR-015); Undo reverts the last line and the
 * card with it; drawing the final line opens the completion beat that advances to
 * Feedback #2. Snap math itself is covered by the engine harness E2E
 * (canvas.spec.ts); here we verify the *screen* wiring.
 */

type GridSpec = {
  cols: number;
  rows: number;
  cell: number;
  originX: number;
  originY: number;
};

type Drawing = { kind: string; segments: { from: GridNode; to: GridNode }[] };
type GridNode = { col: number; row: number };

// The canonical house, mirroring src/content/mode2.steps.ts (drift here is a
// signal the authored sequence changed).
const HOUSE: [GridNode, GridNode][] = [
  [
    { col: 2, row: 4 },
    { col: 2, row: 8 },
  ],
  [
    { col: 2, row: 8 },
    { col: 6, row: 8 },
  ],
  [
    { col: 6, row: 8 },
    { col: 6, row: 4 },
  ],
  [
    { col: 6, row: 4 },
    { col: 2, row: 4 },
  ],
  [
    { col: 2, row: 4 },
    { col: 4, row: 2 },
  ],
  [
    { col: 4, row: 2 },
    { col: 6, row: 4 },
  ],
  [
    { col: 3, row: 8 },
    { col: 3, row: 6 },
  ],
  [
    { col: 3, row: 6 },
    { col: 5, row: 6 },
  ],
  [
    { col: 5, row: 6 },
    { col: 5, row: 8 },
  ],
];

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

/** Navigate Welcome → Mode 1 (stub) → Feedback #1 → Mode 2. */
async function reachMode2(page: Page) {
  // Pin the random task pick to the pool's first subject (house) so this spec's
  // house-specific assertions ("Step X of 9", closed-loop geometry) are stable.
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
  test('builds the house via literal steps → reaches Feedback #2', async ({
    page,
  }) => {
    await reachMode2(page);
    const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
    const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
    const px = (n: GridNode) => ({
      x: box.x + g.originX + n.col * g.cell,
      y: box.y + g.originY + n.row * g.cell,
    });

    for (let i = 0; i < HOUSE.length; i++) {
      const [from, to] = HOUSE[i];
      const a = px(from);
      const b = px(to);
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 12 });
      await page.mouse.up();

      const drawing = await readJson<Drawing>(page, 'mode2-drawing');
      // One clean segment per node-pair; endpoints are integer grid nodes.
      expect(drawing.segments).toHaveLength(i + 1);
      const seg = drawing.segments[i];
      expect(Number.isInteger(seg.from.col)).toBe(true);
      expect(Number.isInteger(seg.to.row)).toBe(true);
      expect(seg.from).not.toEqual(seg.to);

      // No Next button — drawing the line is what advances the step (ADR-015).
    }

    // Drawing the final line opens the completion moment → confirm → Feedback #2.
    await expect(page.getByTestId('mode2-complete')).toBeVisible();
    await page.getByTestId('mode2-complete-continue').click();
    await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '2',
    );
  });

  test('Undo reverts the last segment and returns to the prior card', async ({
    page,
  }) => {
    await reachMode2(page);
    const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
    const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
    const px = (n: GridNode) => ({
      x: box.x + g.originX + n.col * g.cell,
      y: box.y + g.originY + n.row * g.cell,
    });
    const draw = async ([from, to]: [GridNode, GridNode]) => {
      const a = px(from);
      const b = px(to);
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 12 });
      await page.mouse.up();
    };

    // Step 1: drawing the first line auto-advances to step 2 (ADR-015).
    await draw(HOUSE[0]);
    await expect(page.getByText('Step 2 of 9')).toBeVisible();

    // Step 2: drawing the second line auto-advances to step 3.
    await draw(HOUSE[1]);
    expect(
      (await readJson<Drawing>(page, 'mode2-drawing')).segments,
    ).toHaveLength(2);
    await expect(page.getByText('Step 3 of 9')).toBeVisible();

    // Undo: reverts the last segment AND returns to the prior card (R06-5).
    await page.getByTestId('mode2-undo').click();
    expect(
      (await readJson<Drawing>(page, 'mode2-drawing')).segments,
    ).toHaveLength(1);
    await expect(page.getByText('Step 2 of 9')).toBeVisible();
  });
});
