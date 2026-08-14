'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/use-cart-store';
import { ShoppingBag, ChevronRight } from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function StickyCta() {
  const itemCount = useCartStore((s) => s.itemCount());
  const total     = useCartStore((s) => s.total());
  const openDrawer = useCartStore((s) => s.openDrawer);

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 pointer-events-none"
        >
          <div className="mx-auto max-w-lg pointer-events-auto">
            <button
              id="sticky-cta-open-cart"
              onClick={openDrawer}
              aria-label={`Ver carrinho — ${itemCount} itens — ${currency.format(total)}`}
              className="
                group w-full flex items-center justify-between
                rounded-2xl border border-g-green-lt/30
                bg-g-green px-5 py-3.5
                shadow-[0_8px_32px_rgba(45,122,39,0.35)]
                hover:bg-g-green-lt hover:shadow-[0_12px_40px_rgba(45,122,39,0.5)]
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              {/* Lado esquerdo — sacola + contagem */}
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <ShoppingBag className="h-5 w-5 text-white" />
                  {/* Badge contador */}
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-g-green-dk shadow-xs"
                  >
                    {itemCount}
                  </motion.span>
                </div>

                <div className="text-left">
                  <p className="font-body text-xs font-medium text-white/80 leading-none">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="font-body text-sm font-bold text-white leading-tight">
                    Ver meu pedido
                  </p>
                </div>
              </div>

              {/* Lado direito — total + seta */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white bg-white/20 px-3 py-1.5 rounded-lg">
                  {currency.format(total)}
                </span>
                <ChevronRight className="h-4 w-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
