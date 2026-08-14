import { CheckoutSession } from '../entities/checkout-session';

export interface CheckoutSessionRepository {
  /** Persiste ou atualiza uma Checkout Session. */
  save(session: CheckoutSession): Promise<void>;

  /** Busca a session ativa de um pedido (para idempotência). */
  findByOrderId(orderId: string): Promise<CheckoutSession | null>;

  /** Busca pelo ID de session do Stripe (cs_...) — usado no webhook e na página de sucesso. */
  findByStripeSessionId(stripeSessionId: string): Promise<CheckoutSession | null>;
}
