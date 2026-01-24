import { useState } from 'react';
import { X, Smartphone, Monitor, Apple, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlatformDownloadDialogProps {
  onClose: () => void;
}

type Platform = 'android' | 'ios' | 'windows' | 'linux' | 'macos' | null;

const platforms = [
  {
    id: 'android' as Platform,
    name: 'Android',
    icon: '🤖',
    description: 'Android phones & tablets',
    instructions: [
      '1. Open Chrome browser and visit our app URL',
      '2. Tap the menu (⋮) in the top right',
      '3. Tap "Add to Home Screen"',
      '4. Tap "Add" to install'
    ],
    note: 'Works offline after installation!'
  },
  {
    id: 'ios' as Platform,
    name: 'iPhone & iPad',
    icon: '🍎',
    description: 'iOS devices',
    instructions: [
      '1. Open Safari browser and visit our app URL',
      '2. Tap the Share button (□↑)',
      '3. Scroll down and tap "Add to Home Screen"',
      '4. Tap "Add" to confirm'
    ],
    note: 'Safari is required for iOS installation'
  },
  {
    id: 'windows' as Platform,
    name: 'Windows',
    icon: '🪟',
    description: 'Windows 7, 10, 11',
    instructions: [
      '1. Open Chrome or Edge browser',
      '2. Click the install icon (⊕) in the address bar',
      '3. Or click menu → "Install LifeTrack 365..."',
      '4. Click "Install" in the popup'
    ],
    note: 'Data stored locally on your SSD/HDD'
  },
  {
    id: 'linux' as Platform,
    name: 'Linux',
    icon: '🐧',
    description: 'Ubuntu, Linux Mint, etc.',
    instructions: [
      '1. Open Chrome or Chromium browser',
      '2. Click the install icon (⊕) in the address bar',
      '3. Or click menu → "Install LifeTrack 365..."',
      '4. Click "Install" in the popup'
    ],
    note: 'Tested on Linux Mint 22 & Ubuntu'
  },
  {
    id: 'macos' as Platform,
    name: 'macOS',
    icon: '💻',
    description: 'MacBook, iMac, Mac Mini',
    instructions: [
      '1. Open Chrome or Edge browser',
      '2. Click the install icon (⊕) in the address bar',
      '3. Or click menu → "Install LifeTrack 365..."',
      '4. Click "Install" in the popup'
    ],
    note: 'Works on macOS Ventura and later'
  }
];

const PlatformDownloadDialog = ({ onClose }: PlatformDownloadDialogProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);

  const selected = platforms.find(p => p.id === selectedPlatform);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Download LifeTrack 365</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedPlatform ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Select your platform to get installation instructions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all"
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <span className="text-sm font-medium">{platform.name}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {platform.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedPlatform(null)}
                className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
              >
                ← Back to platforms
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{selected?.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold">{selected?.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected?.description}</p>
                </div>
              </div>

              <div className="bg-accent/50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3">Installation Steps:</h4>
                <ol className="space-y-2">
                  {selected?.instructions.map((step, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {selected?.note && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary">
                    💡 {selected.note}
                  </p>
                </div>
              )}

              {/* Try Install button for supported platforms */}
              {(selectedPlatform === 'windows' || selectedPlatform === 'linux' || selectedPlatform === 'macos') && (
                <div className="mt-4">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      const event = new CustomEvent('trigger-pwa-install');
                      window.dispatchEvent(event);
                      onClose();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Try Install Now
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            🔒 Your data is stored locally on your device for privacy and offline access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformDownloadDialog;
