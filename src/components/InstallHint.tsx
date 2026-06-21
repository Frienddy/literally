/**
 * Platform-aware install affordance (PRD-004 R04-8, PRD-001 R01-11). Android fires
 * `beforeinstallprompt`, which we trigger from our own button; iOS has no such
 * event, so we show manual "Share → Add to Home Screen" guidance. Other platforms
 * render nothing.
 */
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { strings } from '../content/strings';

export function InstallHint({ className = '' }: { className?: string }) {
  const { canInstall, promptInstall, platform } = useInstallPrompt();

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={() => void promptInstall()}
        className={`min-h-touch text-sm text-textMuted active:text-text ${className}`}
      >
        {strings.install.cta} ›
      </button>
    );
  }

  if (platform === 'ios') {
    return (
      <p className={`max-w-xs text-xs text-textMuted ${className}`}>
        {strings.install.iosGuidance}
      </p>
    );
  }

  return null;
}
