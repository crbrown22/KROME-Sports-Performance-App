import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-[110] p-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
          <Download className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h3 className="text-white font-bold">Install KROME</h3>
          <p className="text-zinc-400 text-sm">Add to home screen for quick access</p>
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="bg-gold text-black font-bold px-4 py-2 rounded-xl hover:bg-gold/90 transition-colors"
      >
        Install
      </button>
    </div>
  );
};
