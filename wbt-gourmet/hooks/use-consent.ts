'use client';

import { useState, useEffect } from 'react';

export type ConsentStatus = 'undecided' | 'granted' | 'essential';

const STORAGE_KEY = 'wbt_lgpd_consent';

export function useConsent() {
  const [consent, setConsent] = useState<ConsentStatus>('undecided');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ConsentStatus;
      if (saved && (saved === 'granted' || saved === 'essential')) {
        setConsent(saved);
      }
    } catch {
      // Ignorar erros de armazenamento privado
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const acceptAll = () => {
    setConsent('granted');
    try {
      localStorage.setItem(STORAGE_KEY, 'granted');
    } catch {}
  };

  const acceptEssential = () => {
    setConsent('essential');
    try {
      localStorage.setItem(STORAGE_KEY, 'essential');
    } catch {}
  };

  return {
    consent,
    isLoaded,
    acceptAll,
    acceptEssential,
  };
}
