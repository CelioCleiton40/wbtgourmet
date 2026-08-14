import { CheckoutSession } from '@/domain/payments/entities/checkout-session';
import { CheckoutSessionRepository } from '@/domain/payments/repositories/checkout-session-repository';

export class InMemoryCheckoutSessionRepository implements CheckoutSessionRepository {
  private sessions: Map<string, CheckoutSession> = new Map();

  public async save(session: CheckoutSession): Promise<void> {
    this.sessions.set(session.stripeSessionId, session);
  }

  public async findByOrderId(orderId: string): Promise<CheckoutSession | null> {
    for (const session of this.sessions.values()) {
      if (session.orderId === orderId) return session;
    }
    return null;
  }

  public async findByStripeSessionId(stripeSessionId: string): Promise<CheckoutSession | null> {
    return this.sessions.get(stripeSessionId) ?? null;
  }

  public clear(): void {
    this.sessions.clear();
  }
}
