import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Monitor, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'android' | 'windows' | 'linux' | 'mac' | 'ios' | 'unknown';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    const detectPlatform = (): Platform => {
      if (/android/.test(ua)) return 'android';
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/win/.test(ua)) return 'windows';
      if (/linux/.test(ua)) return 'linux';
      if (/mac/.test(ua)) return 'mac';
      return 'unknown';
    };
    setPlatform(detectPlatform());

    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      return;
    }

    // Check if user dismissed prompt before
    const dismissed = localStorage.getItem('installPromptDismissed');
    const shouldShowAuto = !dismissed || (() => {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceDismiss >= 7;
    })();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (shouldShowAuto) {
        setShowPrompt(true);
      }
    };

    // Listen for custom event from download button
    const handleShowInstall = () => {
      setForceShow(true);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('show-install-prompt', handleShowInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('show-install-prompt', handleShowInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
        setForceShow(false);
      }

      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setForceShow(false);
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };

  const getInstallInstructions = () => {
    switch (platform) {
      case 'windows':
        return {
          title: 'Install on Windows',
          icon: Monitor,
          instructions: deferredPrompt
            ? 'Click Install to add LifeTrack 365 to your desktop. Data stored locally on your drive.'
            : 'In Chrome/Edge: Click the install icon (⊕) in the address bar, or Menu → "Install LifeTrack 365"',
          browser: 'Works best with Chrome, Edge, or Brave'
        };
      case 'linux':
        return {
          title: 'Install on Linux',
          icon: Monitor,
          instructions: deferredPrompt
            ? 'Click Install to add LifeTrack 365 to your applications. Data stored locally.'
            : 'In Chrome/Chromium: Click the install icon (⊕) in the address bar, or Menu → "Install LifeTrack 365"',
          browser: 'Works with Chrome, Chromium, or Brave on Linux Mint'
        };
      case 'mac':
        return {
          title: 'Install on Mac',
          icon: Monitor,
          instructions: deferredPrompt
            ? 'Click Install to add LifeTrack 365 to your Applications. Data stored locally.'
            : 'In Chrome: Click the install icon (⊕) in the address bar, or Menu → "Install LifeTrack 365"',
          browser: 'Works best with Chrome or Brave'
        };
      case 'android':
        return {
          title: 'Install on Android',
          icon: Smartphone,
          instructions: deferredPrompt
            ? 'Tap Install to add LifeTrack 365 to your home screen. Works offline!'
            : 'In Chrome: Tap Menu (⋮) → "Add to Home screen" or "Install app"',
          browser: ''
        };
      case 'ios':
        return {
          title: 'Install on iPhone/iPad',
          icon: Smartphone,
          instructions: 'In Safari: Tap Share (□↑) → "Add to Home Screen"',
          browser: 'Must use Safari browser'
        };
      default:
        return {
          title: 'Install App',
          icon: Monitor,
          instructions: deferredPrompt
            ? 'Click Install to add LifeTrack 365 to your device. Data stored locally.'
            : 'Look for an install option in your browser menu',
          browser: ''
        };
    }
  };

  const isDesktop = ['windows', 'linux', 'mac'].includes(platform);
  
  // Show for all platforms when forceShow, or auto-show for mobile
  if (!showPrompt) return null;
  if (!forceShow && !['android', 'ios'].includes(platform)) return null;

  const info = getInstallInstructions();
  const IconComponent = info.icon;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <div className="bg-card border shadow-xl rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base sm:text-lg">
              {info.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {info.instructions}
            </p>
            {info.browser && (
              <p className="text-xs text-muted-foreground/70 mt-1.5 italic">
                {info.browser}
              </p>
            )}
            {isDesktop && (
              <div className="mt-2 p-2 bg-accent rounded-md">
                <p className="text-xs text-muted-foreground">
                  💾 All data stored locally on your {platform === 'windows' ? 'PC' : 'computer'} (SSD/HDD) — no cloud needed
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          {deferredPrompt ? (
            <Button onClick={handleInstall} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
          ) : (
            <Button onClick={handleDismiss} className="flex-1">
              Got it
            </Button>
          )}
          <Button variant="outline" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
