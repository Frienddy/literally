import { test, expect, type Page } from '@playwright/test';

/**
 * Drives the real Sensory Storm screen (PRD-005): a blank wobbly freehand canvas
 * with **no undo**, a slightly-too-small Done that opens the gently-puzzled beat
 * and advances to Feedback #1, and the persistent sensory-safety rails (calm Exit
 * + reduce-intensity) that survive the chaos. The wobble/haptic mechanics
 * themselves are covered by the engine harness E2E (canvas.spec.ts); here we
 * verify the *screen* wiring.
 */

type FreehandDrawing = {
  kind: string;
  strokes: { points: { x: number; y: number }[]; width: number }[];
};

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

/** Draw a multi-point stroke in the canvas, away from the bottom-right Done. */
async function drawStroke(page: Page) {
  const box = (await page.getByTestId('mode1-canvas').boundingBox())!;
  const cx = box.x + box.width * 0.35;
  const cy = box.y + box.height * 0.55;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 40, cy + 30, { steps: 8 });
  await page.mouse.move(cx + 80, cy - 10, { steps: 8 });
  await page.mouse.move(cx + 120, cy + 25, { steps: 8 });
  await page.mouse.up();
}

test.describe('Mode 1 — Sensory Storm', () => {
  test('wobbly stroke + no undo → Done → beat → Feedback #1', async ({
    page,
  }) => {
    await reachMode1(page);

    // No undo affordance anywhere in Mode 1 (R05-2) — mistakes are permanent.
    await expect(page.getByRole('button', { name: /undo/i })).toHaveCount(0);

    await drawStroke(page);

    // The finished stroke is committed (one onChange per stroke) with >1 point.
    const drawing = await readJson<FreehandDrawing>(page, 'mode1-drawing');
    expect(drawing.kind).toBe('freehand');
    expect(drawing.strokes.length).toBeGreaterThanOrEqual(1);
    expect(drawing.strokes[0].points.length).toBeGreaterThan(1);

    // Done → the puzzled beat → confirm → Feedback #1 (R05-8/R05-9).
    await page.getByTestId('mode1-done').click();
    await expect(page.getByTestId('mode1-complete')).toBeVisible();
    await page.getByTestId('mode1-complete-continue').click();
    await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
      'data-mode',
      '1',
    );
  });

  test('sensory-safety rails: reduce-intensity toggles; Exit is reachable; canvas stays drawable', async ({
    page,
  }) => {
    await reachMode1(page);

    const toggle = page.getByTestId('mode1-reduce-intensity');
    const exit = page.getByRole('button', { name: 'Exit' });
    await expect(toggle).toBeVisible();
    await expect(exit).toBeVisible();

    // Reduce-intensity flips state and stays reachable (R05-10/R05-11).
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // The canvas is still drawable with the rails engaged (notifications never
    // trap input — R05-4).
    await drawStroke(page);
    const drawing = await readJson<FreehandDrawing>(page, 'mode1-drawing');
    expect(drawing.strokes.length).toBeGreaterThanOrEqual(1);

    // Calm Exit leaves to Welcome without penalty (R05-10 / FR-22).
    await exit.click();
    await expect(page.getByTestId('screen-welcome')).toBeVisible();
  });
});
