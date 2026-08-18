'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem } from '@/data/menu';
import { getCartReminderRecommendation } from '@/lib/upsell/engine';
import { sessionTracker } from '@/lib/upsell/session-tracker';
import { useCartStore } from '@/store/use-cart-store';
import { Plus, X, Sparkles } from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function CartSmartRecommendation() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const recommendation: MenuItem | null = getCartReminderRecommendation(items, sessionTracker);

  if (!recommendation) return null;

  function handleAdd() {
    addItem(recommendation!);
    sessionTracker.dismissCartUpsell();
    setDismissed(true);
  }

  function handleDismiss() {
    sessionTracker.dismissCartUpsell();
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl border border-g-green/40 bg-gradient-to-r from-g-green/10 via-g-surface-2 to-g-surface-2 p-3.5 relative overflow-hidden my-3 shadow-md"
      >
        <button
          onClick={handleDismiss}
          aria-label="Dispensar sugestão"
          className="absolute right-2.5 top-2.5 text-g-muted/70 hover:text-g-cream p-1 rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-g-green/20 border border-g-green/40 text-lg">
            🥤
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-g-green flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Complete sua refeição
            </span>
            <p className="text-xs font-bold text-g-cream truncate">
              {recommendation.name}
            </p>
            <p className="font-mono text-xs font-bold text-g-gold">
              +{currency.format(recommendation.price)}
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-xl bg-g-green px-3 py-1.5 text-xs font-bold text-black transition-all hover:brightness-110 active:scale-95 shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            Adicionar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
