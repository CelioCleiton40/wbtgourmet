import { describe, it, expect, beforeEach } from 'vitest';
import { getBestUpsellOpportunity, getCartReminderRecommendation, getMenuItemById } from '@/lib/upsell/engine';
import { sessionTracker } from '@/lib/upsell/session-tracker';
import type { MenuItem } from '@/data/menu';

describe('Upsell Engine V2 — Single High-Value Opportunity & Combo-First', () => {
  beforeEach(() => {
    sessionTracker.reset();
  });

  it('deve priorizar o COMBO SMASH para o Smash Filé quando o carrinho estiver vazio', () => {
    const smashFile = getMenuItemById('sd-smash-file')!;
    expect(smashFile).toBeDefined();

    const opportunity = getBestUpsellOpportunity({
      product: smashFile,
      cartItems: [],
      tracker: sessionTracker,
    });

    expect(opportunity.shouldShow).toBe(true);
    expect(opportunity.reason).toBe('combo');
    expect(opportunity.primaryRecommendation?.type).toBe('combo');
    expect(opportunity.primaryRecommendation?.title).toContain('Complete seu Smash');
    expect(opportunity.primaryRecommendation?.itemsToAdd.map((i) => i.id)).toEqual([
      'sd-smash-file',
      'pt-batata-frita',
      'rf-coca',
    ]);
    // Preço total: 25 + 20 + 7 = 52
    expect(opportunity.primaryRecommendation?.totalPrice).toBe(52);
    expect(opportunity.quickAddons?.length).toBeGreaterThan(0);
  });

  it('NÃO deve recomendar combo se a batata frita já estiver no carrinho', () => {
    const smashFile = getMenuItemById('sd-smash-file')!;
    const batata = getMenuItemById('pt-batata-frita')!;

    const opportunity = getBestUpsellOpportunity({
      product: smashFile,
      cartItems: [batata],
      tracker: sessionTracker,
    });

    expect(opportunity.shouldShow).toBe(true);
    // Não é combo, pois a batata já está no carrinho
    expect(opportunity.primaryRecommendation?.type).not.toBe('combo');
    // Deve sugerir bebida ou adicionais
    expect(opportunity.primaryRecommendation?.itemsToAdd.map((i) => i.id)).not.toContain('pt-batata-frita');
  });

  it('NÃO deve recomendar bebida se o carrinho já contiver refrigerante', () => {
    const smashFile = getMenuItemById('sd-smash-file')!;
    const batata = getMenuItemById('pt-batata-frita')!;
    const coca = getMenuItemById('rf-coca')!;

    const opportunity = getBestUpsellOpportunity({
      product: smashFile,
      cartItems: [batata, coca],
      tracker: sessionTracker,
    });

    // Como já tem batata e bebida, deve exibir apenas adicionais se houver, ou não exibir
    if (opportunity.primaryRecommendation) {
      expect(opportunity.primaryRecommendation.type).not.toBe('drink');
      expect(opportunity.primaryRecommendation.type).not.toBe('side');
    }
  });

  it('deve respeitar a REGRA DE PRESSÃO COMERCIAL se o usuário já recusou o produto na sessão', () => {
    const smashFile = getMenuItemById('sd-smash-file')!;

    sessionTracker.recordDecline(smashFile.id);

    const opportunity = getBestUpsellOpportunity({
      product: smashFile,
      cartItems: [],
      tracker: sessionTracker,
    });

    expect(opportunity.shouldShow).toBe(false);
  });

  it('NÃO deve exibir upsell para adicionais isolados ou águas', () => {
    const queijo = getMenuItemById('ad-queijo')!;
    const agua = getMenuItemById('ag-sem-gas-500')!;

    expect(getBestUpsellOpportunity({ product: queijo }).shouldShow).toBe(false);
    expect(getBestUpsellOpportunity({ product: agua }).shouldShow).toBe(false);
  });

  it('deve sugerir bebida no CARRINHO INTELIGENTE apenas quando houver comida sem nenhuma bebida', () => {
    const smashFile = getMenuItemById('sd-smash-file')!;
    const coca = getMenuItemById('rf-coca')!;

    // Caso 1: Apenas lanche -> sugere bebida
    const suggestion1 = getCartReminderRecommendation([smashFile], sessionTracker);
    expect(suggestion1).not.toBeNull();
    expect(['rf-coca', 'rf-guarana']).toContain(suggestion1!.id);

    // Caso 2: Lanche + Bebida -> refeição completa, não sugere
    const suggestion2 = getCartReminderRecommendation([smashFile, coca], sessionTracker);
    expect(suggestion2).toBeNull();

    // Caso 3: Usuário fechou o banner -> não sugere mais
    sessionTracker.dismissCartUpsell();
    const suggestion3 = getCartReminderRecommendation([smashFile], sessionTracker);
    expect(suggestion3).toBeNull();
  });
});
