'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/use-cart-store';
import type { MenuItem } from '@/data/menu';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Check } from 'lucide-react';
import { getBestUpsellOpportunity } from '@/lib/upsell/engine';
import { sessionTracker } from '@/lib/upsell/session-tracker';
import type { UpsellOpportunity } from '@/lib/upsell/types';
import { UpsellQuickModal } from '@/components/upsell/upsell-quick-modal';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface ProductCardProps {
  item: MenuItem;
}

export function ProductCard({ item }: ProductCardProps) {
  const addItem           = useCartStore((s) => s.addItem);
  const addMultipleItems  = useCartStore((s) => s.addMultipleItems);
  const items             = useCartStore((s) => s.items);
  const updateQuantity    = useCartStore((s) => s.updateQuantity);
  const removeItem        = useCartStore((s) => s.removeItem);

  const [justAdded, setJustAdded] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState<UpsellOpportunity | null>(null);

  const isAvailableToday =
    !item.availability ||
    item.availability.days.includes(new Date().getDay());

  if (!isAvailableToday) return null;

  const cartItem = items.find((i) => i.id === item.id);
  const qty      = cartItem?.quantity ?? 0;

  function handleAdd() {
    // Se o item ainda não está no carrinho, avalia oportunidade de Upsell / Combo
    if (qty === 0) {
      const opp = getBestUpsellOpportunity({
        product: item,
        cartItems: items,
        tracker: sessionTracker,
      });

      if (opp.shouldShow) {
        setCurrentOpportunity(opp);
        setIsUpsellOpen(true);
        return;
      }
    }

    // Adição direta
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  }

  function handleConfirmUpsell(itemsToAdd: MenuItem[]) {
    setIsUpsellOpen(false);
    if (itemsToAdd.length === 1) {
      addItem(itemsToAdd[0]);
    } else {
      addMultipleItems(itemsToAdd);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  }

  return (
    <div className="gourmet-card group relative flex flex-col overflow-hidden rounded-2xl border border-g-line bg-g-surface shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-g-green/40 hover:shadow-[0_12px_32px_rgba(45,122,39,0.12)]">

      {/* Imagem do Produto */}
      {item.image ? (
        <div className="gourmet-card-img relative h-52 w-full overflow-hidden bg-g-surface-2">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Overlay suave inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Preço flutuante na imagem */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-full bg-white/95 px-3 py-1 font-mono text-xs font-bold text-g-green-dk shadow-sm border border-g-line/40 backdrop-blur-sm">
              {currency.format(item.price)}
            </span>
          </div>
        </div>
      ) : (
        /* Card sem imagem — placeholder texturizado */
        <div className="relative h-24 w-full overflow-hidden bg-g-surface-2">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232D7A27' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl opacity-25" aria-hidden="true">🍽️</span>
          </div>
        </div>
      )}

      {/* Conteúdo do Card */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-body text-[15px] font-bold text-g-cream leading-snug group-hover:text-g-green transition-colors">
            {item.name}
          </h3>

          {item.description && (
            <p className="mt-1.5 text-[13px] text-g-muted leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Rodapé do Card — Preço (sem imagem) + Ação */}
        <div className={[
          'mt-4 flex items-center justify-between gap-3',
          !item.image && 'pt-3 border-t border-g-line',
        ].filter(Boolean).join(' ')}>

          {/* Preço — mostrado no rodapé apenas quando não há imagem */}
          {!item.image && (
            <span className="font-mono text-base font-bold text-g-gold">
              {currency.format(item.price)}
            </span>
          )}

          {/* Botão Adicionar / Controles de Quantidade */}
          <div className={item.image ? 'ml-auto' : ''}>
            {qty === 0 ? (
              <motion.div
                key="add-btn"
                initial={false}
                animate={{ scale: justAdded ? [1, 1.12, 1] : 1 }}
              >
                <Button
                  id={`add-${item.id}`}
                  onClick={handleAdd}
                  aria-label={`Adicionar ${item.name} ao pedido`}
                  variant="primary"
                  size="sm"
                  className="gap-1.5 text-[12px] shadow-sm"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {justAdded ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Adicionado!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Quero pedir
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            ) : (
              /* Controles de quantidade */
              <div className="inline-flex items-center gap-1 rounded-full border border-g-green/30 bg-g-surface-2 p-0.5 shadow-xs">
                <button
                  id={`dec-${item.id}`}
                  onClick={() =>
                    qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)
                  }
                  aria-label={`Remover um ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-g-muted hover:bg-g-line hover:text-g-cream transition-colors"
                >
                  <Minus className="h-3 w-3 stroke-[2.5]" />
                </button>

                <span className="min-w-[22px] text-center font-mono text-xs font-bold text-g-green-dk">
                  {qty}
                </span>

                <button
                  id={`inc-${item.id}`}
                  onClick={() => addItem(item)}
                  aria-label={`Adicionar mais ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-g-green text-white hover:bg-g-green-lt transition-colors shadow-xs"
                >
                  <Plus className="h-3 w-3 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Upsell Inteligente & Combo-First */}
      {isUpsellOpen && currentOpportunity && (
        <UpsellQuickModal
          isOpen={isUpsellOpen}
          product={item}
          opportunity={currentOpportunity}
          onClose={() => setIsUpsellOpen(false)}
          onConfirm={handleConfirmUpsell}
        />
      )}
    </div>
  );
}
