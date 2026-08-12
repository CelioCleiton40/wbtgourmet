'use client';

import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function StickyCta() {
  const itemCount = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.total());
  const openDrawer = useCartStore((s) => s.openDrawer);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto">
        <Button
          id="sticky-cta-open-cart"
          onClick={openDrawer}
          variant="ember"
          size="lg"
          className="w-full flex items-center justify-between py-4 px-5 rounded-2xl shadow-[0_10px_35px_rgba(232,89,44,0.5)] border border-ember/30 hover:scale-[1.02] transition-transform animate-slide-up"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <ShoppingBag className="h-5 w-5 text-ink" />
            </div>
            <span className="font-display text-sm uppercase tracking-wider">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
            </span>
          </div>

          <span className="font-mono text-base font-bold text-ink bg-court-night/30 px-3 py-1 rounded-lg">
            {currency.format(total)}
          </span>
        </Button>
      </div>
    </div>
  );
}
