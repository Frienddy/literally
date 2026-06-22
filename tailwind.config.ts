import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { tokens } from './src/styles/tokens';

/**
 * Mobile-first design tokens.
 *
 * This **mirrors** `src/styles/tokens.ts` (the single source of truth, _docs/06
 * §4) into Tailwind's theme so components style themselves with utilities and
 * never hard-code a hex value (PRD-004 R04-1). Add tokens in `tokens.ts`, not here.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...tokens.color,
        guidance: tokens.guidance,
      },
      borderRadius: {
        card: tokens.radius.card,
        button: tokens.radius.button,
      },
      spacing: {
        touch: tokens.space.touch, // 44px min touch target
      },
      fontFamily: {
        body: tokens.font.body.split(',').map((s) => s.trim()),
      },
      fontSize: {
        body: [tokens.font.sizeBody, { lineHeight: tokens.font.lineRelaxed }],
        step: [tokens.font.sizeStep, { lineHeight: tokens.font.lineRelaxed }],
      },
      lineHeight: {
        relaxed: tokens.font.lineRelaxed,
      },
      transitionDuration: {
        // storm → anchor "fog clearing"; node snap micro-pop; giver beat
        theme: `${tokens.motion.themeTransitionMs}ms`,
        snap: `${tokens.motion.snapPopMs}ms`,
        beat: `${tokens.motion.giverBeatMs}ms`,
      },
    },
  },
  plugins: [
    // The one landscape breakpoint (ADR-014): `wide:` utilities switch a screen
    // from the portrait stack to the laptop/desktop side-by-side layout. Added as
    // a custom variant (not a `screens` entry) so Tailwind's `min-*`/`max-*`
    // variants — e.g. Reflection's `max-[340px]:` — keep working. Media query
    // mirrored from `tokens.layout.wideQuery`.
    plugin(({ addVariant }) => {
      addVariant('wide', `@media ${tokens.layout.wideQuery}`);
    }),
  ],
};

export default config;
