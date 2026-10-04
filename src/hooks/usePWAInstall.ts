import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const checkIsIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (window.navigator?.platform === 'MacIntel' && (window.navigator?.maxTouchPoints || 0) > 1);
};

const checkIsAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  return /android/.test(ua);
};

const checkIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    // Check if globally captured earlier
    return (window as unknown as { __pwaPromptEvent?: BeforeInstallPromptEvent }).__pwaPromptEvent || null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(checkIsStandalone);
  const [isIOS, setIsIOS] = useState<boolean>(checkIsIOS);
  const [isAndroid, setIsAndroid] = useState<boolean>(checkIsAndroid);

  useEffect(() => {
    setIsInstalled(checkIsStandalone());
    setIsIOS(checkIsIOS());
    setIsAndroid(checkIsAndroid());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __pwaPromptEvent?: BeforeInstallPromptEvent }).__pwaPromptEvent = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __pwaPromptEvent?: BeforeInstallPromptEvent }).__pwaPromptEvent = undefined;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const prompt = deferredPrompt || (window as unknown as { __pwaPromptEvent?: BeforeInstallPromptEvent }).__pwaPromptEvent;
    if (!prompt) {
      return false;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as unknown as { __pwaPromptEvent?: BeforeInstallPromptEvent }).__pwaPromptEvent = undefined;
        return true;
      }
    } catch (err) {
      console.warn('PWA install error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    install,
    promptAvailable: !!deferredPrompt
  };
}
