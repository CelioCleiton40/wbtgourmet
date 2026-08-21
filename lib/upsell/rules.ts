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
    quickAddonIds: ['ad-queijo', 'ad-bacon', 'ad-ovo', 'ad-molho-alho', 'ad-molho-azeitona', 'ad-molho-rose'],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 2. Categoria Sanduíches (Geral) ───────────────────────────────────────
  {
    targetCategory: 'sanduiches',
    primaryAlternativeId: 'pt-batata-frita',
    quickAddonIds: ['ad-queijo', 'ad-bacon', 'ad-ovo', 'ad-molho-alho', 'ad-molho-azeitona', 'ad-molho-rose'],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 3. Pratos com Filé Mignon e Camarão (Apenas Bebidas, Sem Adicionais) ───
  {
    targetCategory: 'file-mignon',
    primaryAlternativeId: 'sc-laranja',
    quickAddonIds: [],
    drinkFallbackId: 'rf-coca',
  },
  {
    targetCategory: 'camarao',
    primaryAlternativeId: 'sc-laranja',
    quickAddonIds: [],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 4. Panquecas (Molho Incluso Obrigatório + Apenas Bebida, Sem Adicionais) 
  {
    targetCategory: 'panquecas',
    primaryAlternativeId: 'sc-laranja',
    quickAddonIds: [],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 5. Espetinhos (Apenas Bebida, Sem Molho e Sem Adicionais) ──────────────
  {
    targetCategory: 'espetinhos',
    primaryAlternativeId: 'rf-coca',
    quickAddonIds: [],
    drinkFallbackId: 'rf-coca',
  },

  // ─── 6. Tapiocas e Crepiocas (Com Adicionais e Bebida) ──────────────────────
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

  // ─── 7. Sabores Regionais / Cuscuz (Com Adicionais e Bebida) ────────────────
  {
    targetCategory: 'sabores-regionais',
    primaryAlternativeId: 'sc-laranja',
    quickAddonIds: ['ad-queijo', 'ad-bacon', 'ad-ovo', 'ad-frango', 'ad-calabresa'],
    drinkFallbackId: 'sc-laranja',
  },

  // ─── 8. Petiscos e Salgados (Com Adicionais e Bebida) ───────────────────────
  {
    targetCategory: 'petiscos',
    primaryAlternativeId: 'rf-coca',
    quickAddonIds: ['ad-molho-alho', 'ad-molho-azeitona', 'ad-molho-rose', 'ad-bacon', 'ad-queijo'],
    drinkFallbackId: 'rf-coca',
  },
  {
    targetCategory: 'salgados',
    primaryAlternativeId: 'rf-guarana',
    quickAddonIds: ['ad-molho-alho', 'ad-molho-azeitona', 'ad-molho-rose'],
    drinkFallbackId: 'rf-guarana',
  },

  // ─── 9. Açaí ────────────────────────────────────────────────────────────────
  {
    targetCategory: 'acai',
    primaryAlternativeId: 'ag-sem-gas-500',
    drinkFallbackId: 'ag-sem-gas-500',
  },
];
