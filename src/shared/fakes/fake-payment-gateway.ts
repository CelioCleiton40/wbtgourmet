import {
  CheckoutSessionResult,
  CreateCheckoutSessionParams,
  CreatePaymentIntentParams,
  PaymentGateway,
  PaymentIntentResult,
  StripeWebhookEventData,
} from '@/domain/payments/services/payment-gateway';

export class FakePaymentGateway implements PaymentGateway {
  public intents: Map<string, CreatePaymentIntentParams> = new Map();
  public sessions: Map<string, CreateCheckoutSessionParams> = new Map();
  public shouldFail = false;
  public shouldFailCheckout = false;

  public async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult> {
    if (this.shouldFail) throw new Error('Fake Payment Gateway Failure');

    const paymentIntentId = `pi_fake_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.intents.set(paymentIntentId, params);

    return {
      paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_fake`,
      amountCents: params.amount.cents,
      status: 'requires_payment_method',
    };
  }

  public async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    if (this.shouldFailCheckout) {
      throw new Error('Fake Checkout Session Failure');
    }

    const sessionId = `cs_fake_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.sessions.set(sessionId, params);

    const totalCents = params.lineItems.reduce(
      (sum, item) => sum + item.unitAmountCents * item.quantity,
      0
    );

    return {
      stripeSessionId: sessionId,
      url: `https://checkout.stripe.com/c/pay/${sessionId}`,
      amountCents: totalCents,
      currency: 'brl',
      status: 'open',
    };
  }

  public async verifyWebhookSignature(
    rawBody: string,
    signature: string
  ): Promise<StripeWebhookEventData> {
    if (signature === 'invalid_sig') {
      throw new Error('Assinatura do Webhook Stripe inválida.');
    }

    const payload = JSON.parse(rawBody);
    const type = payload.type || 'checkout.session.completed';
    const dataObj = payload.data?.object ?? {};

    if (type.startsWith('checkout.session')) {
      const metadata = dataObj.metadata ?? {};
      return {
        eventId: payload.id || `evt_fake_${Date.now()}`,
        eventType: type,
        checkoutSessionId: dataObj.id || `cs_fake_${Date.now()}`,
        orderId: metadata.order_id,
        orderCode: metadata.order_code,
        deliveryQuoteId: metadata.delivery_quote_id,
        amountCents: dataObj.amount_total,
        currency: dataObj.currency ?? 'brl',
        paymentStatus: dataObj.payment_status ?? 'paid',
      };
    }

    return {
      eventId: payload.id || `evt_fake_${Date.now()}`,
      eventType: type,
      paymentIntentId: dataObj.id || 'pi_fake_123',
      orderId: dataObj.metadata?.order_id,
      orderCode: dataObj.metadata?.order_code,
      amountCents: dataObj.amount,
    };
  }
}
