/** Shown only in landscape — the universal portrait-enforcement fallback. */
export function PortraitGuard() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
      role="alert"
    >
      <div className="text-5xl" aria-hidden>
        📱↻
      </div>
      <p className="text-lg font-medium">
        Please rotate your phone to portrait.
      </p>
      <p className="text-sm text-textMuted">
        Literally is designed to be held upright.
      </p>
    </div>
  );
}
