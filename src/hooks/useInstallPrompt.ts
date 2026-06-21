import { useEffect, useState } from 'react';

/** The Android-only `beforeinstallprompt` event (not in the standard lib types). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'other';

/** Best-effort platform sniff — only used to choose *guidance copy*, never logic. */
export function getPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/**
 * Android exposes `beforeinstallprompt`, which we stash and trigger from our own
 * UI. iOS has no such event — callers show manual guidance ("Share → Add to Home
 * Screen") based on {@link getPlatform}.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // stash it; we trigger it from our own UI
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  };

  return { canInstall: !!deferred, promptInstall, platform: getPlatform() };
}
