import { DeliveryQuote } from '@/domain/deliveries/entities/delivery-quote';
import { DeliveryQuoteRepository } from '@/domain/deliveries/repositories/delivery-quote-repository';
import { Money } from '@/domain/orders/value-objects/money';

export class InMemoryDeliveryQuoteRepository implements DeliveryQuoteRepository {
  private quotes: Map<string, DeliveryQuote> = new Map();
  public async save(quote: DeliveryQuote): Promise<void> {
    // Atribuir UUID interno se não existir (simula geração pelo banco)
    const id = (quote as DeliveryQuote & { id?: string }).id || crypto.randomUUID();

    // Recria com id atribuído (workaround para id readonly)
    const stored = DeliveryQuote.create({
      id,
      orderId: quote.orderId,
      provider: quote.provider,
      providerQuoteId: quote.providerQuoteId,
      fee: quote.fee,
      currency: quote.currency,
      expiresAt: quote.expiresAt,
      status: quote.status,
      createdAt: quote.createdAt,
    });
    this.quotes.set(id, stored);
  }

  public async findById(id: string): Promise<DeliveryQuote | null> {
    return this.quotes.get(id) ?? null;
  }

  public async findByProviderQuoteId(providerQuoteId: string): Promise<DeliveryQuote | null> {
    for (const quote of this.quotes.values()) {
      if (quote.providerQuoteId === providerQuoteId) return quote;
    }
    return null;
  }

  public async findByOrderId(orderId: string): Promise<DeliveryQuote | null> {
    for (const quote of this.quotes.values()) {
      if (quote.orderId === orderId && quote.status === 'active') return quote;
    }
    return null;
  }

  /** Utilitário para testes — insere uma quote com id definido. */
  public seedQuote(quote: DeliveryQuote & { id: string }): void {
    this.quotes.set(quote.id, quote);
  }

  public clear(): void {
    this.quotes.clear();
  }
}
