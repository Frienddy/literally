import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile-emulated E2E (+ a Desktop Chrome project for the laptop landscape layout,
 * ADR-014). We build + preview the real PWA so the service worker and production
 * gesture-blocking behave as on a device. Real haptics / install / true offline
 * still require a physical device (see _docs/09 §6).
 *
 * `tests/e2e/desktop.spec.ts` is desktop-only (no touch); every other spec is
 * mobile-emulated. The projects partition via testMatch/testIgnore so touch-based
 * flows never run on Desktop Chrome and the desktop layout check never runs on a
 * phone.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      testIgnore: /desktop\.spec\.ts/,
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: /desktop\.spec\.ts/,
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /desktop\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
