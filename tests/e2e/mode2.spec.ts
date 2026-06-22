import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Anchor Point screen (PRD-006): the player builds the droid via
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

// The canonical droid (the pool's first subject), mirroring
// src/content/mode2.steps.ts (drift here is a signal the authored sequence
// changed). The screen auto-advances on each finished line regardless of whether
// it matches the target (ADR-015), so this spec only needs the right *count* of
// valid node-pairs to walk all 21 steps.
const DROID: [GridNode, GridNode][] = [
  [
    { col: 6, row: 10 },
    { col: 8, row: 5 },
  ],
  [
    { col: 8, row: 5 },
    { col: 14, row: 5 },
  ],
  [
    { col: 14, row: 5 },
    { col: 16, row: 10 },
  ],
  [
    { col: 16, row: 10 },
    { col: 16, row: 22 },
  ],
  [
    { col: 16, row: 22 },
    { col: 6, row: 22 },
  ],
  [
    { col: 6, row: 22 },
    { col: 6, row: 10 },
  ],
  [
    { col: 11, row: 5 },
    { col: 11, row: 2 },
  ],
  [
    { col: 9, row: 6 },
    { col: 13, row: 6 },
  ],
  [
    { col: 13, row: 6 },
    { col: 13, row: 8 },
  ],
  [
    { col: 13, row: 8 },
    { col: 9, row: 8 },
  ],
  [
    { col: 9, row: 8 },
    { col: 9, row: 6 },
  ],
  [
    { col: 6, row: 13 },
    { col: 16, row: 13 },
  ],
  [
    { col: 6, row: 19 },
    { col: 16, row: 19 },
  ],
  [
    { col: 8, row: 15 },
    { col: 14, row: 15 },
  ],
  [
    { col: 14, row: 15 },
    { col: 14, row: 17 },
  ],
  [
    { col: 14, row: 17 },
    { col: 8, row: 17 },
  ],
  [
    { col: 8, row: 17 },
    { col: 8, row: 15 },
  ],
  [
    { col: 8, row: 22 },
    { col: 8, row: 25 },
  ],
  [
    { col: 7, row: 25 },
    { col: 9, row: 25 },
  ],
  [
    { col: 14, row: 22 },
    { col: 14, row: 25 },
  ],
  [
    { col: 13, row: 25 },
    { col: 15, row: 25 },
  ],
];

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

/** Navigate Welcome → Mode 1 (stub) → Feedback #1 → Mode 2. */
async function reachMode2(page: Page) {
  // Pin the random task pick to the pool's first subject (droid) so this spec's
  // step-count assertions ("Step X of 21") are stable.
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
  test('builds the droid via literal steps → reaches Feedback #2', async ({
    page,
  }) => {
    await reachMode2(page);
    const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
    const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
    const px = (n: GridNode) => ({
      x: box.x + g.originX + n.col * g.cell,
      y: box.y + g.originY + n.row * g.cell,
    });

    for (let i = 0; i < DROID.length; i++) {
      const [from, to] = DROID[i];
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
    await draw(DROID[0]);
    await expect(page.getByText('Step 2 of 21')).toBeVisible();

    // Step 2: drawing the second line auto-advances to step 3.
    await draw(DROID[1]);
    expect(
      (await readJson<Drawing>(page, 'mode2-drawing')).segments,
    ).toHaveLength(2);
    await expect(page.getByText('Step 3 of 21')).toBeVisible();

    // Undo: reverts the last segment AND returns to the prior card (R06-5).
    await page.getByTestId('mode2-undo').click();
    expect(
      (await readJson<Drawing>(page, 'mode2-drawing')).segments,
    ).toHaveLength(1);
    await expect(page.getByText('Step 2 of 21')).toBeVisible();
  });
});
