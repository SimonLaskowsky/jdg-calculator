'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CONSENT_KEY = 'cookie-consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  // Lock scroll when banner is visible
  useEffect(() => {
    if (showBanner) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBanner]);

  // Remove fade-in class after it plays once, and clean up shake class on animation end
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'fadeIn') {
        el.classList.remove('animate-fade-in');
      } else {
        el.classList.remove('cookie-shake');
        cardRef.current?.classList.remove('cookie-shake-glow');
      }
    };
    el.addEventListener('animationend', onEnd);
    return () => el.removeEventListener('animationend', onEnd);
  }, [showBanner]);

  const triggerShake = useCallback(() => {
    const el = bannerRef.current;
    if (!el) return;
    // Remove first so re-clicking mid-animation restarts it
    el.classList.remove('cookie-shake');
    cardRef.current?.classList.remove('cookie-shake-glow');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('cookie-shake');
    cardRef.current?.classList.add('cookie-shake-glow');
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
    <>
      {/* Full-screen overlay that blocks all interaction */}
      <div
        className="fixed inset-0 z-40 cursor-not-allowed"
        onClick={triggerShake}
        onTouchStart={triggerShake}
      />
      {/* Banner */}
      <div ref={bannerRef} className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in">
        <div ref={cardRef} className="glass-card rounded-2xl p-4 border border-white/10 transition-shadow duration-300">
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
    </>
  );
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}
