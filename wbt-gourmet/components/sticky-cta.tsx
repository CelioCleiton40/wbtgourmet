'use client';

import { useCartStore } from '@/store/use-cart-store';

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
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px 16px',
        zIndex: 40,
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button
          id="sticky-cta-open-cart"
          onClick={openDrawer}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #E8592C 0%, #cf4520 100%)',
            color: '#F5F1E6',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(232, 89, 44, 0.5), 0 2px 8px rgba(0,0,0,0.3)',
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Ícone carrinho */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{ width: '18px', height: '18px' }}
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-anton), sans-serif',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {currency.format(total)}
          </span>
        </button>
      </div>
    </div>
  );
}
