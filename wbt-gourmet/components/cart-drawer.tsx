'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, UtensilsCrossed,
} from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function CartDrawer() {
  const items        = useCartStore((s) => s.items);
  const isOpen       = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer  = useCartStore((s) => s.closeDrawer);
  const removeItem   = useCartStore((s) => s.removeItem);
  const updateQty    = useCartStore((s) => s.updateQuantity);
  const total        = useCartStore((s) => s.total());

  const [loading, setLoading] = useState(false);
  const [phone,   setPhone]   = useState('');
  const [error,   setError]   = useState('');

  async function handleCheckout() {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Digite um número de WhatsApp válido com DDD (ex: 84 9 9999-9999).');
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-g-dark/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-g-line bg-g-surface shadow-2xl"
          >
            {/* Linha decorativa superior — verde gourmet */}
            <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-g-green-dk via-g-green to-g-green-lt" />

            {/* Handle em mobile */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-g-line" />
            </div>

            <div className="p-6">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between pb-4 border-b border-g-line">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-g-green/15">
                    <ShoppingBag className="h-4.5 w-4.5 text-g-green" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-g-cream">
                      Seu Pedido
                    </h2>
                    <p className="text-[11px] text-g-muted">
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>

                <button
                  id="cart-drawer-close"
                  onClick={closeDrawer}
                  aria-label="Fechar carrinho"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-g-surface-2 text-g-muted hover:bg-g-line hover:text-g-cream transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Lista de itens */}
              <div className="mt-4">
                {items.length === 0 ? (
                  <div className="py-14 text-center text-g-muted">
                    <UtensilsCrossed className="mx-auto h-10 w-10 opacity-25 mb-3" />
                    <p className="text-sm font-medium">Seu carrinho está vazio</p>
                    <p className="text-xs text-g-faint mt-1">
                      Escolha algo delicioso do nosso cardápio!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between gap-3 rounded-xl border border-g-line bg-g-surface-2 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-g-cream truncate">
                              {item.name}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-g-muted">
                              {currency.format(item.price)} × {item.quantity}{' '}
                              ={' '}
                              <span className="text-g-gold font-semibold">
                                {currency.format(item.price * item.quantity)}
                              </span>
                            </p>
                          </div>

                          {/* Controles de quantidade */}
                          <div className="flex items-center gap-1 rounded-full border border-g-line bg-g-dark p-0.5 shrink-0">
                            <button
                              id={`cart-dec-${item.id}`}
                              onClick={() =>
                                item.quantity === 1
                                  ? removeItem(item.id)
                                  : updateQty(item.id, item.quantity - 1)
                              }
                              aria-label={`Remover um ${item.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-g-muted hover:bg-g-surface-2 hover:text-g-cream transition-colors"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>

                            <span className="min-w-[18px] text-center font-mono text-xs font-bold text-g-green">
                              {item.quantity}
                            </span>

                            <button
                              id={`cart-inc-${item.id}`}
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              aria-label={`Adicionar mais ${item.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-g-green text-g-dark hover:bg-g-green-lt transition-colors"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {/* Seção de Checkout — transmite CONFIANÇA */}
              {items.length > 0 && (
                <div className="mt-5 space-y-5 border-t border-g-line pt-5">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-g-muted">Total do pedido</span>
                    <span className="font-mono text-2xl font-bold text-g-cream">
                      {currency.format(total)}
                    </span>
                  </div>

                  {/* Campo WhatsApp */}
                  <div className="space-y-2">
                    <label
                      htmlFor="cart-phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-g-muted"
                    >
                      Seu WhatsApp para confirmação
                    </label>
                    <Input
                      id="cart-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="(84) 9 9999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-describedby="cart-phone-help"
                    />

                    {/* Erro — único uso de cor de alerta */}
                    {error && (
                      <p
                        role="alert"
                        className="text-xs text-g-error font-medium flex items-center gap-1"
                      >
                        <span aria-hidden="true">⚠</span> {error}
                      </p>
                    )}

                    <p
                      id="cart-phone-help"
                      className="flex items-center gap-1.5 text-[11px] text-g-faint"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-g-green shrink-0" />
                      Usado apenas para enviar os detalhes do pedido. LGPD.
                    </p>
                  </div>

                  {/* Botão de Confirmação — verde = confiança e ação positiva */}
                  <Button
                    id="cart-checkout-btn"
                    onClick={handleCheckout}
                    disabled={loading || items.length === 0}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-g-dark/40 border-t-g-dark" />
                        Preparando seu pedido…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Confirmar meu pedido
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-g-faint">
                    Você será redirecionado ao WhatsApp para finalizar
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
