import type { Config } from 'tailwindcss';

/**
 * Mobile-first design tokens.
 *
 * NOTE: this is the Phase-0 *stub* seeded from PRD-001 §5. The full token set
 * (the two visual themes, type scale, spacing rhythm) is finalized in PRD-004
 * (Design System & Navigation). Keep additions here mirrored in
 * `src/styles/tokens.ts` once that file is introduced.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // App shell base (matches manifest theme/background + index.html theme-color).
        ink: '#0b1020',
      },
    },
  },
  plugins: [],
};

export default config;
