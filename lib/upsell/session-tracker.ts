/**
 * Gerenciador de Sessão e Pressão Comercial (Frequency Capping).
 * 
 * Regra:
 * 1. Se o cliente recusou uma recomendação de determinado produto ou combo,
 *    não insistir na mesma sugestão durante a sessão atual.
 * 2. Máximo de 1 intervenção por produto principal adicionado.
 */

class UpsellSessionTracker {
  private declinedTargetIds: Set<string> = new Set();
  private intervenedProductIds: Set<string> = new Set();
  private cartUpsellDismissed = false;

  public recordDecline(targetId: string): void {
    this.declinedTargetIds.add(targetId);
  }

  public isDeclined(targetId: string): boolean {
    return this.declinedTargetIds.has(targetId);
  }

  public recordIntervention(productId: string): void {
    this.intervenedProductIds.add(productId);
  }

  public hasIntervened(productId: string): boolean {
    return this.intervenedProductIds.has(productId);
  }

  public dismissCartUpsell(): void {
    this.cartUpsellDismissed = true;
  }

  public isCartUpsellDismissed(): boolean {
    return this.cartUpsellDismissed;
  }

  public reset(): void {
    this.declinedTargetIds.clear();
    this.intervenedProductIds.clear();
    this.cartUpsellDismissed = false;
  }
}

export const sessionTracker = new UpsellSessionTracker();
