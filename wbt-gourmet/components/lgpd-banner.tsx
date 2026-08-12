'use client';

import Link from 'next/link';
import { useConsent } from '@/hooks/use-consent';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock } from 'lucide-react';

export function LgpdBanner() {
  const { consent, isLoaded, acceptAll, acceptEssential } = useConsent();

  if (!isLoaded || consent !== 'undecided') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl animate-slide-up">
      <div className="flex flex-col gap-3 rounded-2xl border border-sand/20 bg-court-night/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ball/15 text-ball">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">
              Respeitamos sua privacidade (LGPD)
            </p>
            <p className="text-[11px] text-ink-muted leading-tight">
              Usamos cookies apenas para manter seu carrinho e garantir seu pedido.{' '}
              <Link
                href="/politica-de-privacidade"
                className="underline hover:text-ball transition-colors"
              >
                Saiba mais
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={acceptEssential}
            variant="ghost"
            size="sm"
            className="text-[10px] text-ink-muted hover:text-ink"
          >
            Apenas Essenciais
          </Button>

          <Button
            onClick={acceptAll}
            variant="ball"
            size="sm"
            className="text-[11px]"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
