import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility gate (PRD-010 R10-7/R10-8/R10-9, PRD-011 R11-4).
 *
 * `axe-core` scans every player-facing surface — Welcome, Mode 1, the Stress
 * check, Mode 2, and Reflection — for WCAG 2.0/2.1 A + AA violations. We fail on
 * `serious`/`critical` impact ("zero serious violations", _docs/09 §5).
 *
 * Since ADR-015 collapsed both modes onto one high-contrast snap-to-grid canvas,
 * Mode 1 is no longer a deliberately low-contrast "storm" surface — it shares
 * Mode 2's components and is held to the same accessibility bar. (The earlier
 * documented exception for Mode 1's fading vague text no longer applies.)
 *
 * Note: real screen-reader passes (VoiceOver / TalkBack) remain a manual,
 * real-device gate (_docs/09 §6) — axe verifies structure, not the lived SR
 * experience.
 */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING = new Set(['serious', 'critical']);

async function scan(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_AA)
    .analyze();
  const blocking = violations.filter((v) => BLOCKING.has(v.impact ?? ''));
  const summary = blocking
    .map(
      (v) =>
        `  • [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))\n` +
        v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n'),
    )
    .join('\n');
  expect(
    blocking,
    `${label} has serious/critical a11y violations:\n${summary}`,
  ).toEqual([]);
}

// --- flow helpers (mirror tests/e2e/flow.spec.ts) -------------------------------

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

async function rate(page: Page) {
  await page.getByTestId('feedback-stress').getByRole('radio').nth(4).click();
  await page
    .getByTestId('feedback-confidence')
    .getByRole('radio')
    .nth(2)
    .click();
}

async function gotoWelcome(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('screen-welcome')).toBeVisible();
}

/** Welcome → Mode 1 (waits for the live grid canvas to settle). */
async function gotoMode1(page: Page) {
  await gotoWelcome(page);
  await page.getByTestId('welcome-start').click();
  await expect(page.getByTestId('screen-mode1')).toBeVisible();
  await expect(page.getByTestId('mode1-canvas')).toBeVisible();
}

/** Welcome → Mode 1 → Done → the Stress check (Feedback #1). */
async function gotoStressCheck(page: Page) {
  await gotoMode1(page);
  await page.getByTestId('mode1-done').click();
  await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
    'data-mode',
    '1',
  );
}

/** …rate Feedback #1 → Mode 2 (waits for the live grid canvas to settle). */
async function gotoMode2(page: Page) {
  await gotoStressCheck(page);
  await rate(page);
  await page.getByTestId('feedback-continue').click();
  await expect(page.getByTestId('screen-mode2')).toBeVisible();
  await expect(page.getByTestId('mode2-canvas')).toBeVisible();
}

/** …draw Mode 2's steps → confirm beat → rate Feedback #2 → Reflection. */
async function gotoReflection(page: Page) {
  await gotoMode2(page);
  // No Next button — each finished line auto-advances (ADR-015); draw all the
  // authored steps, then confirm the completion beat.
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
  }
  await page.getByTestId('mode2-complete-continue').click();
  await expect(page.getByTestId('screen-feedback')).toHaveAttribute(
    'data-mode',
    '2',
  );
  await rate(page);
  await page.getByTestId('feedback-continue').click();
  await expect(page.getByTestId('screen-reflection')).toBeVisible();
}

// --- the gate -------------------------------------------------------------------

test.describe('accessibility (axe-core, non-deliberate surfaces)', () => {
  test('Welcome has no serious/critical violations', async ({ page }) => {
    await gotoWelcome(page);
    await scan(page, 'Welcome');
  });

  test('Mode 1 has no serious/critical violations', async ({ page }) => {
    await gotoMode1(page);
    await scan(page, 'Mode 1 (without clear instruction)');
  });

  test('Stress check has no serious/critical violations', async ({ page }) => {
    await gotoStressCheck(page);
    await scan(page, 'Stress check (Feedback #1)');
  });

  test('Mode 2 has no serious/critical violations', async ({ page }) => {
    await gotoMode2(page);
    await scan(page, 'Mode 2 (Anchor Point)');
  });

  test('Reflection has no serious/critical violations', async ({ page }) => {
    await gotoReflection(page);
    await scan(page, 'Reflection (the reveal)');
  });

  test('both live drawing canvases carry an accessible label (R10-9)', async ({
    page,
  }) => {
    // Mode 1 snap-to-grid canvas.
    await gotoMode1(page);
    await expect(page.getByTestId('mode1-canvas')).toHaveAttribute(
      'aria-label',
      /.+/,
    );

    // Mode 2 snap-to-grid canvas (the gap this PRD closed).
    await gotoMode2(page);
    await expect(page.getByTestId('mode2-canvas')).toHaveAttribute(
      'aria-label',
      /.+/,
    );
  });
});
