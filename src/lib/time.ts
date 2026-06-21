/** Current epoch time in ms. Wrapped so tests can stub it in one place. */
export function now(): number {
  return Date.now();
}
