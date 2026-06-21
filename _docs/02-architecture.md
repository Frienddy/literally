# 02 — Technical Architecture

How the code is organized, why each technology was chosen, and the folder
structure for the fully offline React app.

---

## 1. Tech stack & rationale

| Concern | Choice | Why |
|---------|--------|-----|
| UI framework | **React 18** | Component model fits screen-based flow; huge ecosystem; concurrent rendering keeps UI smooth while canvas draws |
| Language | **TypeScript** | The `GameSession` schema and canvas math benefit hugely from types; fewer runtime surprises offline |
| Build tool | **Vite** | Fast dev/HMR, first-class PWA plugin, tiny optimized output |
| Styling | **Tailwind CSS** | Mobile-first utilities, design tokens via config, no runtime CSS-in-JS cost |
| State + storage | **Zustand + `persist`** | Tiny (~1KB), no boilerplate, `persist` middleware writes to storage automatically — ideal for "survive reload" requirement |
| Drawing | **HTML5 Canvas 2D** | Imperative pixel control needed for low-latency freehand + wobble + grid; cheaper than SVG for many points |
| Haptics | **`navigator.vibrate()`** | Native browser haptics, no dependency (degrades where unsupported) |
| PWA | **`vite-plugin-pwa` (Workbox)** | Generates manifest + service worker; precaches the app shell for true offline |
| IDs | **`crypto.randomUUID()`** | Built-in, no `uuid` dependency needed on modern targets |
| Testing | **Vitest + React Testing Library + Playwright** | Unit/component + real mobile-emulated E2E for touch/gestures |

**Deliberately avoided:** any backend, any auth SDK, any analytics SDK, any
network data layer (React Query/axios), heavy canvas libs (Konva/Fabric) — they'd
bloat the bundle and we need bespoke wobble/snap behavior anyway.

## 2. Architectural principles

1. **Local-first, network-never (at runtime).** No `fetch` to app servers. The
   service worker serves everything; the app must run in airplane mode.
2. **Single source of truth = the Zustand store.** Screens are thin; they read
   state and dispatch actions. Drawing data flows store → canvas and back.
3. **The canvas is a controlled, imperative island.** Wrapped by the `useCanvas`
   hook ([04](./04-canvas-engine.md)); React never re-renders per stroke point.
   Only mode/session-level state is reactive.
4. **Content is data, not JSX — and "show, don't tell" is enforced by structure.**
   All player-facing strings + instruction sequences live in `src/content/` so
   they're reviewable (ethics/sensitivity) and i18n-ready without touching
   components. The split matters: `welcome.copy.ts` is deliberately minimal and
   must **not** explain or name ASD, while `reveal.ts` is the one place the point
   is stated. The pedagogy is guarded by *where the words live*, not just discipline.
5. **Feature-first folders.** Each mode is a self-contained feature; shared
   primitives live in `components/` and `hooks/`.
6. **Progressive enhancement for device APIs.** Haptics, install prompt, and
   orientation lock all feature-detect and degrade gracefully.

## 3. Folder structure

```
literally/
├── public/
│   ├── icons/                     # PWA icons (192, 512, maskable, apple-touch)
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── maskable-512.png
│   ├── robots.txt
│   └── offline-fallback.html      # optional last-resort offline page
│
├── src/
│   ├── main.tsx                   # React root; registers SW; mounts <App/>
│   ├── App.tsx                    # Top-level router/state-machine switch on `screen`
│   ├── index.css                  # Tailwind directives + global gesture-blocking CSS
│   │
│   ├── app/
│   │   ├── routes.ts              # Screen enum + transition map (welcome→mode1→…)
│   │   └── ScreenRouter.tsx       # Renders the active screen from store.screen
│   │
│   ├── layout/
│   │   ├── AppShell.tsx           # Mobile shell: portrait lock, safe-areas, gesture block  ← see doc 05
│   │   ├── PortraitGuard.tsx      # "Please rotate to portrait" interstitial (landscape)
│   │   └── SafeArea.tsx           # env(safe-area-inset-*) padding wrapper
│   │
│   ├── screens/                   # One folder per screen in the flow (doc 01 §7)
│   │   ├── welcome/
│   │   │   └── WelcomeScreen.tsx  # Intro + honest framing + sensory-safety opt-out
│   │   ├── mode1/
│   │   │   ├── SensoryStormScreen.tsx
│   │   │   ├── VagueInstruction.tsx     # fading/scrolling text block
│   │   │   └── FakeNotifications.tsx    # distraction layer
│   │   ├── mode2/
│   │   │   ├── AnchorPointScreen.tsx
│   │   │   └── StepInstruction.tsx      # one-card-at-a-time + Next/Undo
│   │   ├── feedback/
│   │   │   └── FeedbackCheckScreen.tsx  # stress + confidence; reused for #1 and #2
│   │   ├── reflection/
│   │   │   └── ReflectionScreen.tsx     # side-by-side compare + debrief
│   │   └── history/
│   │       └── HistoryScreen.tsx        # past sessions list + detail
│   │
│   ├── components/                # Shared, presentational, dumb
│   │   ├── Canvas.tsx             # <canvas> wrapper that wires up useCanvas
│   │   ├── DrawingPreview.tsx     # renders a saved drawing (read-only) for reflection/history
│   │   ├── Button.tsx
│   │   ├── RatingScale.tsx        # emoji-face 1–10 input (stress & confidence)
│   │   ├── GuideMascot.tsx        # the Grown-up (vague / clear / beat states)
│   │   ├── TargetReveal.tsx       # intended result + ghost overlay (reflection)
│   │   ├── FlowProgress.tsx       # top-level 5-step indicator
│   │   ├── Toast/Notification.tsx
│   │   └── ProgressDots.tsx
│   │
│   ├── hooks/
│   │   ├── useCanvas.ts           # ★ core drawing hook: freehand + snap-to-grid  ← see doc 04
│   │   ├── useHaptics.ts          # navigator.vibrate wrapper w/ feature-detect + throttle
│   │   ├── usePreventGestures.ts  # JS-side pull-to-refresh / overscroll guards
│   │   ├── useOrientation.ts      # portrait/landscape detection
│   │   └── useInstallPrompt.ts    # beforeinstallprompt handling (Android)
│   │
│   ├── store/
│   │   ├── gameStore.ts           # ★ Zustand store + persist (sessions, screen, draft) ← see doc 03
│   │   ├── selectors.ts           # memoized selectors
│   │   └── migrations.ts          # schema-version migrations for persisted data
│   │
│   ├── engine/                    # Pure, framework-free drawing logic (unit-testable)
│   │   ├── wobble.ts              # stroke noise algorithm (Mode 1)
│   │   ├── snap.ts                # nearest-node snapping (Mode 2)
│   │   ├── geometry.ts            # points, distance, grid math
│   │   └── render.ts              # draw paths / grid to a 2D context (shared by live + preview)
│   │
│   ├── content/                   # All copy + instruction data (review/i18n)
│   │   ├── strings.ts             # every player-facing string
│   │   ├── welcome.copy.ts        # minimal, no-spoiler setup — must NOT name ASD
│   │   ├── giver.copy.ts          # the Grown-up's lines: vague (M1) vs clear (M2) + beats
│   │   ├── tasks.ts               # task pool (house/cat/flower): vague text + grid target
│   │   ├── mode1.instructions.ts  # the vague block(s)
│   │   ├── mode2.steps.ts         # the ordered step cards (+ target coords)
│   │   ├── reveal.ts              # the Reflection "reveal": the ONLY place ASD is named
│   │   └── notifications.ts       # fake-notification copy set
│   │
│   ├── types/
│   │   ├── session.ts             # GameSession, DrawingData, Point, GridNode, etc. ← see doc 03
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── id.ts                  # uuid() via crypto.randomUUID with fallback
│   │   ├── time.ts                # timestamp helpers
│   │   └── exportImage.ts         # render comparison to a PNG/blob (FR-14)
│   │
│   └── styles/
│       └── tokens.ts              # design tokens mirrored from tailwind.config
│
├── tests/
│   ├── unit/                      # engine + store (Vitest)
│   └── e2e/                       # Playwright mobile-emulated flows
│
├── index.html                     # viewport-fit=cover, theme-color, no user-scalable
├── vite.config.ts                 # Vite + vite-plugin-pwa config            ← see doc 05
├── tailwind.config.ts             # mobile-first tokens
├── tsconfig.json
├── package.json
└── README.md
```

## 4. Data & control flow

```
   ┌──────────────┐        actions         ┌───────────────────────┐
   │   Screens    │ ──────────────────────▶│   gameStore (Zustand) │
   │ (React tree) │ ◀──────────────────────│  - screen (FSM)       │
   └──────┬───────┘     reactive state     │  - draft session      │
          │                                │  - sessions[]         │
          │ ref + callbacks                │  persist → storage    │
          ▼                                └───────────┬───────────┘
   ┌──────────────┐                                    │ on mode complete:
   │  <Canvas/>   │  imperative (no React re-render)   │ commit drawingData
   │  useCanvas   │───────────────────────────────────▶│
   │  engine/*    │  freehand+wobble  /  snap+haptic   │
   └──────────────┘                                    ▼
                                            localStorage / IndexedDB
                                            (survives reload, offline)
```

- During a stroke, points accumulate **inside the hook** (ref), not in React
  state — that's how we keep input latency near one frame.
- On **mode completion**, the hook hands the finished `DrawingData` to the store,
  which writes it into the draft session and persists.

## 5. Rendering strategy (latency)

- One `<canvas>` per drawing screen. Draw on `requestAnimationFrame`, not per
  pointer event.
- Use **Pointer Events** (`pointerdown/move/up`) with `{ passive: false }` only
  where we must `preventDefault`; set `touch-action: none` on the canvas so the
  browser doesn't fight us for the gesture.
- Handle **devicePixelRatio**: size the canvas backing store to `cssSize * dpr`
  and scale the context, so lines are crisp on retina without blurring.
- Keep the live drawing on the main canvas; render **saved** drawings (reflection
  / history) via the shared `engine/render.ts` onto separate read-only canvases.

Full hook implementation: [04-canvas-engine.md](./04-canvas-engine.md).

## 6. Configuration surface

Tunables that designers/playtesters will touch live in `content/` and a single
`src/config.ts` (e.g., wobble amplitude, notification cadence, grid size, fade
timings, haptic patterns) so tuning never requires hunting through components.

## 7. Build & tooling notes

- `npm run dev` — Vite dev server (PWA in dev via plugin's `devOptions`).
- `npm run build` — production build + SW generation.
- `npm run preview` — serve the built PWA to test offline/install on a phone
  (use your LAN IP + HTTPS or a tunnel; service workers need a secure context).
- Lint/format: ESLint + Prettier (config in repo root). Strict TS (`"strict": true`).
