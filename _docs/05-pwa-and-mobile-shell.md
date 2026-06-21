# 05 — PWA & Mobile Shell

Everything that makes "Literally" feel like a native, offline, portrait-locked
app: the install/offline plumbing (manifest + service worker) and the rigid
mobile shell that blocks pull-to-refresh, overscroll, text selection, and
edge-swipe back. The `AppShell` layout component is an explicit spec deliverable.

> Beyond feel, the locked-down shell protects the *experiential* design: a
> pull-to-refresh, an accidental back-swipe, or a text-selection popover mid-Mode-1
> would shatter the immersion that "show, don't tell" depends on. The shell keeps
> the player *inside* the experience until the reveal. (See [01](./01-game-design.md) §1.1.)

---

## 1. Gesture-blocking strategy (defense in depth)

We block default browser behaviors at **three** layers — CSS, viewport meta, and
JS — because no single layer covers every browser.

### 1.1 Global CSS — `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---- Rigid mobile shell: block native gestures everywhere by default ---- */
html, body, #root {
  height: 100%;
  margin: 0;
  overscroll-behavior: none;     /* kill pull-to-refresh & scroll chaining */
  -webkit-user-select: none;
  user-select: none;             /* no text selection / callout */
  -webkit-touch-callout: none;   /* no iOS long-press menu */
  touch-action: pan-y;           /* allow vertical scroll in scrollable areas only */
  -webkit-tap-highlight-color: transparent;
}

/* Lock the app frame: no document scroll; screens manage their own overflow. */
#root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  overscroll-behavior: none;
}

/* The drawing surface must own the gesture entirely. */
canvas {
  touch-action: none;            /* no pan/zoom/scroll while drawing */
  display: block;
}

/* Inputs are the one place selection is OK (none here today, but future-proof). */
input, textarea {
  -webkit-user-select: text;
  user-select: text;
}

/* Respect users who ask for less motion (sensory safety, see doc 07). */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

### 1.2 Viewport meta — `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <!-- viewport-fit=cover → use full screen incl. notch; no user zoom -->
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <meta name="theme-color" content="#0b1020" />
    <!-- iOS standalone niceties -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <title>Literally</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 1.3 JS guard — `src/hooks/usePreventGestures.ts`

Belt-and-suspenders for browsers that ignore `overscroll-behavior`, and to stop
iOS pinch-zoom / double-tap zoom which CSS can't fully prevent.

```ts
import { useEffect } from 'react';

/** Blocks pull-to-refresh, rubber-band overscroll, pinch & double-tap zoom. */
export function usePreventGestures() {
  useEffect(() => {
    // Prevent multi-touch pinch zoom (iOS Safari ignores user-scalable=no in PWAs sometimes).
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    // Prevent double-tap-to-zoom.
    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const tNow = e.timeStamp;
      if (tNow - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = tNow;
    };
    // Block gesture* events (older iOS pinch).
    const onGesture = (e: Event) => e.preventDefault();

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('gesturestart', onGesture as EventListener);

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('gesturestart', onGesture as EventListener);
    };
  }, []);
}
```

> **Edge-swipe back navigation:** there is no reliable web API to fully disable
> iOS Safari's edge-swipe-back. Our mitigations: (a) **install as PWA**
> (`display: standalone`) removes browser chrome and the back-swipe entirely;
> (b) the app is a single-document state machine (no real history stack to swipe
> back through); (c) `overscroll-behavior-x: none`. We document the install path
> prominently because standalone mode is the real fix. (See ADR-004.)

## 2. The `AppShell` layout component — `src/layout/AppShell.tsx`

Wraps the whole app: applies the JS gesture guard, enforces portrait, and pads
for device safe-areas (notch / home indicator).

```tsx
import { ReactNode } from 'react';
import { usePreventGestures } from '../hooks/usePreventGestures';
import { useOrientation } from '../hooks/useOrientation';
import { PortraitGuard } from './PortraitGuard';

export function AppShell({ children }: { children: ReactNode }) {
  usePreventGestures();
  const orientation = useOrientation();

  return (
    <div
      className="
        fixed inset-0 overflow-hidden
        bg-[#0b1020] text-slate-100
        select-none touch-none
        flex flex-col
      "
      style={{
        // honor notch / home-indicator insets
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {orientation === 'landscape' ? <PortraitGuard /> : children}
    </div>
  );
}
```

### 2.1 Portrait enforcement — `src/hooks/useOrientation.ts` + `PortraitGuard.tsx`

```ts
// useOrientation.ts
import { useEffect, useState } from 'react';

export function useOrientation(): 'portrait' | 'landscape' {
  const get = () =>
    window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  const [o, setO] = useState<'portrait' | 'landscape'>(get);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = () => setO(get());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return o;
}
```

```tsx
// PortraitGuard.tsx — shown only in landscape
export function PortraitGuard() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl" aria-hidden>📱↻</div>
      <p className="text-lg font-medium">Please rotate your phone to portrait.</p>
      <p className="text-sm text-slate-400">Literally is designed to be held upright.</p>
    </div>
  );
}
```

> **Orientation lock note:** the Screen Orientation API
> (`screen.orientation.lock('portrait')`) only works in **installed/standalone
> fullscreen** PWAs on Android, and not at all on iOS Safari. So we *also*
> declare `"orientation": "portrait"` in the manifest (effective when installed)
> **and** keep `PortraitGuard` as the universal fallback in-browser. Call
> `screen.orientation.lock?.('portrait').catch(() => {})` opportunistically on
> first user gesture; never depend on it.

## 3. PWA manifest & service worker — `vite.config.ts`

Using `vite-plugin-pwa` (Workbox) to generate the manifest and a precaching
service worker so the app is installable and fully offline after first load.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Literally',
        short_name: 'Literally',
        description:
          'An empathy game: feel the difference between vague, overloaded instructions and clear, structured ones.',
        theme_color: '#0b1020',
        background_color: '#0b1020',
        display: 'standalone',        // removes browser chrome → fixes edge-swipe-back
        orientation: 'portrait',      // honored when installed
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the whole app shell → true offline. No runtime network needed.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: true },  // test PWA behavior in `npm run dev`
    }),
  ],
});
```

### Registering the SW — `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// autoUpdate: SW updates in the background; we just need to register it.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

## 4. Haptics — `src/hooks/useHaptics.ts`

A thin, feature-detecting wrapper so the rest of the app never touches
`navigator.vibrate` directly. Honors the sensory-safety toggle and reduced
intensity.

```ts
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

// Pattern presets — tune in playtests (kept in one place).
const PATTERNS = {
  erratic: [10, 30, 15, 40] as number[], // Mode 1 "move": arrhythmic, unpleasant
  click: 15,                             // Mode 2 "snap": crisp, satisfying
  softClick: 8,                          // reduced-intensity variant
} as const;

const supported =
  typeof navigator !== 'undefined' && 'vibrate' in navigator;

export function useHaptics() {
  const reduced = useGameStore((s) => s.reducedIntensity);

  const vibrate = useCallback(
    (kind: 'move' | 'snap') => {
      if (!supported) return; // e.g. iOS Safari → no-op (visual feedback carries it)
      if (kind === 'snap') {
        navigator.vibrate(reduced ? PATTERNS.softClick : PATTERNS.click);
      } else if (!reduced) {
        navigator.vibrate(PATTERNS.erratic); // suppressed in reduced-intensity mode
      }
    },
    [reduced],
  );

  return { vibrate, supported };
}
```

> **Platform reality:** `navigator.vibrate` works on **Android Chrome** but is
> **not implemented in iOS Safari** (no Web Vibration on iPhone). We therefore
> treat haptics as an *enhancement layer*: Mode 1's discomfort and Mode 2's
> satisfaction must still read through **visual + motion** design alone. We never
> gate progression on haptics. (See ADR-003.)

## 5. Install prompt (Android) — `src/hooks/useInstallPrompt.ts`

```ts
import { useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();           // stash it; we trigger it from our own UI
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const promptInstall = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  };

  return { canInstall: !!deferred, promptInstall };
}
```

> iOS has no `beforeinstallprompt`; show platform-specific guidance instead
> ("Tap Share → Add to Home Screen"). The Welcome screen surfaces this.

## 6. Mobile shell checklist

- [ ] `overscroll-behavior: none` on html/body/#root (no pull-to-refresh)
- [ ] `user-select: none` + `-webkit-touch-callout: none` (no selection menu)
- [ ] `touch-action: none` on `<canvas>`; `preventDefault` in pointer handlers
- [ ] `#root { position: fixed; inset: 0; overflow: hidden }` (no doc scroll/bounce)
- [ ] `usePreventGestures` blocks pinch + double-tap zoom
- [ ] `viewport` meta: `user-scalable=no, viewport-fit=cover`
- [ ] `safe-area-inset-*` padding in `AppShell`
- [ ] manifest `display: standalone`, `orientation: portrait`
- [ ] `PortraitGuard` fallback for in-browser landscape
- [ ] SW precaches shell; verified working in airplane mode
- [ ] Tested as **installed** app on a real iPhone *and* Android device
