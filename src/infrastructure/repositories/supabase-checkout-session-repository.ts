import { CheckoutSession, CheckoutSessionStatus } from '@/domain/payments/entities/checkout-session';
import { CheckoutSessionRepository } from '@/domain/payments/repositories/checkout-session-repository';
import { PersistenceError } from '@/shared/errors/domain-errors';
import { getServerSupabaseClient } from '../supabase/server-client';

export class SupabaseCheckoutSessionRepository implements CheckoutSessionRepository {
  public async save(session: CheckoutSession): Promise<void> {
    const supabase = getServerSupabaseClient();
    if (!supabase) {
      throw new PersistenceError('Supabase cliente não está disponível.');
    }

    const payload = {
      order_id: session.orderId,
      stripe_session_id: session.stripeSessionId,
      amount_cents: session.amountCents,
      currency: session.currency,
      status: session.status,
      success_url: session.successUrl,
      cancel_url: session.cancelUrl,
      delivery_quote_id: session.deliveryQuoteId || null,
      created_at: session.createdAt.toISOString(),
      updated_at: session.updatedAt.toISOString(),
    };

    const { error } = await supabase
      .from('checkout_sessions')
      .upsert(payload, { onConflict: 'stripe_session_id' });

    if (error) {
      throw new PersistenceError(`Erro ao salvar CheckoutSession: ${error.message}`);
    }
  }

  public async findByOrderId(orderId: string): Promise<CheckoutSession | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'open')
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  public async findByStripeSessionId(stripeSessionId: string): Promise<CheckoutSession | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  private mapToDomain(row: Record<string, unknown>): CheckoutSession {
    return CheckoutSession.create({
      id: String(row.id),
      orderId: String(row.order_id),
      stripeSessionId: String(row.stripe_session_id),
      amountCents: Number(row.amount_cents),
      currency: String(row.currency),
      status: row.status as CheckoutSessionStatus,
      successUrl: String(row.success_url),
      cancelUrl: String(row.cancel_url),
      deliveryQuoteId: row.delivery_quote_id ? String(row.delivery_quote_id) : undefined,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
    });
  }
}
