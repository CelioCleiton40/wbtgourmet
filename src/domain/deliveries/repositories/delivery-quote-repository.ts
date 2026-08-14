import { DeliveryQuote } from '../entities/delivery-quote';

export interface DeliveryQuoteRepository {
  /** Persiste uma nova cotação ou atualiza o status/orderId de uma existente. */
  save(quote: DeliveryQuote): Promise<void>;

  /** Busca pelo UUID interno. */
  findById(id: string): Promise<DeliveryQuote | null>;

  /** Busca pelo ID retornado pela Uber (providerQuoteId). */
  findByProviderQuoteId(providerQuoteId: string): Promise<DeliveryQuote | null>;

  /** Retorna a cotação ativa vinculada ao pedido, ou null. */
  findByOrderId(orderId: string): Promise<DeliveryQuote | null>;
}
