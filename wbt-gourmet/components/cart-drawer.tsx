'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/use-cart-store';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.total());

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  async function handleCheckout() {
    setError('');
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Digite um número de WhatsApp válido com DDD.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, name, price, quantity }) => ({
            id, name, price, quantity,
          })),
          customerPhone: phone.replace(/\D/g, ''),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Erro ao processar pedido. Tente novamente.');
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      onClick={closeDrawer}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {/* Drawer panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: '24px 24px 0 0',
          background: '#1a1f26',
          borderTop: '1px solid rgba(239,230,208,0.08)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(239,230,208,0.18)',
            }}
          />
        </div>

        <div style={{ padding: '0 24px 40px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-anton), sans-serif',
                fontSize: '22px',
                textTransform: 'uppercase',
                color: '#F5F1E6',
              }}
            >
              Seu pedido
            </h2>
            <button
              id="cart-drawer-close"
              onClick={closeDrawer}
              aria-label="Fechar carrinho"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(239,230,208,0.06)',
                border: 'none',
                color: '#93A19E',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" style={{ width: '18px', height: '18px' }} stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Lista de itens */}
          {items.length === 0 ? (
            <p
              style={{
                padding: '40px 0',
                textAlign: 'center',
                fontSize: '14px',
                color: '#93A19E',
              }}
            >
              Seu carrinho está vazio. Adicione itens do cardápio!
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(239,230,208,0.04)',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#F5F1E6',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        marginTop: '3px',
                        fontFamily: 'var(--font-space-mono), monospace',
                        fontSize: '11px',
                        color: '#93A19E',
                      }}
                    >
                      {currency.format(item.price)} × {item.quantity} ={' '}
                      <span style={{ color: '#D4F13A' }}>
                        {currency.format(item.price * item.quantity)}
                      </span>
                    </p>
                  </div>

                  {/* Quantidade */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '2px 4px',
                      borderRadius: '999px',
                      background: 'rgba(239,230,208,0.06)',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      id={`cart-dec-${item.id}`}
                      onClick={() =>
                        item.quantity === 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)
                      }
                      aria-label={`Remover um ${item.name}`}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        color: '#E8592C',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: '16px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-space-mono), monospace',
                        fontSize: '12px',
                        color: '#D4F13A',
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      id={`cart-inc-${item.id}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Adicionar mais ${item.name}`}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        color: '#D4F13A',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Total + checkout */}
          {items.length > 0 && (
            <>
              {/* Linha total */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderTop: '1px solid rgba(239,230,208,0.07)',
                  borderBottom: '1px solid rgba(239,230,208,0.07)',
                }}
              >
                <span style={{ fontSize: '13px', color: '#93A19E' }}>Total do pedido</span>
                <span
                  style={{
                    fontFamily: 'var(--font-space-mono), monospace',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#D4F13A',
                  }}
                >
                  {currency.format(total)}
                </span>
              </div>

              {/* WhatsApp input */}
              <div style={{ marginTop: '20px' }}>
                <label
                  htmlFor="cart-phone"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#93A19E',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  WhatsApp para confirmação
                </label>
                <input
                  id="cart-phone"
                  type="tel"
                  required
                  placeholder="(84) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(239,230,208,0.06)',
                    border: '1px solid rgba(239,230,208,0.1)',
                    color: '#F5F1E6',
                    fontSize: '14px',
                    fontFamily: 'var(--font-manrope), sans-serif',
                    outline: 'none',
                  }}
                />
                {error && (
                  <p
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      color: '#E8592C',
                    }}
                  >
                    {error}
                  </p>
                )}
                <p
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: 'rgba(147,161,158,0.6)',
                  }}
                >
                  Usamos seu WhatsApp só para confirmar o pedido.
                </p>
              </div>

              {/* Botão pagar */}
              <button
                id="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={loading || items.length === 0}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '15px',
                  borderRadius: '14px',
                  background: loading ? 'rgba(212,241,58,0.6)' : '#D4F13A',
                  color: '#12161B',
                  fontFamily: 'var(--font-anton), sans-serif',
                  fontSize: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 20px rgba(212,241,58,0.3)',
                  transition: 'opacity 0.15s, transform 0.1s',
                }}
              >
                {loading ? 'Abrindo pagamento…' : `Pagar ${currency.format(total)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
