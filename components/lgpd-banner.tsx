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
      <div className="flex flex-col gap-4 rounded-2xl border border-g-line bg-g-surface/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-g-green/10 text-g-green">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-g-cream">
              Respeitamos sua privacidade (LGPD)
            </p>
            <p className="text-[11px] text-g-muted leading-relaxed mt-0.5">
              Usamos cookies apenas para manter seu carrinho e garantir seu pedido.{' '}
              <Link
                href="/politica-de-privacidade"
                className="underline hover:text-g-green transition-colors"
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
            className="text-[10px] text-g-muted hover:text-g-cream"
          >
            Apenas Essenciais
          </Button>

          <Button
            onClick={acceptAll}
            variant="primary"
            size="sm"
            className="text-[11px] gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
