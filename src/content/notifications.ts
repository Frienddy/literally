/**
 * Fake-notification copy for Mode 1's distraction layer (PRD-009 R09-8, FR-7,
 * GDD §3.4). Content is **data, not JSX** (ADR-007).
 *
 * ETHICS GUARDRAIL (doc 07 §3, sensory safety): every toast is **mundane** —
 * battery, a message, a backup, a reminder. Nothing alarming, threatening, or
 * potentially triggering (no emergencies, health scares, money/security alarms).
 * The distraction has to read as everyday phone noise, not a scare. A content
 * test (`content.boundary`) asserts the set stays benign.
 *
 * `icon` is a placeholder glyph until the custom icon set (PRD-011 polish).
 */
export interface FakeNotification {
  icon: string;
  title: string;
  body?: string;
}

export const notifications: readonly FakeNotification[] = [
  { icon: '💬', title: 'New message', body: 'Tap to reply' },
  { icon: '🔋', title: 'Battery 20%', body: 'Low Power Mode?' },
  { icon: '☁️', title: 'Backup paused', body: 'Not enough space' },
  { icon: '📷', title: '3 new photos', body: 'Shared album updated' },
  { icon: '🔔', title: 'Reminder', body: 'Pick up groceries' },
  { icon: '📅', title: 'Event in 30 min', body: 'Team sync' },
] as const;
