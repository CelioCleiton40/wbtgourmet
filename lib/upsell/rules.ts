import type { ProductUpsellRule } from './types';

/**
 * Matriz de regras de upsell e combos contextuais da WBT Gourmet.
 * 
 * Regra estrita: Todos os IDs mapeados abaixo devem obrigatoriamente
 * existir no cardápio oficial em data/menu.ts.
 */
export const UPSELL_RULES: ProductUpsellRule[] = [
  // ─── 1. Smash Filé (Combo-First Especial) ──────────────────────────────────
  {
    targetProductId: 'sd-smash-file',
    combo: {
      comboId: 'combo-smash-completo',
      title: '🔥 Complete seu Smash!',
      subtitle: 'Smash Filé + Batata Frita + Coca-Cola',
      description: 'A combinação mais pedida: seu Smash acompanhado de batata crocante e refrigerante gelado.',
      targetProductId: 'sd-smash-file',
      includedProductIds: ['pt-batata-frita', 'rf-coca'],
      badgeText: 'Combo Mais Pedido 🔥',
      priority: 100,
    },
    primaryAlternativeId: 'pt-batata-frita',
    quickAddonIds: ['ad-queijo', 'ad-bacon', 'ad-ovo', 'ad-molho'],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 2. Categoria Sanduíches (Geral) ───────────────────────────────────────
  {
    targetCategory: 'sanduiches',
    primaryAlternativeId: 'pt-batata-frita',
    quickAddonIds: ['ad-queijo', 'ad-bacon', 'ad-ovo', 'ad-molho'],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 3. Pratos com Filé Mignon e Camarão ────────────────────────────────────
  {
    targetCategory: 'file-mignon',
    primaryAlternativeId: 'pt-batata-frita',
    quickAddonIds: ['ad-file', 'ad-queijo', 'ad-molho'],
    drinkFallbackId: 'sc-laranja',
  },
  {
    targetCategory: 'camarao',
    primaryAlternativeId: 'pt-batata-frita',
    quickAddonIds: ['ad-queijo', 'ad-molho'],
    drinkFallbackId: 'sc-laranja',
  },

  // ─── 4. Tapiocas e Crepiocas ────────────────────────────────────────────────
  {
    targetCategory: 'tapiocas',
    primaryAlternativeId: 'sc-laranja',
    quickAddonIds: ['ad-queijo', 'ad-frango', 'ad-bacon'],
    drinkFallbackId: 'sc-laranja',
  },
  {
    targetCategory: 'crepioca',
    primaryAlternativeId: 'sc-laranja',
    quickAddonIds: ['ad-queijo', 'ad-frango', 'ad-bacon'],
    drinkFallbackId: 'sc-laranja',
  },

  // ─── 5. Petiscos e Salgados ────────────────────────────────────────────────
  {
    targetCategory: 'petiscos',
    primaryAlternativeId: 'rf-coca',
    quickAddonIds: ['ad-molho', 'ad-bacon', 'ad-queijo'],
    drinkFallbackId: 'rf-coca',
  },
  {
    targetCategory: 'salgados',
    primaryAlternativeId: 'rf-guarana',
    quickAddonIds: ['ad-molho'],
    drinkFallbackId: 'rf-guarana',
  },

  // ─── 6. Açaí ────────────────────────────────────────────────────────────────
  {
    targetCategory: 'acai',
    primaryAlternativeId: 'ag-sem-gas-500',
    drinkFallbackId: 'ag-sem-gas-500',
  },
];
