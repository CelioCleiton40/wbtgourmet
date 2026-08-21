'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight,
  UtensilsCrossed, MapPin, Truck, ChevronLeft, Loader2,
} from 'lucide-react';
import { CartSmartRecommendation } from '@/components/cart/cart-smart-recommendation';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type Step = 'cart' | 'address';

interface AddressForm {
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
}

const emptyAddress: AddressForm = {
  street: '', number: '', complement: '', district: '', city: '', state: '', postalCode: '',
};

export function CartDrawer() {
  const items       = useCartStore((s) => s.items);
  const isOpen      = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const clearCart   = useCartStore((s) => s.clearCart);
  const removeItem  = useCartStore((s) => s.removeItem);
  const updateQty   = useCartStore((s) => s.updateQuantity);
  const total       = useCartStore((s) => s.total());

  const [step, setStep]       = useState<Step>('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [phone, setPhone]     = useState('');

  // Step 1 → 2 result
  const [orderId, setOrderId] = useState('');

  // Address + quote state
  const [address, setAddress]         = useState<AddressForm>(emptyAddress);
  const [quoteId, setQuoteId]         = useState('');
  const [feeCents, setFeeCents]       = useState<number | null>(null);
  const [quoteExpiry, setQuoteExpiry] = useState<Date | null>(null);
  const [quotingFee, setQuotingFee]   = useState(false);
  const [loadingCep, setLoadingCep]   = useState(false);

  function resetDrawer() {
    setStep('cart');
    setError('');
    setPhone('');
    setOrderId('');
    setAddress(emptyAddress);
    setQuoteId('');
    setFeeCents(null);
    setQuoteExpiry(null);
    setLoadingCep(false);
  }

  // ── Busca de CEP automática ViaCEP ───────────────────────────────────────
  async function fetchAddressByCep(cleanCep: string) {
    if (cleanCep.length !== 8) return;

    // Verificação imediata de faixa de CEP de Mossoró-RN (59600-000 a 59649-898)
    const numCep = parseInt(cleanCep, 10);
    if (isNaN(numCep) || numCep < 59600000 || numCep > 59649898) {
      setError('A WBT Gourmet entrega exclusivamente em Mossoró-RN (CEPs 59600-000 a 59649-898). O CEP informado não é atendido.');
      return;
    }

    setLoadingCep(true);
    setError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (data.erro) {
          setError('CEP não encontrado. Verifique os números ou preencha manualmente.');
          return;
        }

        const cleanCity = (data.localidade || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
          .toLowerCase();

        if (data.uf !== 'RN' || cleanCity !== 'mossoro') {
          setError('A WBT Gourmet realiza entregas apenas em Mossoró-RN. O CEP informado pertence a outra localidade.');
          return;
        }

        setAddress((prev) => ({
          ...prev,
          postalCode: cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
          street: data.logradouro || prev.street,
          district: data.bairro || prev.district,
          city: data.localidade || prev.city,
          state: (data.uf || prev.state).toUpperCase(),
        }));
        setTimeout(() => {
          const numberEl = document.getElementById('addr-number');
          if (numberEl) numberEl.focus();
        }, 100);
      }
    } catch {
      // Permite preenchimento manual em caso de falha de conexão
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(val: string) {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 5) {
      formatted = `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
    }
    setAddress((prev) => ({ ...prev, postalCode: formatted }));

    if (clean.length === 8) {
      fetchAddressByCep(clean);
    }
  }

  function getNormalizedPhone(rawPhone: string): string {
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('0') && (clean.length === 11 || clean.length === 12)) {
      clean = clean.substring(1);
    }
    if (!clean.startsWith('55') && (clean.length === 10 || clean.length === 11)) {
      clean = `55${clean}`;
    }
    return clean;
  }

  function handlePhoneChange(val: string) {
    let clean = val.replace(/\D/g, '');
    if (clean.startsWith('55') && clean.length > 11) {
      clean = clean.substring(2);
    } else if (clean.startsWith('0') && clean.length > 10) {
      clean = clean.substring(1);
    }

    let formatted = clean;
    if (clean.length > 0) {
      if (clean.length <= 2) {
        formatted = `(${clean}`;
      } else if (clean.length <= 6) {
        formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
      } else if (clean.length <= 10) {
        formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
      } else {
        formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
      }
    }

    setPhone(formatted);
  }

  // ── Step 1: Validar telefone e avançar para endereço ─────────────────────
  function handleContinueToAddress() {
    setError('');
    const cleanPhone = getNormalizedPhone(phone);
    if (!cleanPhone || cleanPhone.length < 12 || cleanPhone.length > 13 || !cleanPhone.startsWith('55')) {
      setError('Digite um WhatsApp válido com DDD (ex: 84 9 9999-9999).');
      return;
    }
    setStep('address');
  }

  // ── Step 2a: Calcular frete ────────────────────────────────────────────────
  async function handleQuoteFee() {
    setError('');
    const cleanCep = address.postalCode.replace(/\D/g, '');
    if (!address.street || !address.number || !address.district || !address.city || !address.state || cleanCep.length !== 8) {
      setError('Preencha rua, número, bairro, cidade, estado e CEP válido (8 dígitos).');
      return;
    }

    const numCep = parseInt(cleanCep, 10);
    const cleanCity = address.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    if (isNaN(numCep) || numCep < 59600000 || numCep > 59649898 || address.state.toUpperCase() !== 'RN' || cleanCity !== 'mossoro') {
      setError('O delivery da WBT Gourmet atende exclusivamente a cidade de Mossoró-RN (CEPs 59600-000 a 59649-898).');
      return;
    }

    setQuotingFee(true);
    try {
      const res = await fetch('/api/deliveries/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropoffAddress: {
            ...address,
            postalCode: cleanCep,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível calcular o frete.');
        return;
      }

      setQuoteId(data.quoteId);
      setFeeCents(data.feeCents);
      setQuoteExpiry(new Date(data.expiresAt));
    } catch {
      setError('Erro ao calcular frete. Tente novamente.');
    } finally {
      setQuotingFee(false);
    }
  }

  // ── Step 2b: Criar pedido + Iniciar Stripe Checkout ────────────────────────
  async function handleGoToStripe() {
    if (!quoteId || feeCents === null) {
      setError('Calcule o frete antes de continuar.');
      return;
    }

    // Verificar se a cotação ainda está válida (15 min)
    if (quoteExpiry && new Date() > quoteExpiry) {
      setError('A cotação de frete expirou. Recalcule o frete antes de continuar.');
      setQuoteId('');
      setFeeCents(null);
      return;
    }

    const cleanPhone = getNormalizedPhone(phone);
    if (!cleanPhone || cleanPhone.length < 12 || cleanPhone.length > 13 || !cleanPhone.startsWith('55')) {
      setError('Telefone para WhatsApp inválido. Informe DDD + número.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. Criar o pedido vinculando a cotação de frete oficial
      const orderIdempotencyKey = crypto.randomUUID();
      const aggregatedItemsMap = new Map<string, number>();
      for (const item of items) {
        aggregatedItemsMap.set(item.id, (aggregatedItemsMap.get(item.id) || 0) + item.quantity);
      }
      const payloadItems = Array.from(aggregatedItemsMap.entries()).map(([id, quantity]) => ({ id, quantity }));

      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          customerPhone: cleanPhone,
          idempotencyKey: orderIdempotencyKey,
          quoteId: quoteId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || 'Erro ao criar pedido. Tente novamente.');
        return;
      }

      const createdOrderId = orderData.orderId || orderData.orderCode;
      setOrderId(createdOrderId);

      // 2. Criar a Checkout Session do Stripe com o pedido já contendo o frete
      const checkoutIdempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createdOrderId,
          idempotencyKey: checkoutIdempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 410) {
          setError('O frete expirou. Recalcule antes de continuar.');
          setQuoteId('');
          setFeeCents(null);
          return;
        }
        setError(data.error || 'Erro ao iniciar pagamento.');
        return;
      }

      closeDrawer();
      window.location.href = data.url;
    } catch {
      setError('Erro de conexão ao iniciar pagamento.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const totalWithFee = feeCents !== null ? total + feeCents / 100 : total;
  const isQuoteExpiringSoon =
    quoteExpiry && new Date() > new Date(quoteExpiry.getTime() - 2 * 60 * 1000); // < 2 min

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-g-line bg-g-surface shadow-2xl"
          >
            {/* Barra decorativa */}
            <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-g-green-dk via-g-green to-g-green-lt" />

            {/* Handle mobile */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-g-line" />
            </div>

            <div className="p-6">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between pb-4 border-b border-g-line">
                <div className="flex items-center gap-2.5">
                  {step === 'address' && (
                    <button
                      onClick={() => { setStep('cart'); setError(''); }}
                      className="mr-1 flex h-7 w-7 items-center justify-center rounded-full bg-g-surface-2 text-g-muted hover:text-g-cream transition-colors"
                      aria-label="Voltar ao carrinho"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-g-green/15">
                    {step === 'cart'
                      ? <ShoppingBag className="h-4.5 w-4.5 text-g-green" />
                      : <MapPin className="h-4.5 w-4.5 text-g-green" />}
                  </div>
                  <div>
                    <h2 id="cart-title" className="font-display text-xl text-g-cream">
                      {step === 'cart' ? 'Seu Pedido' : 'Endereço de Entrega'}
                    </h2>
                    <p className="text-[11px] text-g-muted">
                      {step === 'cart'
                        ? `${items.length} ${items.length === 1 ? 'item' : 'itens'}`
                        : 'Passo 2 de 2'}
                    </p>
                  </div>
                </div>
                <button
                  id="cart-drawer-close"
                  onClick={() => { closeDrawer(); resetDrawer(); }}
                  aria-label="Fechar carrinho"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-g-surface-2 text-g-muted hover:bg-g-line hover:text-g-cream transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* ─── STEP 1: Carrinho ─────────────────────────────────── */}
              {step === 'cart' && (
                <>
                  {/* Lista de itens */}
                  <div className="mt-4">
                    {items.length === 0 ? (
                      <div className="py-14 text-center text-g-muted">
                        <UtensilsCrossed className="mx-auto h-10 w-10 opacity-25 mb-3" />
                        <p className="text-sm font-medium">Seu carrinho está vazio</p>
                        <p className="text-xs text-g-faint mt-1">Escolha algo delicioso do nosso cardápio!</p>
                      </div>
                    ) : (
                      <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        <AnimatePresence initial={false}>
                          {items.map((item) => {
                            const itemKey = item.cartItemId || item.id;
                            return (
                              <motion.li
                                key={itemKey}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between gap-3 rounded-xl border border-g-line bg-g-surface-2 p-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-g-cream truncate">{item.name}</p>
                                  {item.selectedSauce && (
                                    <p className="text-[11px] font-medium text-g-gold mt-0.5">
                                      ✨ Molho: <span className="text-g-cream font-semibold">{item.selectedSauce}</span>
                                    </p>
                                  )}
                                  <p className="mt-0.5 font-mono text-xs text-g-muted">
                                    {currency.format(item.price)} × {item.quantity}{' '}={' '}
                                    <span className="text-g-gold font-semibold">
                                      {currency.format(item.price * item.quantity)}
                                    </span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 rounded-full border border-g-line bg-g-dark p-0.5 shrink-0">
                                  <button
                                    id={`cart-dec-${itemKey}`}
                                    onClick={() => item.quantity === 1 ? removeItem(itemKey) : updateQty(itemKey, item.quantity - 1)}
                                    aria-label={`Remover um ${item.name}`}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-g-muted hover:bg-g-surface-2 hover:text-g-cream transition-colors"
                                  >
                                    <Minus className="h-2.5 w-2.5" />
                                  </button>
                                  <span className="min-w-[18px] text-center font-mono text-xs font-bold text-g-green">
                                    {item.quantity}
                                  </span>
                                  <button
                                    id={`cart-inc-${itemKey}`}
                                    onClick={() => updateQty(itemKey, item.quantity + 1)}
                                    aria-label={`Adicionar mais ${item.name}`}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-g-green text-g-dark hover:bg-g-green-lt transition-colors"
                                  >
                                    <Plus className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    )}
                  </div>

                  {/* Checkout step 1 */}
                  {items.length > 0 && (
                    <div className="mt-4 space-y-4 border-t border-g-line pt-4">
                      {/* Recomendação inteligente de bebida/complemento se a refeição estiver incompleta */}
                      <CartSmartRecommendation />

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-g-muted">Subtotal</span>
                        <span className="font-mono text-2xl font-bold text-g-cream">
                          {currency.format(total)}
                        </span>
                      </div>
                      <p className="text-[11px] text-g-faint">
                        + frete calculado na próxima etapa
                      </p>

                      <div className="space-y-2">
                        <label htmlFor="cart-phone" className="block text-xs font-semibold uppercase tracking-wider text-g-muted">
                          Seu WhatsApp para confirmação
                        </label>
                        <Input
                          id="cart-phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="(84) 9 9999-9999"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                        />
                        {error && (
                          <p role="alert" className="text-xs text-g-error font-medium flex items-center gap-1">
                            <span aria-hidden="true">⚠</span> {error}
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 text-[11px] text-g-faint">
                          <ShieldCheck className="h-3.5 w-3.5 text-g-green shrink-0" />
                          Usado apenas para enviar os detalhes do pedido. LGPD.
                        </p>
                      </div>

                      <Button
                        id="cart-continue-btn"
                        onClick={handleContinueToAddress}
                        disabled={items.length === 0}
                        variant="primary"
                        size="lg"
                        className="w-full"
                      >
                        <span className="flex items-center gap-2">
                          Continuar para entrega
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* ─── STEP 2: Endereço + Frete ─────────────────────────── */}
              {step === 'address' && (
                <div className="mt-5 space-y-4">
                  {/* Resumo do pedido */}
                  <div className="rounded-xl border border-g-line bg-g-surface-2 p-3 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-g-muted mb-2">Resumo</p>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-g-muted">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="font-mono">{currency.format(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between text-sm font-semibold text-g-cream border-t border-g-line mt-2">
                      <span>Subtotal</span>
                      <span className="font-mono">{currency.format(total)}</span>
                    </div>
                  </div>

                  {/* Campos de endereço */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-g-muted">Endereço de entrega</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          id="addr-cep"
                          placeholder="CEP (ex: 59607-000)"
                          maxLength={9}
                          value={address.postalCode}
                          onChange={(e) => handleCepChange(e.target.value)}
                        />
                        {loadingCep && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-g-green font-medium">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          </div>
                        )}
                      </div>
                      <Input
                        id="addr-state"
                        placeholder="Estado (ex: RN)"
                        maxLength={2}
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <Input
                      id="addr-street"
                      placeholder="Rua / Avenida"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="addr-number"
                        placeholder="Número"
                        value={address.number}
                        onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      />
                      <Input
                        id="addr-complement"
                        placeholder="Complemento"
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      />
                    </div>
                    <Input
                      id="addr-district"
                      placeholder="Bairro"
                      value={address.district}
                      onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    />
                    <Input
                      id="addr-city"
                      placeholder="Cidade"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>

                  {/* Frete */}
                  {feeCents !== null ? (
                    <div className={`rounded-xl border p-3 ${isQuoteExpiringSoon ? 'border-amber-500/50 bg-amber-500/10' : 'border-g-green/30 bg-g-green/10'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-g-green">
                          <Truck className="h-4 w-4" />
                          <span className="font-semibold">Frete Uber Direct</span>
                        </div>
                        <span className="font-mono font-bold text-g-green">
                          {currency.format(feeCents / 100)}
                        </span>
                      </div>
                      {isQuoteExpiringSoon && (
                        <p className="mt-1 text-[11px] text-amber-400">
                          ⚠ Cotação expirando em breve — confirme logo ou recalcule.
                        </p>
                      )}
                      <div className="mt-2 pt-2 border-t border-g-line flex justify-between text-sm font-bold text-g-cream">
                        <span>Total</span>
                        <span className="font-mono">{currency.format(totalWithFee)}</span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      id="calc-fee-btn"
                      onClick={handleQuoteFee}
                      disabled={quotingFee}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      {quotingFee ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Calculando frete…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Calcular frete
                        </span>
                      )}
                    </Button>
                  )}

                  {error && (
                    <p role="alert" className="text-xs text-g-error font-medium flex items-center gap-1">
                      <span aria-hidden="true">⚠</span> {error}
                    </p>
                  )}

                  {/* Botão final — só aparece após ter frete */}
                  {feeCents !== null && (
                    <Button
                      id="pay-btn"
                      onClick={handleGoToStripe}
                      disabled={loading}
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecionando…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Pagar com cartão
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  )}

                  <p className="text-center text-[11px] text-g-faint">
                    Você será redirecionado para a página segura do Stripe para inserir os dados do cartão.
                  </p>
                  <p className="flex justify-center items-center gap-1.5 text-[11px] text-g-faint">
                    <ShieldCheck className="h-3.5 w-3.5 text-g-green shrink-0" />
                    Pagamento processado pelo Stripe — seus dados nunca passam pelo WBT Gourmet.
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
