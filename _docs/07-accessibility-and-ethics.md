# 07 — Accessibility & Ethics

This game depicts the experience of autistic people to build empathy. That makes
the *responsibility* of the design as important as its mechanics. This document
is a guardrail, not an afterthought — read it before writing player-facing copy
or tuning Mode 1 intensity.

---

## 1. Framing: what this game is and is not

| It **is** | It is **not** |
|-----------|---------------|
| One illustrative slice of *a* sensory/cognitive experience | "The autistic experience" (there isn't one) |
| An empathy-building exercise | A diagnosis, screening, or assessment |
| A prompt for reflection and better communication | A claim that all autistic people draw/feel this way |
| Made *with* respect for autistic people | A simulation that says "this is what it's like to be autistic" |

**Where the framing appears (this matters):** the primary player knows nothing
about autism, and the empathy lands hardest when it is *felt before it is
explained*. So we split the honest framing across two moments:

- **Welcome (before play) — minimal, no spoiler.** Required: a plain sensory-
  intensity note + the "reduce intensity"/opt-out control, and an honest one-liner
  that this is a short reflective experience we'll explain at the end. We **do
  not** name ASD or state the point here. This is **not deception** — we never
  claim it is something it isn't, and we always disclose the sensory risk for
  consent.
- **Reflection (after play) — the reveal, in full.** This is where the required
  disclaimers live, in plain language: this was a short empathy exercise about how
  people process information differently; it is **one slice**, **not** a test or a
  diagnosis, and **not** a claim that everyone on the spectrum experiences the
  world the same way.

Deferring the *topic* (never the safety information) is a deliberate pedagogy
choice — see [ADR-008](./10-glossary-and-decisions.md) and [01](./01-game-design.md) §1.1.

## 2. Core ethical principles

1. **Nothing about us without us.** Aim to involve autistic people in review and,
   ideally, design. At minimum, run a **sensitivity review** of all copy and the
   Mode 1 intensity with autistic reviewers before any public release. (Track as
   a release gate in [08](./08-implementation-roadmap.md).)
2. **Avoid the "burden" frame.** The debrief must not imply autistic people are a
   problem to be managed. The takeaway is: *clear, literal, structured
   communication is accessibility that helps everyone* — the onus is on
   communication, not on the person.
3. **Identity-first, but respectful.** Default to identity-first language
   ("autistic person"), which most self-advocates prefer, while avoiding
   pathologizing words ("suffers from," "disorder" in casual copy, "high/low
   functioning"). Keep clinical terms only where precise and necessary.
4. **No mockery, no caricature.** Mode 1 simulates *difficulty*, not a person.
   Never frame the wobble/overload as "how autistic people see," but as "how the
   same task can feel under ambiguity + sensory load."
5. **Consent & control.** The player opts into intensity and can dial it down or
   exit at any time. Sensory experiences should never be forced.
6. **Blame the instructions, never the person.** The Grown-up is warm in *both*
   modes; Mode 1 is hard because the *instructions* are unclear, not because the
   player (or an autistic child) is incapable. The "not quite right" beat and the
   target reveal must always land as "the instructions failed you" — never as the
   player failing, being scolded, or being pitied. Keep the beat gentle (~2s),
   kind-toned, and skippable.
7. **Don't infantilize.** The kid-and-grown-up framing is a relatable *setup*, not
   a claim that autistic people are childlike. The reveal connects to "an autistic
   child doing a simple task," then generalizes respectfully — no baby-talk, no
   pity. The confidence question is worded neutrally ("how sure were you?"), never
   "did you fail?".

## 3. Sensory safety (Mode 1 is the risk surface)

Mode 1 intentionally induces mild discomfort. Some users (including autistic
users, people with PTSD, sensory sensitivities, vestibular issues, or epilepsy)
can be affected more strongly. Mandatory safeguards:

- **Pre-warning + opt-out.** Before Mode 1, and via the Welcome **"Reduce
  intensity"** toggle (persisted as `reducedIntensity`, see [03](./03-data-model-and-state.md)),
  the player can soften the experience:
  - haptics: suppress the erratic buzz (keep only soft confirmations),
  - notifications: fewer and slower, never overlapping the canvas,
  - motion: minimal; text fades gently rather than drifting,
  - contrast of vague text raised so it's uncomfortable, not unreadable.
- **Respect `prefers-reduced-motion`.** Auto-enable reduced motion paths; no
  drifting/parallax. (Enforced globally in CSS, see [05](./05-pwa-and-mobile-shell.md).)
- **No photosensitive triggers.** No flashing > 3Hz, no strobe, no rapid
  high-contrast flicker. Notifications slide gently; nothing blinks.
- **No startling audio.** v1 ships no sudden sounds (ADR-005 / GDD §9).
- **Always-available calm exit.** A small, persistent "Exit" affordance leaves
  Mode 1 to a neutral screen without penalty. Leaving is never a failure state.
- **Mild, bounded discomfort.** Target "annoying/confusing," never "distressing."
  Tune amplitudes conservatively in playtests; when in doubt, dial down.

## 4. Standard accessibility (WCAG-minded)

Even though the game is touch/visual, we honor general a11y where it doesn't
conflict with the *designed* difficulty of Mode 1:

- **Contrast:** AA (≥4.5:1) for all *framing, instruction, and Mode 2* text.
  (Mode 1 vague text is a deliberate exception — see [06](./06-ui-ux-spec.md) §5.)
- **Touch targets:** ≥44×44pt for every interactive control.
- **Screen readers:** semantic landmarks/labels on framing, stress input, Mode 2
  step cards, and reflection. The live drawing canvas has an
  `aria-label` describing its purpose; saved drawings get a text summary
  ("your freehand house," "your grid house"). Stress scale is a proper labeled
  slider/radiogroup with values announced.
- **No reliance on color alone:** Mode 2 success uses shape/position + haptic +
  highlight, not just color; stress scale shows numbers, not just a gradient.
- **No reliance on haptics:** since iOS lacks vibration (see [05](./05-pwa-and-mobile-shell.md)),
  all feedback also has a visual channel.
- **Keyboard/switch (best-effort):** Welcome, stress, Mode 2 Next/Undo, and
  navigation are operable without precise drawing where feasible. Drawing itself
  is inherently pointer-based; we don't fake an inaccessible-task as accessible.
- **Reduced motion:** global override (doc 05) plus per-feature respect.
- **Language:** plain, short sentences; `lang` attribute set; content externalized
  for translation.

## 5. Privacy & data ethics

- **Local-only.** No network egress, no analytics by default, no PII collected.
  (See PRD NFR-4.) Drawings and stress scores never leave the device.
- **Visible deletion.** "Delete all my data" (FR-15) wipes local storage.
- **Honest install.** Don't imply cloud backup; data lives on this device only.
- **If analytics are ever added** (post-v1), they must be opt-in, anonymous,
  aggregate, and disclosed — never on by default.

## 6. Debrief copy guidelines (Reflection screen)

Do:
- Center the *communication*: "clear, literal instructions are accessibility."
- Acknowledge variability: "people experience this differently."
- Invite action: "where could clearer steps help someone you know?"

Don't:
- Say "now you know what it's like to be autistic."
- Use pity/inspiration framing.
- Imply Mode 1 = autistic person and Mode 2 = neurotypical "normal."

## 7. Review checklist (release gate)

- [ ] Welcome is **minimal**: gives the sensory-safety note + opt-out and an
      honest "we'll explain after" line, and **does not** name ASD or state the
      point (show, don't tell)
- [ ] The Reflection **reveal** carries the full disclaimers: one slice, not a
      diagnosis/test, people vary
- [ ] A player who knew nothing about ASD is never misled — no false claim, and
      the sensory risk is always disclosed up front
- [ ] The Grown-up reads as warm/well-meaning in **both** modes; never a villain
- [ ] The "not quite right" beat is gentle, brief, skippable, and blames the
      *instructions* — verified with sensitive users
- [ ] The target reveal frames the gap as the instructions' fault, not the player's
- [ ] The kid framing does not infantilize autistic people; the reveal generalizes
      respectfully
- [ ] Confidence-question wording is neutral (no "did you fail?" tone)
- [ ] All copy passes sensitivity review (autistic reviewers if possible)
- [ ] Reduced-intensity mode verified to meaningfully soften Mode 1
- [ ] `prefers-reduced-motion` path verified
- [ ] No flashing >3Hz anywhere; no startling audio
- [ ] Calm-exit available throughout Mode 1
- [ ] AA contrast on all non-deliberate text; 44pt targets
- [ ] Screen-reader pass on framing, stress, Mode 2, reflection
- [ ] "Delete all my data" works; confirm no network calls (DevTools offline)
- [ ] Debrief avoids burden/pity/universality framing
