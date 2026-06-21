# 06 — UI / UX Specification

Screen-by-screen behavior, wireframes (ASCII), navigation, and the design-token
system. The visual language deliberately reinforces the game's thesis: Mode 1
looks/feels noisy; Mode 2 looks/feels calm and ordered.

---

## 1. Design principles

1. **The UI teaches the lesson.** Mode 1 is visually busy, low-contrast text,
   motion, interruptions. Mode 2 is high-contrast, spacious, still. The *aesthetic
   contrast* mirrors the *cognitive contrast*.
2. **Thumb-first.** Primary actions sit in the bottom third (one-handed reach).
   Min touch target **44×44pt**.
3. **One decision per screen.** Especially in Mode 2 — never two competing CTAs.
4. **Calm by default, intensity opt-in.** First impression (Welcome) is gentle;
   nothing jarring before the player consents to start.
5. **Readable type.** Mode 2 + all framing text use generous size/line-height.
   (Mode 1's vague text is *intentionally* harder — that's content, not a11y debt.)
6. **Show, don't tell.** Assume zero ASD knowledge. The first screen must **not**
   explain the point — it sets up a task and gets out of the way. The explanation
   appears only on Reflection (**the reveal**). The screens make the player
   *feel*, then *name*.
7. **Make the helpful mode *visibly* helpful.** Mode 2 doesn't just *say* the step
   — it *shows* it (pulsing start node, ghosted target path, a completion
   flourish). The contrast with Mode 1's nothing is the whole point.
8. **A warm guide, never a villain.** The instruction-giver mascot is kind in both
   modes; only the *clarity* changes. Difficulty is always framed as the
   instructions' fault, never the player's (ethics, [07](./07-accessibility-and-ethics.md) §2).

## 2. Screen map & navigation

```
Welcome ──Start──▶ Mode1 ──Done──▶ Stress#1 ──Continue──▶ Mode2 ──Finish──▶ Stress#2
   ▲                                                                            │
   │                                                                       Continue
   └──Play again── Reflection ◀──────────────────────────────────────────────┘
                       │  └──View history──▶ History ──Back──▶ Reflection/Welcome
                       └──Export image (v1.1)
```

Navigation is driven by the store FSM (`screen`), not a URL router — there is no
browser history to swipe back through (intentional; see [05](./05-pwa-and-mobile-shell.md)).

## 3. Wireframes

### 3.1 Welcome
```
┌───────────────────────────────┐
│        🙂  Literally          │  ← wordmark + friendly mascot (the grown-up)
│                               │
│  A tiny drawing game.         │
│  Takes about 3 minutes.       │  ← ONE-LINE hook; no lecture (show, don't tell)
│                               │
│                               │
│  ┌─────────────────────────┐  │
│  │        Start            │  │  ← primary, big, bottom third
│  └─────────────────────────┘  │
│                               │
│  [ ▢ Reduce intensity ]       │  ← sensory-safety opt-out (persistent)
│   View past sessions ›        │
│   Add to Home Screen ›        │  ← install guidance (platform-aware)
└───────────────────────────────┘
```

### 3.2 Mode 1 — Sensory Storm
```
┌───────────────────────────────┐
│ ●○○○○             ✕ Exit       │  ← progress · persistent calm-exit
│ 🙂 the grown-up's VAGUE ask:   │  ← warm but assuming; words then fade
│ ░░ Draw a normal house, make ░│  ← vague block, low-contrast, FADING
│ ░░ the walls standard, add a ░│     drifts/scrolls away over ~12s
│ ░░ roof that sticks out... ░░ │
│        ┌─────────────────┐    │  ← fake notification slides in/out
│        │💬 New message    │    │
│        └─────────────────┘    │
│                               │
│                               │
│         (blank canvas,        │  ← freehand, wobble applied,
│          finger drawing)      │     erratic haptics on move,
│                               │     NO grid, NO undo
│                               │
│                               │
│                               │
│                   ( done )    │  ← small-ish, bottom-right
└───────────────────────────────┘
        ↓ on Done (~2s, skippable)
   🙂 "Hmm… not quite what I       ← gentle "not quite right" beat;
      had in mind. But okay!"        blames the instructions, never you
```
Behaviors: text opacity decays; notifications appear every 4–8s (jittered) and
auto-dismiss; haptic `erratic` throttled on move; no Undo anywhere; Exit and
reduce-intensity stay reachable the whole time (sensory safety).

### 3.3 Feedback check — stress + confidence (reused for #1 and #2)
```
┌───────────────────────────────┐
│   How did that feel?          │
│   😌   🙂   😐   😟   😣      │  ← stress: friendly faces (calm → tense)
│                               │
│   How sure are you that you   │
│   did it right?               │
│   🤷   😕   🙂   😀   💯      │  ← confidence: not-sure → very-sure
│                               │
│   ┌─────────────────────────┐ │
│   │        Continue         │ │
│   └─────────────────────────┘ │
└───────────────────────────────┘
```
Faces map to integers 1–10 internally (doc 03). Emoji here are illustrative —
ship a consistent **custom face set** (platform emoji vary by device; §5, §D).
The *confidence* answer is the goal's key signal (low after M1, high after M2).

### 3.4 Mode 2 — Anchor Point
```
┌───────────────────────────────┐
│ ●●●○○                         │  ← top-level progress
│ 🙂 Step 1 of 8                │  ← grown-up, calm & clear · PERSISTENT card
│  ⬇️ From the dot, go down      │
│     4 squares.                │
│                               │
│  · · · · · · · ·              │  ← high-contrast grid
│  · ◉╌╌┐ · · · · ·             │   ◉ pulsing START node for this step
│  · · ╎ · · · · ·              │   ╌╌ faint GHOST of the target move
│  · · ◍ · · · · ·              │   ◍ target node (snaps here → crisp click)
│  · · · · · · · ·              │
│                               │
│  ┌────────┐   ┌────────────┐  │
│  │  Undo  │   │ Next Step ›│  │  ← full control
│  └────────┘   └────────────┘  │
└───────────────────────────────┘
   on final step → 🎉 "Perfect — exactly right!"  (completion moment)
```
Behaviors: exactly one step card visible; `Next Step` advances at player's pace
(no timer); `Undo` reverts last segment; progress "Step X of 8" always shown; the
current step's start node pulses and its target move is ghosted so the player can
*see* where to go.

### 3.5 Reflection
```
┌───────────────────────────────┐
│   Two tries, one little house │
│                               │
│   What you were asked for ↓   │
│        ┌───────────┐          │  ← THE TARGET, revealed for the first time
│        │  🏠 clean │          │
│        └───────────┘          │
│  Without steps    With steps  │
│  ┌───────────┐   ┌───────────┐│  ← M1 attempt (target ghosted behind it)
│  │  wobbly   │   │   clean   ││
│  └───────────┘   └───────────┘│
│  stress 7 · sure? 3  stress 2 · sure? 9
│                               │
│  Same simple task. With clear │
│  steps it was easy; without   │
│  them it was much harder — and│
│  you couldn't even tell if    │
│  you'd done it right.         │
│  This is close to how a noisy │
│  world + unclear instructions │  ← THE REVEAL: ASD named here, never before
│  can feel for an autistic kid.│
│  Clear, literal steps aren't  │
│  extra — they're accessibility│
│                               │
│  [ Share ]  [ History ]  [ ↻ ]│
└───────────────────────────────┘
```

### 3.6 History
```
┌───────────────────────────────┐
│   Past sessions          ‹    │
│  ┌───────────────────────────┐│
│  │ Jun 21 · 7 → 2   [thumbs] ›││  ← tap to open a saved reflection
│  ├───────────────────────────┤│
│  │ Jun 18 · 6 → 3   [thumbs] ›││
│  └───────────────────────────┘│
│                               │
│   Delete all my data          │  ← privacy control (FR-15)
└───────────────────────────────┘
```

## 4. Design tokens

Mirror these in `tailwind.config.ts` and `src/styles/tokens.ts`.

```ts
export const tokens = {
  color: {
    // Shared shell
    bg:        '#0b1020',   // deep calm navy
    surface:   '#141a33',
    text:      '#e7ecff',
    textMuted: '#8b93b8',
    // Mode 1 (storm) — desaturated, low-contrast, uneasy
    stormText: '#5b6384',   // deliberately hard-to-read vague text
    stormWarn: '#b45a5a',
    stormInk:        '#5d6486',  // freehand stroke: legible-yet-effortful (~3.1:1) on storm canvas (DEBT-006)
    stormInkReduced: '#7e87ab',  // raised to ~5:1 under reduced-intensity
    // Mode 2 (anchor) — high contrast, trustworthy
    gridNode:  '#1f6feb',
    ink:       '#0f172a',   // drawing stroke on light canvas
    anchorBg:  '#f8fafc',   // bright, clear canvas
    success:   '#1f9d57',
    primary:   '#3b82f6',
  },
  radius: { card: '16px', button: '14px' },
  space:  { touch: '44px' },        // min touch target
  font: {
    body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    sizeBody: '17px',
    sizeStep: '22px',               // Mode 2 instruction — big & clear
    lineRelaxed: '1.6',
  },
  motion: {
    fadeMs: 12000,                  // Mode 1 instruction decay
    notifyEveryMs: [4000, 8000],    // jittered distraction cadence
    notifyVisibleMs: 2200,
    giverBeatMs: 2000,              // "not quite right" / "Perfect!" beat duration
    themeTransitionMs: 900,         // storm → anchor "fog clearing"
    snapPopMs: 140,                 // node snap micro-pop
  },
  // Two visual worlds (§D). Apply as a wrapper filter/overlay per mode.
  theme: {
    storm:  { canvas: '#11162a', vignette: 0.45, saturate: 0.6, blurPx: 0.4 },
    anchor: { canvas: '#f8fafc', vignette: 0.0,  saturate: 1.0, blurPx: 0.0 },
  },
  // Mode 2 on-grid guidance (§3.4).
  guidance: {
    startNode:  '#1f9d57',          // pulsing start node
    ghostPath:  'rgba(31,111,235,.28)', // faint target hint
    targetNode: '#1f6feb',
  },
} as const;
```

## 5. Typography & contrast rules

- **Framing/Welcome/Reflection/Mode 2:** WCAG AA contrast (≥4.5:1), 17–22px.
- **Mode 1 vague text:** intentionally lower contrast/size to *feel* effortful —
  but this is decorative content the player isn't required to fully read, and an
  accessible alternative is unnecessary because the *difficulty is the point*.
  (Reduced-intensity mode raises its contrast slightly — see doc 07.)
- No text baked into images (i18n + a11y).
- **Icons over emoji (prettiness + consistency).** Platform emoji — directional
  arrows (⬇️➡️), faces (😌💯), notification glyphs (💬🔋) — render differently on
  each device and look unpolished. Ship a small **custom icon + face set** for the
  Mode 2 directions, the feedback-check faces, and the fake notifications.

## 6. Motion & feedback

| Event | Visual | Haptic |
|-------|--------|--------|
| Mode 1 draw | wobbly ink follows finger | erratic buzz (throttled) |
| Mode 1 notification | slide-in top, auto-dismiss | none |
| Mode 1 instruction | opacity/scroll decay over ~12s | none |
| Mode 2 step guidance | start node pulses; faint ghost target path shown | none |
| Mode 2 snap to node | node "pops"; clean segment locks | crisp click (15ms) |
| Mode 2 Next | card swaps with quick, calm transition | none |
| Mode 1 "not quite right" beat | giver mascot looks gently puzzled, ~2s | none (or soft) |
| Mode 2 completion | drawing "finishes"; giver beams; gentle flourish | soft confirm |
| Storm → Anchor | "fog clearing" transition (~900ms) | none |
| Target reveal (Reflection) | intended result fades in; ghosts behind M1 attempt | none |
| Feedback submit | gentle confirm | none |

All motion respects `prefers-reduced-motion` (doc 05/07).

## 7. Component inventory (maps to `src/components/`)

`Button` (primary/secondary/ghost) · `Canvas` · `DrawingPreview` (read-only) ·
`RatingScale` (emoji faces — reused for stress & confidence) · `Notification`/`Toast` ·
`StepCard` · `ProgressDots` · `FlowProgress` (top-level 5-step indicator) ·
`GuideMascot` (the grown-up) · `GiverBeat` (puzzled / "Perfect!" overlay) ·
`TargetReveal` (intended result + ghost overlay) · `ExitButton` (Mode 1) ·
`PortraitGuard` · `InstallHint`.

## 8. Copy deck location

All strings live in `src/content/strings.ts`; Mode 1 vague text in
`mode1.instructions.ts`; Mode 2 steps in `mode2.steps.ts`; notification set in
`notifications.ts`. This keeps copy reviewable (ethics) and translatable without
touching components. Tone rules: [01-game-design.md](./01-game-design.md) §8 and
[07-accessibility-and-ethics.md](./07-accessibility-and-ethics.md).
