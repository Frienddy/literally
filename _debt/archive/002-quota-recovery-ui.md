# DEBT-002 — Quota-exceeded recovery UI not yet wired

**Status:** ✅ Resolved (2026-06-21) · **Severity:** Low · **Surfaced by:** PRD-002 (Data Model & Persistence)

## Resolution

Now that screens exist, the missing **UI listener** is wired: `src/components/
QuotaNotice.tsx` is mounted globally in `App` (over the `ScreenRouter`), listens
for the `literally:quota-exceeded` `CustomEvent` exported from `store/storage.ts`,
and surfaces a calm "this device is out of room — clear older sessions?" prompt
(copy in `content/strings.ts` `quota`). Its primary action calls a new, focused
store action `clearOldSessions()` which keeps only the most recent session
(`sessions.slice(0, 1)`) — chosen over `clearAllData()` so "clear old sessions"
never discards the result the player is about to view, nor their place in the flow.
Covered by `tests/unit/quotaNotice.test.tsx` (hidden until the event, clear keeps
newest + dismisses, "not now" leaves data intact) and a `clearOldSessions` store
test. The original note follows for history.

---

## What

PRD-002 R02-13 asks that a `QuotaExceededError` on persist "surfaces a friendly
'storage full — clear old sessions?' path, not a silent failure."

The **mechanism** is implemented in `src/store/storage.ts`: writes are wrapped, a
quota error is swallowed (so the in-memory session keeps working and never
crashes), `console.warn` is emitted, and a `literally:quota-exceeded`
`CustomEvent` is dispatched on `window`. This is covered by unit tests.

What does **not** exist yet is a **UI listener** that catches that event and shows
the user the "storage full — clear old sessions?" prompt, because there are no
screens yet (Phase 0/1 ship the shell + store only).

## Why deferred

Screens arrive in PRD-004 (navigation/shells) and PRD-008 (history + delete).
Wiring the toast/dialog now would mean building UI ahead of the design system.
The non-negotiable part — *never fail silently or crash* — is already satisfied.

## Risk

If a device genuinely fills localStorage before the UI exists, the session stays
usable but the user isn't told their data wasn't persisted (only a console warn).
Low likelihood at this stage (no large drawing payloads are saved until PRD-003).

## Suggested resolution

In PRD-004/PRD-008, add a top-level listener for `QUOTA_EXCEEDED_EVENT`
(exported from `src/store/storage.ts`) that renders a calm prompt offering
"Delete old sessions" (→ `deleteSession` / `clearAllData`). Consider also the
IndexedDB escape hatch (R02-15 / ADR-002) if real-device payloads approach the
~150 KB/session threshold.
