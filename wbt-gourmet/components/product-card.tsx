'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/use-cart-store';
import type { MenuItem } from '@/data/menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface ProductCardProps {
  item: MenuItem;
}

export function ProductCard({ item }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const isAvailableToday =
    !item.availability ||
    item.availability.days.includes(new Date().getDay());

  if (!isAvailableToday) return null;

  const cartItem = items.find((i) => i.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-sand/10 bg-sand/[0.04] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-ball/40 hover:bg-sand/[0.07] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md"
    >
      {/* Imagem do Produto */}
      {item.image && (
        <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-xl bg-court-night/60">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-court-night/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Detalhes do Produto */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-body text-base font-bold text-ink group-hover:text-ball transition-colors leading-snug">
              {item.name}
            </h3>
          </div>

          {item.description && (
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Preço e Ação */}
        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-sand/10">
          <span className="font-mono text-base font-bold text-ember">
            {currency.format(item.price)}
          </span>

          {/* Adicionar ou Controles de Quantidade */}
          {qty === 0 ? (
            <Button
              id={`add-${item.id}`}
              onClick={() => addItem(item)}
              aria-label={`Adicionar ${item.name} ao carrinho`}
              variant="ball"
              size="sm"
              className="rounded-full font-bold shadow-[0_2px_10px_rgba(212,241,58,0.2)] hover:shadow-[0_4px_16px_rgba(212,241,58,0.4)]"
            >
              + Adicionar
            </Button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-ball/30 bg-court-night/90 p-1 shadow-md">
              <button
                id={`dec-${item.id}`}
                onClick={() =>
                  qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)
                }
                aria-label={`Remover um ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ember hover:bg-ember/20 transition-colors"
              >
                <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>

              <span className="min-w-[20px] text-center font-mono text-xs font-bold text-ball">
                {qty}
              </span>

              <button
                id={`inc-${item.id}`}
                onClick={() => addItem(item)}
                aria-label={`Adicionar mais um ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ball hover:bg-ball/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
