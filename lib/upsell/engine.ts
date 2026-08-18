import { menu, MenuItem } from '@/data/menu';
import type { UpsellOpportunity, ProductUpsellRule } from './types';
import { UPSELL_RULES } from './rules';
import { sessionTracker } from './session-tracker';

/**
 * Mapa em memória de todos os produtos do cardápio indexados por ID.
 */
const menuItemsById = new Map<string, MenuItem>();
for (const section of menu) {
  for (const item of section.items) {
    menuItemsById.set(item.id, item);
  }
}

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItemsById.get(id);
}

const DRINK_CATEGORIES = new Set(['refrigerantes', 'aguas', 'sucos', 'energeticos']);

export interface GetUpsellParams {
  product: MenuItem;
  cartItems?: MenuItem[];
  tracker?: typeof sessionTracker;
}

/**
 * Motor de Recomendação Inteligente (Pure Function)
 * 
 * Avalia o produto escolhido, o estado do carrinho e o histórico da sessão
 * para determinar a melhor oportunidade única de conversão (Combo-First ou Acompanhamento Chave).
 */
export function getBestUpsellOpportunity({
  product,
  cartItems = [],
  tracker = sessionTracker,
}: GetUpsellParams): UpsellOpportunity {
  // 1. Regra de Pressão Comercial: se o usuário já recusou este produto nesta sessão, não insistir
  if (tracker.isDeclined(product.id)) {
    return { shouldShow: false };
  }

  // 2. Não recomendar upsells para itens que já são adicionais, águas simples ou bebidas isoladas
  if (product.category === 'adicionais' || product.category === 'aguas') {
    return { shouldShow: false };
  }

  // 3. Localizar regra mais específica (por ID de produto ou categoria)
  const rule =
    UPSELL_RULES.find((r) => r.targetProductId === product.id) ||
    UPSELL_RULES.find((r) => r.targetCategory === product.category);

  if (!rule) {
    return { shouldShow: false };
  }

  // 4. Mapear estado do carrinho para exclusão inteligente
  const cartIds = new Set(cartItems.map((i) => i.id));
  const hasDrinkInCart = cartItems.some((i) => DRINK_CATEGORIES.has(i.category));
  const hasBatataInCart = cartIds.has('pt-batata-frita');

  // 5. Avaliar se há Combo-First aplicável
  if (rule.combo) {
    const includedItems: MenuItem[] = [];
    let isAnyIncludedInCart = false;

    for (const id of rule.combo.includedProductIds) {
      if (cartIds.has(id)) {
        isAnyIncludedInCart = true;
        break;
      }
      const item = getMenuItemById(id);
      if (item) includedItems.push(item);
    }

    // Se o combo é válido e o cliente ainda não tem os itens no carrinho: COMBO-FIRST!
    if (!isAnyIncludedInCart && includedItems.length > 0) {
      const itemsToAdd = [product, ...includedItems];
      const totalPrice = itemsToAdd.reduce((sum, i) => sum + i.price, 0);

      const quickAddons: MenuItem[] = (rule.quickAddonIds || [])
        .map((id) => getMenuItemById(id))
        .filter((i): i is MenuItem => i !== undefined && !cartIds.has(i.id));

      return {
        shouldShow: true,
        reason: 'combo',
        primaryRecommendation: {
          type: 'combo',
          title: rule.combo.title,
          subtitle: rule.combo.subtitle,
          description: rule.combo.description,
          itemsToAdd,
          totalPrice,
          badgeText: rule.combo.badgeText,
          priority: rule.combo.priority,
        },
        quickAddons,
      };
    }
  }

  // 6. Avaliar Acompanhamento Individual Principal
  let primaryItem: MenuItem | undefined;
  if (rule.primaryAlternativeId && !cartIds.has(rule.primaryAlternativeId)) {
    const candidate = getMenuItemById(rule.primaryAlternativeId);
    if (candidate) {
      // Se for bebida e o cliente já tem bebida, não recomendar
      const isCandidateDrink = DRINK_CATEGORIES.has(candidate.category);
      if (!(isCandidateDrink && hasDrinkInCart) && !(candidate.id === 'pt-batata-frita' && hasBatataInCart)) {
        primaryItem = candidate;
      }
    }
  }

  // Se não encontrou o principal, tentar fallback de bebida se o carrinho não tiver bebida
  if (!primaryItem && rule.drinkFallbackId && !hasDrinkInCart && !cartIds.has(rule.drinkFallbackId)) {
    primaryItem = getMenuItemById(rule.drinkFallbackId);
  }

  // 7. Obter adicionais rápidos
  const quickAddons: MenuItem[] = (rule.quickAddonIds || [])
    .map((id) => getMenuItemById(id))
    .filter((i): i is MenuItem => i !== undefined && !cartIds.has(i.id));

  if (!primaryItem && quickAddons.length === 0) {
    return { shouldShow: false };
  }

  if (primaryItem) {
    const isDrink = DRINK_CATEGORIES.has(primaryItem.category);
    return {
      shouldShow: true,
      reason: 'complement',
      primaryRecommendation: {
        type: isDrink ? 'drink' : 'side',
        title: isDrink ? '🥤 Que tal uma bebida gelada?' : '🍟 Complete sua refeição!',
        subtitle: primaryItem.name,
        description: `Adicione ${primaryItem.name} para acompanhar seu ${product.name}.`,
        itemsToAdd: [product, primaryItem],
        totalPrice: product.price + primaryItem.price,
        badgeText: isDrink ? 'Bebida Gelada' : 'Acompanhamento',
        priority: 80,
      },
      quickAddons,
    };
  }

  return {
    shouldShow: true,
    reason: 'complement',
    quickAddons,
  };
}

/**
 * Sugestão de Fechamento de Pedido no Carrinho (Cart Smart Reminder)
 * 
 * Se o cliente possui comida mas nenhuma bebida no carrinho,
 * sugere uma bebida refrescante de alto valor antes do checkout.
 */
export function getCartReminderRecommendation(
  cartItems: MenuItem[],
  tracker = sessionTracker
): MenuItem | null {
  if (tracker.isCartUpsellDismissed()) return null;
  if (cartItems.length === 0) return null;

  const hasFood = cartItems.some((i) => !DRINK_CATEGORIES.has(i.category) && i.category !== 'adicionais');
  const hasDrink = cartItems.some((i) => DRINK_CATEGORIES.has(i.category));

  // Se tem comida e não tem nenhuma bebida: sugerir Coca-Cola ou Guaraná
  if (hasFood && !hasDrink) {
    return getMenuItemById('rf-coca') || getMenuItemById('rf-guarana') || null;
  }

  return null;
}
