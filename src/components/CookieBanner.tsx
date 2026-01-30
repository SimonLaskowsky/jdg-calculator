'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'cookie-consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setShowBanner(false);
    // Reload to initialize analytics
    window.location.reload();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in">
      <div className="glass-card rounded-2xl p-4 border border-white/10">
        <p className="text-sm text-gray-300 mb-3">
          Używamy plików cookie do analizy ruchu.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 transition-all"
          >
            Akceptuję
          </button>
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            Nie
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}
