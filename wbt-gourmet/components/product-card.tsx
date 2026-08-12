'use client';

import { useCartStore } from '@/store/use-cart-store';
import type { MenuItem } from '@/data/menu';
import Image from 'next/image';

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
      style={{
        background: 'rgba(239, 230, 208, 0.97)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.3)';
      }}
    >
      {/* Imagem */}
      {item.image && (
        <div style={{ position: 'relative', height: '140px', width: '100%', overflow: 'hidden' }}>
          <Image
            src={item.image}
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          {/* Gradiente sobre imagem */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(239,230,208,0.95) 100%)',
            }}
          />
        </div>
      )}

      {/* Conteúdo */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 16px',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: 1.3,
              color: '#12161B',
              wordBreak: 'break-word',
            }}
          >
            {item.name}
          </p>
          {item.description && (
            <p
              style={{
                marginTop: '4px',
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'rgba(18,22,27,0.55)',
              }}
            >
              {item.description}
            </p>
          )}
          <p
            style={{
              marginTop: '8px',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '13px',
              fontWeight: 700,
              color: '#E8592C',
            }}
          >
            {currency.format(item.price)}
          </p>
        </div>

        {/* Controle de quantidade */}
        {qty === 0 ? (
          <button
            id={`add-${item.id}`}
            onClick={() => addItem(item)}
            aria-label={`Adicionar ${item.name} ao carrinho`}
            style={{
              flexShrink: 0,
              padding: '8px 18px',
              borderRadius: '999px',
              background: '#12161B',
              color: '#D4F13A',
              fontFamily: 'var(--font-anton), sans-serif',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.1s, opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            + Add
          </button>
        ) : (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 6px',
              borderRadius: '999px',
              background: '#12161B',
            }}
          >
            <button
              id={`dec-${item.id}`}
              onClick={() =>
                qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)
              }
              aria-label={`Remover um ${item.name}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#E8592C',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              −
            </button>
            <span
              style={{
                minWidth: '20px',
                textAlign: 'center',
                fontFamily: 'var(--font-space-mono), monospace',
                fontSize: '13px',
                color: '#D4F13A',
              }}
            >
              {qty}
            </span>
            <button
              id={`inc-${item.id}`}
              onClick={() => addItem(item)}
              aria-label={`Adicionar mais um ${item.name}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#D4F13A',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
