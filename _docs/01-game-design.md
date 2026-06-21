# 01 — Game Design Document (GDD)

This is the second-by-second design of the experience. It is the source of truth
for *what the player sees, feels, and does*. Implementation details live in docs
02–06; this doc is intentionally about **design intent and behavior**.

---

## 1. Design philosophy

The whole game is **one contrast**: the *same task*, performed under two opposite
regimes — **without clear instruction** (Mode 1) and **with clear instruction**
(Mode 2). We never tell the player "this is what autism is like." We let the
**difference between the two playthroughs** speak. Every mechanic in each mode is
chosen to push an emotional target:

| | Mode 1 — Sensory Storm | Mode 2 — Anchor Point |
|---|------------------------|------------------------|
| **Instruction** | *Without* clear instruction — you're never quite told what to do | *With* clear instruction — told exactly what to do, one step at a time |
| **Emotional target** | Mild frustration, ambiguity, loss of control, "did I get it right?" | Calm, predictability, mastery, "I know exactly what to do" |
| **Information** | One vague blob, fades from memory | One literal step at a time, persistent |
| **Input feel** | Wobbly, imprecise, no undo | Snaps cleanly, fully reversible |
| **Sensory layer** | Erratic haptics + visual interruptions | Crisp confirming haptics, nothing else |
| **Control** | Low (no undo, text disappears, time-ish pressure) | Total (undo, next-at-your-pace, no timers) |

> **Golden rule:** Mode 1 should be *mildly* uncomfortable, never traumatic. We
> aim for "ugh, that was annoying and confusing," not panic. Intensity is
> tunable and safety-gated — see [07-accessibility-and-ethics.md](./07-accessibility-and-ethics.md).

### 1.1 Audience & the "show, don't tell" contract

The primary player **knows nothing about autism** and can't say how an autistic
person experiences the world. That shapes everything:

- **No lecture, ever — before play.** The welcome gives only a minimal, honest
  setup ("follow the instructions, notice how it feels, we'll explain after") and
  a sensory-safety opt-out. We do **not** name ASD or state the point up front.
- **The two modes are literally "without instruction" vs "with instruction."**
  Mode 1 never quite tells you what to do; Mode 2 tells you exactly, one literal
  step at a time. The player *discovers* the gap in their own body.
- **The reveal comes last.** Only on the Reflection screen do we name autism and
  connect what they *felt* to what many autistic people navigate — and frame
  clear, literal communication as accessibility. **Felt first, named after.**

This is a pedagogy decision, not just tone: front-loading an explanation would
blunt the discovery and risk priming stereotypes. See
[ADR-008](./10-glossary-and-decisions.md) and [07](./07-accessibility-and-ethics.md).

## 2. The shared task

The player is cast as **a kid given a simple task by a grown-up** (see §2.1). Both
modes ask them to draw **the same subject**, so the two results are directly
comparable. The subject is an everyday child's task — the canonical one is
**"draw your house for art class"** — and a small **task pool** (house, cat,
flower) is picked at random per session so replays and group play differ (OQ-1).
Whatever is picked, **both modes use the same subject**.

**There is one intended result** — the clean version Mode 2 builds — and it is the
*same* target in both modes. The twist is who gets to know it:

- In **Mode 1** the target is **never clearly communicated.** The grown-up only
  describes it *vaguely* ("a normal house, walls standard, a roof that sticks out
  a bit…"), shows no reference image, and gives no grid. The player has to guess
  what "right" even means.
- In **Mode 2** the grown-up specifies the *exact same target* as precise, literal
  grid moves ("From the dot, go down 4 squares…").

Because the target is identical but only *one* mode makes it knowable, the
Reflection can reveal the intended result and show the player how far the Mode 1
attempt fell short — **not because they failed, but because the instructions did**
(the reveal; §6, ethics in [07](./07-accessibility-and-ethics.md)).

### 2.1 The instruction-giver ("the Grown-up")

A single, warm character assigns the task in both modes — a kind teacher or parent.
They are **well-meaning in both modes**; the only thing that changes is *clarity*,
not attitude:

- **Mode 1 — vague & assuming.** "Just draw a nice house, you know what I mean,
  sweetie." Friendly, but assumes shared context the player doesn't have. The words
  then drift off and fade (memory decay, §3.2).
- **Mode 2 — clear & patient.** Calm, literal, one step at a time, happy to wait.

The Grown-up is **never a villain and never blames the player.** That is the whole
empathy point: *well-intentioned people give unclear instructions without realizing
how hard they make a "simple" task.* The character may appear as a small friendly
mascot/illustration (see [06](./06-ui-ux-spec.md)). Persona and voice are content
decisions; the ethical guardrails live in [07](./07-accessibility-and-ethics.md) §2.

Keeping the subject, the target, and the giver identical across modes is what makes
the side-by-side reflection land.

---

## 3. Mode 1 — "Sensory Storm" (simulating overload)

**Goal:** mild frustration, ambiguity, lack of control.

### 3.1 Canvas behavior
- **Blank canvas.** No grid, no guides, no reference image.
- **Freehand only.** Finger draws a continuous stroke.
- **Intentional wobble.** Each stroke has a small, deterministic-but-organic
  noise added perpendicular to the drawing direction, so lines come out slightly
  shaky even for a steady hand. The wobble is subtle (a few px) — enough to feel
  "off," not enough to be unusable. (Algorithm in [04-canvas-engine.md](./04-canvas-engine.md) §Wobble.)
- **No Undo.** Mistakes are permanent. This is deliberate — it removes the safety
  net and reinforces lack of control.
- **No clear "done" target.** The player decides when it's "good enough," which
  itself produces uncertainty.

### 3.2 Instruction delivery (memory decay)
- A **single large block of vague text** appears, e.g.:
  > "Draw a normal house. Make the walls a standard size. Add a roof that sticks
  > out a bit. Put a door somewhere sensible and maybe a window or two. Don't
  > make it too big or too small."
- The text **fades out / drifts away over time** (auto-scroll or opacity decay)
  to simulate working-memory load: you can't keep re-reading it, you have to act
  from a fuzzy recollection.
- Suggested timing: fully legible ~3s, then begins fading, gone by ~12–15s. The
  player can start drawing immediately; the clock is ambient, not a hard timer
  with a fail state.
- **No way to summon it back** (no "show instructions again" button). The loss is
  the point.

### 3.3 Haptic feedback (erratic)
- Bound to **`touchmove`** — i.e., it buzzes *while you draw*.
- Pattern is **arrhythmic and unpleasant**, e.g. `navigator.vibrate([10, 30, 15, 40])`.
- Throttled so we don't call `vibrate` on every single move event (perf + it
  shouldn't be a constant drone). Suggested: fire an erratic pattern roughly
  every 250–450ms of active movement, with the interval itself jittered.
- Gracefully no-ops where unsupported (iOS Safari).

### 3.4 UI distractions
- Periodically, **fake "push notifications"** slide in from the top and auto-
  dismiss, e.g. "🔋 Battery 20%", "💬 New message", "☁️ Backup paused".
- They **briefly overlap** the screen to break focus, then leave. They are
  non-interactive (tapping does nothing meaningful) and never block drawing
  permanently.
- Cadence: jittered, e.g. one every 4–8s during Mode 1. They must **never**
  cover the whole canvas or trap input.
- Optional subtle floating elements (a drifting dot, a flicker) may add ambient
  unease — kept tasteful and reduced-motion aware.

### 3.5 Mode 1 exit & the "not quite right" beat
- A single, slightly-too-small **"Done"** affordance (still easily tappable for
  a11y — we fake the *feeling* of imprecision, not actual inaccessibility).
- A small, **persistent calm-exit** ("✕ Exit") and the reduce-intensity control stay
  reachable throughout (sensory safety must survive the chaos — [07](./07-accessibility-and-ethics.md) §3).
- On Done, the Grown-up gives a brief, **mildly-puzzled** reaction —
  "Hmm… that's not quite what I had in mind. But okay!" — warm, never harsh, shown
  ~2s and skippable. This simulates *being misunderstood despite trying*, the heart
  of "a simple task is hard without clear instructions." It must read as the
  *instructions* falling short, **never** the player. (Ethics-gated: [07](./07-accessibility-and-ethics.md) §2.)
- Then → capture the drawing path data → go to **Feedback Check 1** (§5).

---

## 4. Mode 2 — "Anchor Point" (simulating structured safety)

**Goal:** absolute control, predictability, calm.

### 4.1 Canvas behavior
- A **high-contrast grid** appears (clear nodes/dots at intersections).
- The tool changes to **connect-the-dots**: the player drags between grid nodes.
- **Snap-to-grid:** the line endpoint strictly snaps to the nearest node. You
  cannot draw "between" nodes — output is always clean. (Snap logic in
  [04-canvas-engine.md](./04-canvas-engine.md) §Snap.)
- Lines are crisp, straight, exactly as specified. No wobble.
- **Visual guidance.** The current step's **start node pulses** and the target move
  is shown as a faint **"ghost" segment**, so the player can *see* exactly where to
  go — guidance is explicit and visual, not just text. This is the opposite of Mode
  1's nothing, and it's what makes "with instruction" feel effortless.

### 4.2 Instruction delivery (one step at a time)
- **Pagination:** exactly **one instruction card** visible at a time.
  - Example sequence (house, 8 steps):
    1. `Step 1 of 8 — From the starting dot, go ⬇️ down 4 squares.`
    2. `Step 2 of 8 — Go ➡️ right 4 squares.`
    3. `Step 3 of 8 — Go ⬆️ up 4 squares.`
    4. `Step 4 of 8 — Go ⬅️ left 4 squares. (walls done)`
    5. `Step 5 of 8 — From the top-left corner, go ↗️ up-right 2 squares.`
    6. `Step 6 of 8 — Go ↘️ down-right 2 squares. (roof peak done)`
    7. `Step 7 of 8 — Draw the door: a 1×2 box at the bottom center.`
    8. `Step 8 of 8 — Draw a window: a 1×1 box to the right of the door.`
  - (Exact coordinates finalized during implementation; the point is *literal,
    unambiguous, verifiable* steps.)
- A large, clear **"[Next Step]"** button advances. **No timers**, no auto-
  advance. The player moves at their own pace.
- Each card is **persistent** until dismissed — re-readable as long as you want.
  Opposite of Mode 1's decay.
- Progress is explicit ("Step 3 of 8") — you always know where you are and how
  much is left.

### 4.3 Haptic feedback (crisp)
- A **single short, satisfying** pulse — `navigator.vibrate(15)` — fires **at the
  exact moment a line endpoint snaps onto a node**. It's a tactile "click" that
  confirms success.
- Optionally a slightly different confirming pulse when a step is completed.
- This is the *reward* counterpart to Mode 1's punishing buzz.

### 4.4 UI flow (total control) & the completion moment
- **"Undo Step"** button: removes the last segment / reverts the last action.
- **"[Next Step]"** to advance; optionally a **"Back"** to re-read a prior step.
- No distractions, no notifications, no fading. The screen is quiet.
- **Completion moment.** When the last step lands, the drawing visibly "finishes"
  with a calm, satisfying flourish and the Grown-up beams: **"Perfect — exactly
  right!"** This is the reward counterpart to Mode 1's puzzled beat and makes the
  emotional delta concrete.
- Then → capture drawing data → go to **Feedback Check 2** (§5).

---

## 5. Feedback checks (stress + confidence)

After **each** mode, a focused, friendly screen captures **two** quick ratings:

- **Stress** — "How did that feel?" (neutral wording, not leading).
- **Confidence** — "How sure are you that you did it right?" The *confidence* gap
  (typically low after Mode 1, high after Mode 2) is the cleanest measure of the
  goal: without clear instructions you can't even tell whether you did the simple
  task right.
- **Input:** an **emoji-anchored scale** (friendly faces) rather than a bare number
  line — faster and lower cognitive load (see [06](./06-ui-ux-spec.md) §3.3). Stored
  as integers 1–10 internally (see [03](./03-data-model-and-state.md)).
- One primary button to continue. No back-tracking into the mode (the drawing is
  locked once submitted — matching the "no redo" emotional truth of Mode 1).
- Stored immediately: `mode_N_stress_level` and `mode_N_confidence_level`.

## 6. Reflection screen

The payoff. Calm, generous layout:

- **Two drawings side by side** (or stacked on very small screens), each labeled
  with its mode name, the player's stress score, and confidence.
- **The target reveal.** We now show the **intended result** — the clean house —
  and faintly overlay it behind the Mode 1 attempt: *"Both times you were asked for
  **this**. With clear steps it was easy; without them, the same simple task was
  much harder."* The gap is shown to indict the **instructions, not the player**
  (ethics, [07](./07-accessibility-and-ethics.md) §2).
- **The reveal (naming it).** This screen is the *first* time the game names autism.
  A short, **respectful debrief** connects what the player just felt — the
  difficulty, the not-knowing-if-it's-right — to how a simple task can be hard for
  an autistic child when instructions aren't direct, and frames clear, literal,
  structured communication (Mode 2) not as "hand-holding" but as *accessibility*.
  Felt first, named here. (Copy reviewed per [07](./07-accessibility-and-ethics.md).)
- **Stress & confidence deltas** (e.g., "Stress 7 → 2 · Confidence 3 → 9"), framed
  as personal reflection, never as a score or judgment.
- Actions: **Save** (auto, but confirmed), **Share/Export image** (FR-14, maybe
  v1.1), **View past sessions**, **Play again**.

## 7. Full state flow

```
 ┌─────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ Welcome │──▶│   Mode 1     │──▶│ Stress Check │──▶│   Mode 2     │
 │ (intro+ │   │ Sensory Storm│   │     #1       │   │ Anchor Point │
 │ consent)│   └──────────────┘   └──────────────┘   └──────────────┘
 └─────────┘                                                  │
      ▲                                                       ▼
      │             ┌────────────┐   ┌──────────────┐   ┌──────────────┐
      └─────────────│  History   │◀──│  Reflection  │◀──│ Stress Check │
       (play again) │ (sessions) │   │ (compare +   │   │     #2       │
                    └────────────┘   │   debrief)   │   └──────────────┘
                                     └──────────────┘
```

State machine values (see [03-data-model-and-state.md](./03-data-model-and-state.md)):
`welcome → mode1 → stress1 → mode2 → stress2 → reflection → (history | welcome)`

## 8. Tone & copywriting principles

- **Honest, never mocking.** We're building empathy, not caricature.
- **Plain language.** Short sentences. (Fittingly, Mode 2 *models* good comms.)
- **Mode 1 copy is deliberately vague**; Mode 2 copy is deliberately crisp — the
  copywriting itself teaches the lesson.
- Avoid clinical/medical claims. Avoid "suffering" framing. Avoid "normal vs not."
- **Show, don't tell.** Assume the player knows nothing about ASD. Never explain
  the point before they've felt it; the only explanation lives on the Reflection
  screen. The experience teaches; the words just *name* it.
- All player-facing strings live in one place for review/i18n (see
  [02-architecture.md](./02-architecture.md) §i18n-ready content).

## 9. Audio (decision)

v1 ships **no startling audio**. Sudden sounds are a real sensory-safety risk and
would undercut the respectful tone. If ambient audio is added later it must be
opt-in and gentle. (Tracked as OQ-4.)

## 10. Design open questions

- Final step coordinates & grid size per task (e.g., 8×10 nodes?).
- The task pool (house / cat / flower …) and each subject's grid target.
- The Grown-up's exact persona, voice, and mascot visual.
- Tuning the "not quite right" beat so it's gentle, never demoralizing.
- Exact wobble amplitude/feel — tune in playtests (start ~2–4px).
- Notification copy set — keep mundane, never alarming/triggering.
- Whether Mode 1 has any soft time pressure beyond text fade.
