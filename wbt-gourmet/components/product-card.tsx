'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/use-cart-store';
import type { MenuItem } from '@/data/menu';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Check } from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface ProductCardProps {
  item: MenuItem;
}

export function ProductCard({ item }: ProductCardProps) {
  const addItem       = useCartStore((s) => s.addItem);
  const items         = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem    = useCartStore((s) => s.removeItem);

  const [justAdded, setJustAdded] = useState(false);

  const isAvailableToday =
    !item.availability ||
    item.availability.days.includes(new Date().getDay());

  if (!isAvailableToday) return null;

  const cartItem = items.find((i) => i.id === item.id);
  const qty      = cartItem?.quantity ?? 0;

  function handleAdd() {
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  }

  return (
    <div className="gourmet-card group relative flex flex-col overflow-hidden rounded-2xl border border-g-line bg-g-surface transition-all duration-300 hover:-translate-y-1 hover:border-g-green/25 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(75,166,70,0.1)]">

      {/* Imagem do Produto */}
      {item.image ? (
        <div className="gourmet-card-img relative h-52 w-full overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Overlay cinematográfico — de baixo para cima */}
          <div className="absolute inset-0 bg-gradient-to-t from-g-surface via-g-surface/20 to-transparent" />

          {/* Preço flutuante na imagem */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-lg bg-g-dark/80 px-2.5 py-1 font-mono text-sm font-semibold text-g-gold backdrop-blur-sm">
              {currency.format(item.price)}
            </span>
          </div>
        </div>
      ) : (
        /* Card sem imagem — placeholder texturizado */
        <div className="relative h-28 w-full overflow-hidden bg-g-surface-2">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234BA646' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30" aria-hidden="true">🍽️</span>
          </div>
        </div>
      )}

      {/* Conteúdo do Card */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-body text-[15px] font-bold text-g-cream leading-snug group-hover:text-white transition-colors">
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
                  className="gap-1.5 text-[12px]"
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
              <div className="inline-flex items-center gap-1 rounded-full border border-g-green/30 bg-g-dark p-0.5">
                <button
                  id={`dec-${item.id}`}
                  onClick={() =>
                    qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)
                  }
                  aria-label={`Remover um ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-g-muted hover:bg-g-surface-2 hover:text-g-cream transition-colors"
                >
                  <Minus className="h-3 w-3 stroke-[2.5]" />
                </button>

                <span className="min-w-[22px] text-center font-mono text-xs font-bold text-g-green">
                  {qty}
                </span>

                <button
                  id={`inc-${item.id}`}
                  onClick={() => addItem(item)}
                  aria-label={`Adicionar mais ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-g-green text-g-dark hover:bg-g-green-lt transition-colors"
                >
                  <Plus className="h-3 w-3 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
