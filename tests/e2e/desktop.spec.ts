import { test, expect } from '@playwright/test';

/**
 * Laptop / desktop landscape support (ADR-014). A desktop window is always
 * "landscape", so before this change every laptop user was stuck on the
 * phone-only PortraitGuard. Here we assert the opposite: the app renders, lays
 * out via the `wide:` breakpoint, and is playable with a mouse. Runs only under
 * the Desktop Chrome project (no touch) — see playwright.config.ts.
 */
test.describe('laptop / desktop landscape (ADR-014)', () => {
  test('renders the app (no rotate prompt) and lays out wide', async ({
    page,
  }) => {
    await page.goto('/');

    // The phone-only guard must NOT appear on a desktop (always landscape).
    await expect(
      page.getByText('Please rotate your phone to portrait.'),
    ).toBeHidden();

    // The app itself renders.
    const welcome = page.getByTestId('screen-welcome');
    await expect(welcome).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Literally' }),
    ).toBeVisible();

    // The `wide:` breakpoint is active: Welcome adopts its two-column (row)
    // landscape layout instead of the portrait stack.
    await expect(welcome).toHaveCSS('flex-direction', 'row');

    // And it's interactive with a mouse: Start advances the FSM into Mode 1.
    await page.getByTestId('welcome-start').click();
    await expect(page.getByTestId('screen-mode1')).toBeVisible();
  });
});
