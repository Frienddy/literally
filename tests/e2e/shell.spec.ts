import { test, expect } from '@playwright/test';

test.describe('rigid mobile shell', () => {
  test('renders the shell and locks the document frame', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Literally' }),
    ).toBeVisible();

    // #root is a fixed, non-scrolling frame (no document scroll/bounce).
    const rootPosition = await page
      .locator('#root')
      .evaluate((el) => getComputedStyle(el).position);
    expect(rootPosition).toBe('fixed');

    // Text selection is disabled app-wide. WebKit reports this under the
    // `-webkit-` prefix, so read both.
    const userSelect = await page.evaluate(() => {
      const s = getComputedStyle(document.body) as CSSStyleDeclaration & {
        webkitUserSelect?: string;
      };
      return s.userSelect || s.webkitUserSelect;
    });
    expect(userSelect).toBe('none');

    // The frame can't scroll: nothing overflows the viewport and a scroll
    // attempt leaves scrollY at 0. (Pull-to-refresh / overscroll prevention
    // itself is verified manually on real devices, _docs/09.)
    const scrollY = await page.evaluate(() => {
      window.scrollBy(0, 1000);
      return window.scrollY;
    });
    expect(scrollY).toBe(0);
  });

  test('enforces portrait via the PortraitGuard', async ({ page }) => {
    const guard = page.getByText('Please rotate your phone to portrait.');

    await page.setViewportSize({ width: 844, height: 390 }); // landscape
    await page.goto('/');
    await expect(guard).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 }); // portrait
    await expect(guard).toBeHidden();
    await expect(
      page.getByRole('heading', { name: 'Literally' }),
    ).toBeVisible();
  });
});
