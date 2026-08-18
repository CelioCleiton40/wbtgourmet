'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem } from '@/data/menu';
import type { UpsellOpportunity } from '@/lib/upsell/types';
import { sessionTracker } from '@/lib/upsell/session-tracker';
import { Button } from '@/components/ui/button';
import { X, Check, Flame, Sparkles, Plus } from 'lucide-react';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface UpsellQuickModalProps {
  isOpen: boolean;
  product: MenuItem;
  opportunity: UpsellOpportunity;
  onClose: () => void;
  onConfirm: (itemsToAdd: MenuItem[]) => void;
}

export function UpsellQuickModal({
  isOpen,
  product,
  opportunity,
  onClose,
  onConfirm,
}: UpsellQuickModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<MenuItem[]>([]);

  if (!isOpen || !opportunity.shouldShow) return null;

  const primary = opportunity.primaryRecommendation;
  const isCombo = primary?.type === 'combo';

  function toggleAddon(addon: MenuItem) {
    setSelectedAddons((prev) =>
      prev.some((i) => i.id === addon.id)
        ? prev.filter((i) => i.id !== addon.id)
        : [...prev, addon]
    );
  }

  // Ação 1: Aceitar o Combo ou Recomendação Principal + Adicionais selecionados
  function handleAcceptPrimary() {
    const baseItems = primary?.itemsToAdd || [product];
    onConfirm([...baseItems, ...selectedAddons]);
  }

  // Ação 2: Aceitar apenas o produto base + Adicionais selecionados (sem o combo/acompanhamento)
  function handleAcceptProductOnly() {
    sessionTracker.recordDecline(product.id);
    onConfirm([product, ...selectedAddons]);
  }

  // Ação 3: Fechar ou Recusar completamente (apenas o produto puro)
  function handleDecline() {
    sessionTracker.recordDecline(product.id);
    onConfirm([product]);
  }

  const primaryTotalPrice =
    (primary ? primary.totalPrice : product.price) +
    selectedAddons.reduce((sum, i) => sum + i.price, 0);

  const productOnlyTotalPrice =
    product.price + selectedAddons.reduce((sum, i) => sum + i.price, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDecline}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border border-g-line bg-[#0E1612] text-g-cream shadow-2xl"
        >
          {/* Header com imagem e botão fechar */}
          <div className="relative border-b border-g-line/60 bg-g-surface/80 p-5 sm:p-6 pb-4">
            <button
              onClick={handleDecline}
              aria-label="Fechar e continuar apenas com o produto"
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-g-line bg-g-surface-2 text-g-muted transition-colors hover:border-g-cream hover:text-g-cream"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              {product.image && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-g-line/50 bg-g-surface-2">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-g-green flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Excelente Escolha
                </span>
                <h2 className="font-display text-lg sm:text-xl font-bold text-g-cream leading-tight">
                  {product.name}
                </h2>
                <p className="font-mono text-sm font-semibold text-g-gold mt-0.5">
                  {currency.format(product.price)}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* ─── 1. CARD DE DESTAQUE: COMBO OU ACOMPANHAMENTO PRINCIPAL ─── */}
            {primary && (
              <div className="rounded-2xl border border-g-green/40 bg-gradient-to-b from-g-green/10 via-g-surface-2 to-g-surface-2 p-4.5 relative overflow-hidden shadow-lg">
                {primary.badgeText && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-g-green/20 px-3 py-1 text-[11px] font-bold text-g-green border border-g-green/40 mb-2.5">
                    {isCombo ? <Flame className="h-3.5 w-3.5 text-g-gold" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {primary.badgeText}
                  </div>
                )}

                <h3 className="text-base font-bold text-g-cream">
                  {primary.title}
                </h3>
                <p className="text-xs text-g-muted mt-1 leading-relaxed">
                  {primary.description}
                </p>

                {/* Itens do combo listados */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {primary.itemsToAdd.map((item, idx) => (
                    <span
                      key={item.id + idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-black/40 border border-g-line/80 px-2.5 py-1 text-xs text-g-cream/90 font-medium"
                    >
                      <Check className="h-3 w-3 text-g-green" />
                      {item.name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-g-line/60 pt-3">
                  <div>
                    <span className="text-[11px] text-g-faint uppercase font-semibold">Total do Combo</span>
                    <p className="font-mono text-lg font-bold text-g-cream">
                      {currency.format(primaryTotalPrice)}
                    </p>
                  </div>

                  <Button
                    onClick={handleAcceptPrimary}
                    variant="primary"
                    size="default"
                    className="shadow-md shadow-g-green/20"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      {isCombo ? 'Quero o Combo Completo' : 'Adicionar Completo'}
                      <Plus className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* ─── 2. ADICIONAIS RÁPIDOS (OPCIONAL) ─── */}
            {opportunity.quickAddons && opportunity.quickAddons.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-g-muted">
                  Quer turbinar com adicionais?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {opportunity.quickAddons.map((addon) => {
                    const isSelected = selectedAddons.some((i) => i.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-g-green bg-g-green/15 text-g-cream shadow-sm'
                            : 'border-g-line bg-g-surface hover:border-g-line/80 text-g-muted hover:text-g-cream'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="text-xs font-semibold truncate">{addon.name}</p>
                          <p className="font-mono text-[11px] text-g-gold">
                            +{currency.format(addon.price)}
                          </p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-g-green bg-g-green text-black'
                              : 'border-g-line/80 bg-g-surface-2'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ─── FOOTER: AÇÃO DIRETA & SEM ATRITO ─── */}
          <div className="border-t border-g-line/80 bg-g-surface/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleAcceptProductOnly}
              className="text-xs font-medium text-g-muted hover:text-g-cream transition-colors underline-offset-4 hover:underline order-2 sm:order-1 text-center"
            >
              {selectedAddons.length > 0
                ? `Continuar só com ${product.name} (+ adicionais: ${currency.format(productOnlyTotalPrice)})`
                : `Continuar apenas com ${product.name} (${currency.format(product.price)})`}
            </button>

            <Button
              onClick={handleAcceptProductOnly}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Adicionar ao Carrinho
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
