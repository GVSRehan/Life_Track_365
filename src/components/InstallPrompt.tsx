import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // Check if Android
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
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
      if (deferredPrompt) {
        setShowPrompt(true);
        setForceShow(true);
      } else {
        // Show manual instructions if PWA prompt not available
        setForceShow(true);
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('show-install-prompt', handleShowInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('show-install-prompt', handleShowInstall);
    };
  }, [deferredPrompt]);

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

  // Show if: (Android AND auto-show) OR forceShow
  if (!showPrompt || (!isAndroid && !forceShow)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-card border shadow-lg rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {deferredPrompt ? 'Install App' : 'Get the App'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {deferredPrompt 
                ? 'Add LifeTrack 365 to your home screen for quick access'
                : 'Open in Chrome browser, tap menu (⋮) → "Add to Home Screen"'
              }
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          {deferredPrompt ? (
            <Button onClick={handleInstall} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Install
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
