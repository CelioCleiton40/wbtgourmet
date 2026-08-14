import { DeliveryQuote } from '@/domain/deliveries/entities/delivery-quote';
import { DeliveryQuoteRepository } from '@/domain/deliveries/repositories/delivery-quote-repository';
import { Money } from '@/domain/orders/value-objects/money';
import { PersistenceError } from '@/shared/errors/domain-errors';
import { getServerSupabaseClient } from '../supabase/server-client';

export class SupabaseDeliveryQuoteRepository implements DeliveryQuoteRepository {
  public async save(quote: DeliveryQuote): Promise<void> {
    const supabase = getServerSupabaseClient();
    if (!supabase) {
      throw new PersistenceError('Supabase cliente não está disponível.');
    }

    const payload = {
      order_id: quote.orderId || null,
      provider: quote.provider,
      provider_quote_id: quote.providerQuoteId,
      fee_cents: quote.fee.cents,
      currency: quote.currency,
      expires_at: quote.expiresAt.toISOString(),
      status: quote.status,
      created_at: quote.createdAt.toISOString(),
    };

    if (quote.id) {
      const { error } = await supabase
        .from('delivery_quotes')
        .update(payload)
        .eq('id', quote.id);

      if (error) {
        throw new PersistenceError(`Erro ao atualizar cotação: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('delivery_quotes')
        .insert(payload);

      if (error) {
        throw new PersistenceError(`Erro ao salvar cotação: ${error.message}`);
      }
    }
  }

  public async findById(id: string): Promise<DeliveryQuote | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('delivery_quotes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  public async findByProviderQuoteId(providerQuoteId: string): Promise<DeliveryQuote | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('delivery_quotes')
      .select('*')
      .eq('provider_quote_id', providerQuoteId)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  public async findByOrderId(orderId: string): Promise<DeliveryQuote | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('delivery_quotes')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  private mapToDomain(row: Record<string, unknown>): DeliveryQuote {
    return DeliveryQuote.create({
      id: String(row.id),
      orderId: row.order_id ? String(row.order_id) : undefined,
      provider: String(row.provider),
      providerQuoteId: String(row.provider_quote_id),
      fee: Money.fromCents(Number(row.fee_cents)),
      currency: String(row.currency),
      expiresAt: new Date(String(row.expires_at)),
      status: row.status as 'active' | 'expired' | 'used',
      createdAt: new Date(String(row.created_at)),
    });
  }
}
