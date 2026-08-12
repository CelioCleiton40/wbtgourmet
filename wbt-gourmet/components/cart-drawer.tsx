'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';

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
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Digite um número de WhatsApp válido com DDD (ex: 84999999999).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, name, price, quantity }) => ({
            id,
            name,
            price,
            quantity,
          })),
          customerPhone: cleanPhone,
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
    <div
      onClick={closeDrawer}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-sand/15 bg-court-night p-6 shadow-2xl animate-slide-up"
      >
        {/* Handle de arrastar em telas pequenas */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-sand/20" />
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-sand/10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-ball" />
            <h2 className="font-display text-xl uppercase tracking-wider text-ink">
              Seu Pedido
            </h2>
          </div>
          <button
            id="cart-drawer-close"
            onClick={closeDrawer}
            aria-label="Fechar carrinho"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/5 text-ink-muted hover:bg-sand/15 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo do Carrinho */}
        <div className="mt-4">
          {items.length === 0 ? (
            <div className="py-12 text-center text-ink-muted">
              <ShoppingBag className="mx-auto h-12 w-12 opacity-30 mb-3" />
              <p className="text-sm">Seu carrinho está vazio.</p>
              <p className="text-xs text-ink-muted/70 mt-1">Adicione os pratos mais saborosos da quadra!</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sand/10 bg-sand/5 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {item.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-muted">
                      {currency.format(item.price)} × {item.quantity} ={' '}
                      <span className="text-ball font-bold">
                        {currency.format(item.price * item.quantity)}
                      </span>
                    </p>
                  </div>

                  {/* Controles de quantidade */}
                  <div className="flex items-center gap-1.5 rounded-full border border-sand/15 bg-court-night/80 p-1">
                    <button
                      id={`cart-dec-${item.id}`}
                      onClick={() =>
                        item.quantity === 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)
                      }
                      aria-label={`Remover um ${item.name}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-ember hover:bg-ember/20 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="min-w-[16px] text-center font-mono text-xs font-bold text-ball">
                      {item.quantity}
                    </span>

                    <button
                      id={`cart-inc-${item.id}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Adicionar mais ${item.name}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-ball hover:bg-ball/20 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Checkout & Total */}
          {items.length > 0 && (
            <div className="mt-6 pt-4 border-t border-sand/10 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Total do pedido:</span>
                <span className="font-mono text-xl font-bold text-ball">
                  {currency.format(total)}
                </span>
              </div>

              {/* Formulário de WhatsApp */}
              <div className="space-y-2">
                <label
                  htmlFor="cart-phone"
                  className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted"
                >
                  WhatsApp para Confirmação e Rastreio
                </label>
                <Input
                  id="cart-phone"
                  type="tel"
                  placeholder="(84) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {error && (
                  <p className="text-xs text-ember font-medium">{error}</p>
                )}
                <p className="flex items-center gap-1.5 text-[11px] text-ink-muted/70">
                  <ShieldCheck className="h-3.5 w-3.5 text-ball" /> Usamos seu WhatsApp somente para enviar os detalhes do pedido (LGPD).
                </p>
              </div>

              {/* Botão de Finalização */}
              <Button
                id="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={loading || items.length === 0}
                variant="ball"
                size="lg"
                className="w-full py-4 text-sm font-bold shadow-[0_4px_20px_rgba(212,241,58,0.3)] hover:brightness-110"
              >
                {loading ? (
                  'Processando Pagamento…'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Finalizar Pedido ({currency.format(total)})
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
