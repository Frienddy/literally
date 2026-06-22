import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Reflection + History payoff (PRD-008): a full play produces two
 * saved drawings; Reflection reveals the target, shows both attempts and the
 * stress/confidence deltas, and "the reveal" names autism. The session survives a
 * reload (SC-5) and re-renders when reopened from History (R08-11).
 */

type GridSpec = {
  cols: number;
  rows: number;
  cell: number;
  originX: number;
  originY: number;
};
type GridNode = { col: number; row: number };
type Segment = { from: GridNode; to: GridNode };

async function readJson<T>(page: Page, testId: string): Promise<T> {
  const text = await page.getByTestId(testId).textContent();
  return JSON.parse(text ?? 'null') as T;
}

async function rate(page: Page, stressNth: number, confidenceNth: number) {
  await page
    .getByTestId('feedback-stress')
    .getByRole('radio')
    .nth(stressNth)
    .click();
  await page
    .getByTestId('feedback-confidence')
    .getByRole('radio')
    .nth(confidenceNth)
    .click();
  await page.getByTestId('feedback-continue').click();
}

/** Play a complete session that leaves a real drawing in each mode. */
async function playFullSession(page: Page) {
  await page.goto('/');
  await page.getByTestId('welcome-start').click();

  // Mode 1: one snapped segment on the shared grid, then the puzzled beat → FB #1.
  const m1 = (await page.getByTestId('mode1-canvas').boundingBox())!;
  await page.mouse.move(m1.x + m1.width * 0.35, m1.y + m1.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(m1.x + m1.width * 0.5, m1.y + m1.height * 0.4, {
    steps: 8,
  });
  await page.mouse.move(m1.x + m1.width * 0.6, m1.y + m1.height * 0.6, {
    steps: 8,
  });
  await page.mouse.up();
  await page.getByTestId('mode1-done').click();
  await page.getByTestId('mode1-complete-continue').click();
  await rate(page, 4, 0); // high stress, low confidence

  // Mode 2: build whatever subject this session drew, from the authored steps
  // (subject-agnostic — the pool is droid/alien/mario/fighter/monalisa) → Feedback #2.
  await expect(page.getByTestId('mode2-canvas')).toBeVisible();
  const g = await readJson<GridSpec>(page, 'mode2-grid-spec');
  const steps = await readJson<Segment[]>(page, 'mode2-steps');
  const box = (await page.getByTestId('mode2-canvas').boundingBox())!;
  const px = (n: GridNode) => ({
    x: box.x + g.originX + n.col * g.cell,
    y: box.y + g.originY + n.row * g.cell,
  });
  for (const { from, to } of steps) {
    const a = px(from);
    const b = px(to);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 12 });
    await page.mouse.up();
    // Each finished line auto-advances; the last opens the completion beat.
  }
  await page.getByTestId('mode2-complete-continue').click();
  await rate(page, 0, 4); // low stress, high confidence
}

test.describe('Reflection & History — the payoff (PRD-008)', () => {
  test('reveals target + both attempts + deltas; survives reload; reopens from History', async ({
    page,
  }) => {
    await playFullSession(page);

    // Reflection: the reveal lands.
    await expect(page.getByTestId('screen-reflection')).toBeVisible();
    await expect(page.getByTestId('target-reveal')).toBeVisible();
    await expect(page.getByTestId('reflection-preview-without')).toBeVisible();
    await expect(page.getByTestId('reflection-preview-with')).toBeVisible();

    // Both deltas are shown (R08-6).
    const deltas = page.getByTestId('reflection-deltas');
    await expect(deltas).toContainText(/Stress \d+ → \d+/);
    await expect(deltas).toContainText(/Sure\? \d+ → \d+/);

    // The reveal names autism — and only here (ADR-008).
    await expect(page.getByTestId('reflection-debrief')).toContainText(
      /autis/i,
    );

    // SC-5: reload keeps the session; the app lands on Welcome (screen not
    // persisted), and the session is in History.
    await page.reload();
    await expect(page.getByTestId('screen-welcome')).toBeVisible();
    await page.getByTestId('welcome-history').click();
    const rows = page.getByTestId('history-list').getByRole('listitem');
    await expect(rows).toHaveCount(1);

    // R08-11: reopening re-renders the same Reflection from stored data.
    await rows.first().getByRole('button').click();
    await expect(page.getByTestId('screen-reflection')).toBeVisible();
    await expect(page.getByTestId('target-reveal')).toBeVisible();
    await expect(page.getByTestId('reflection-preview-with')).toBeVisible();
  });

  test('Delete all my data needs a confirm, then wipes History', async ({
    page,
  }) => {
    await playFullSession(page);
    await page.getByTestId('reflection-history').click();
    await expect(
      page.getByTestId('history-list').getByRole('listitem'),
    ).toHaveCount(1);

    // First tap arms the confirm; cancel keeps the data.
    await page.getByTestId('history-delete-all').click();
    await page.getByTestId('history-delete-cancel').click();
    await expect(
      page.getByTestId('history-list').getByRole('listitem'),
    ).toHaveCount(1);

    // Confirm wipes everything and returns to Welcome.
    await page.getByTestId('history-delete-all').click();
    await page.getByTestId('history-delete-confirm').click();
    await expect(page.getByTestId('screen-welcome')).toBeVisible();
  });
});
