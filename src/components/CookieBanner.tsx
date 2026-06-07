'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-lg ring-1 ring-foreground/5">
        <p className="mb-3 text-sm text-muted-foreground">
          Używamy plików cookie do analizy ruchu. Szczegóły w{' '}
          <Link href="/polityka-prywatnosci" className="text-primary underline underline-offset-4">
            polityce prywatności
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleAccept}>
            Akceptuję
          </Button>
          <Button size="sm" variant="outline" onClick={handleDecline}>
            Nie
          </Button>
        </div>
      </div>
    </div>
  );
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}
