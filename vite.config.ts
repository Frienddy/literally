/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// vite-plugin-pwa injects a service worker. We skip it under Vitest so unit tests
// don't try to register a SW in jsdom.
const isTest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(isTest
      ? []
      : [
          VitePWA({
            // SW updates in the background; main.tsx just registers it.
            registerType: 'autoUpdate',
            includeAssets: ['icons/*.png', 'robots.txt'],
            manifest: {
              name: 'Literally',
              short_name: 'Literally',
              description:
                'An empathy game: feel the difference between vague, overloaded instructions and clear, structured ones.',
              theme_color: '#eef2f7',
              background_color: '#eef2f7',
              display: 'standalone', // removes browser chrome → fixes edge-swipe-back
              orientation: 'portrait', // honored when installed
              start_url: '/',
              scope: '/',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/icons/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
                {
                  src: '/icons/maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              // Precache the whole app shell → true offline, no runtime network.
              globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
              navigateFallback: '/index.html',
              cleanupOutdatedCaches: true,
            },
            // Lets us verify PWA behavior in `npm run dev`.
            devOptions: { enabled: true },
          }),
        ]),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Keep Playwright specs (tests/e2e) out of the Vitest run.
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/store/**', 'src/lib/**', 'src/engine/**'],
      reporter: ['text', 'html'],
    },
  },
});
