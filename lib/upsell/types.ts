import type { MenuItem } from '@/data/menu';

export type UpsellType = 'combo' | 'side' | 'drink' | 'addon';

export interface ComboRule {
  comboId: string;
  title: string;
  subtitle?: string;
  description: string;
  targetProductId: string;
  includedProductIds: string[]; // ex: ['pt-batata-frita', 'rf-coca']
  badgeText?: string; // ex: 'Combo Completo 🔥'
  priority: number;
}

export interface ProductUpsellRule {
  targetProductId?: string;
  targetCategory?: string;
  combo?: ComboRule;
  primaryAlternativeId?: string; // Melhor acompanhamento individual (ex: 'pt-batata-frita')
  quickAddonIds?: string[];       // Adicionais rápidos (ex: ['ad-queijo', 'ad-bacon', 'ad-ovo', 'ad-molho'])
  drinkFallbackId?: string;       // Bebida mais compatível (ex: 'rf-coca')
}

export interface PrimaryRecommendation {
  type: UpsellType;
  title: string;
  subtitle?: string;
  description: string;
  itemsToAdd: MenuItem[];
  totalPrice: number;
  badgeText?: string;
  priority: number;
}

export interface UpsellOpportunity {
  shouldShow: boolean;
  reason?: 'combo' | 'complement' | 'drink_reminder';
  primaryRecommendation?: PrimaryRecommendation;
  quickAddons?: MenuItem[];
}
