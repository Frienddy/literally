/**
 * Locally-generated UUID. Prefers `crypto.randomUUID` (all modern mobile
 * browsers); falls back to a `crypto.getRandomValues`-seeded v4, and finally to a
 * non-crypto fallback so the app never throws on an ancient engine.
 */
export function uuid(): string {
  const c =
    typeof globalThis !== 'undefined'
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;

  if (c?.randomUUID) return c.randomUUID();

  if (c?.getRandomValues) {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex: string[] = [];
    for (let i = 0; i < 256; i++) hex.push((i + 0x100).toString(16).slice(1));
    const b = bytes;
    return (
      hex[b[0]] +
      hex[b[1]] +
      hex[b[2]] +
      hex[b[3]] +
      '-' +
      hex[b[4]] +
      hex[b[5]] +
      '-' +
      hex[b[6]] +
      hex[b[7]] +
      '-' +
      hex[b[8]] +
      hex[b[9]] +
      '-' +
      hex[b[10]] +
      hex[b[11]] +
      hex[b[12]] +
      hex[b[13]] +
      hex[b[14]] +
      hex[b[15]]
    );
  }

  // Last-resort, non-crypto fallback (uniqueness is best-effort here).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
