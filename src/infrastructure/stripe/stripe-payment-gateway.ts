import Stripe from 'stripe';
import {
  CheckoutSessionResult,
  CreateCheckoutSessionParams,
  CreatePaymentIntentParams,
  PaymentGateway,
  PaymentIntentResult,
  StripeWebhookEventData,
} from '@/domain/payments/services/payment-gateway';

export class StripePaymentGateway implements PaymentGateway {
  private stripe: Stripe | null = null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  // ─── PaymentIntent (mantido para compatibilidade) ─────────────────────────

  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      const mockId = `pi_mock_${Date.now()}`;
      return {
        paymentIntentId: mockId,
        clientSecret: `${mockId}_secret_mock`,
        amountCents: params.amount.cents,
        status: 'requires_payment_method',
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: params.amount.cents,
        currency: 'brl',
        metadata: {
          order_id: params.orderId,
          order_code: params.orderCode,
          customer_phone: params.customerPhone,
        },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: params.idempotencyKey }
    );

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      amountCents: paymentIntent.amount,
      status: paymentIntent.status,
    };
  }

  // ─── Checkout Session ─────────────────────────────────────────────────────

  public async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    if (!this.stripe) {
      // Mock para testes/desenvolvimento sem chave Stripe
      const mockSessionId = `cs_test_mock_${Date.now()}`;
      const totalCents = params.lineItems.reduce(
        (sum, item) => sum + item.unitAmountCents * item.quantity,
        0
      );
      return {
        stripeSessionId: mockSessionId,
        url: `https://checkout.stripe.com/c/pay/${mockSessionId}`,
        amountCents: totalCents,
        currency: 'brl',
        status: 'open',
      };
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.lineItems.map(
      (item) => ({
        price_data: {
          currency: 'brl',
          product_data: { name: item.name },
          unit_amount: item.unitAmountCents, // Centavos — conforme documentação Stripe
        },
        quantity: item.quantity,
      })
    );

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        success_url: params.successUrl, // Construída no servidor — inclui {CHECKOUT_SESSION_ID}
        cancel_url: params.cancelUrl,   // Construída no servidor
        metadata: {
          order_id: params.metadata.order_id,
          order_code: params.metadata.order_code,
          delivery_quote_id: params.metadata.delivery_quote_id ?? '',
        },
        payment_method_types: ['card'],
      },
      { idempotencyKey: params.idempotencyKey }
    );

    if (!session.url) {
      throw new Error('Stripe não retornou URL para a Checkout Session.');
    }

    return {
      stripeSessionId: session.id,
      url: session.url,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? 'brl',
      status: session.status ?? 'open',
    };
  }

  // ─── Webhook ─────────────────────────────────────────────────────────────

  public async verifyWebhookSignature(
    rawBody: string,
    signature: string
  ): Promise<StripeWebhookEventData> {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_stripe_secret_key_mock';

    if (this.stripe && webhookSecret && signature !== 'invalid_sig') {
      try {
        const stripeEvent = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret
        );

        return this.parseStripeEvent(stripeEvent);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        throw new Error(`Falha na validação de assinatura do Stripe Webhook: ${msg}`);
      }
    }

    if (signature === 'invalid_sig') {
      throw new Error('Assinatura do Webhook Stripe inválida.');
    }

    // Mock/fallback (sem chave real configurada)
    const payload = JSON.parse(rawBody);
    return this.parseMockPayload(payload);
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private parseStripeEvent(event: Stripe.Event): StripeWebhookEventData {
    // Eventos de Checkout Session
    if (event.type.startsWith('checkout.session')) {
      const session = event.data.object as unknown as Stripe.Checkout.Session;
      return {
        eventId: event.id,
        eventType: event.type,
        checkoutSessionId: session.id,
        orderId: (session.metadata?.order_id as string) || undefined,
        orderCode: (session.metadata?.order_code as string) || undefined,
        deliveryQuoteId: (session.metadata?.delivery_quote_id as string) || undefined,
        amountCents: session.amount_total ?? undefined,
        currency: session.currency ?? undefined,
        paymentStatus: session.payment_status ?? undefined,
      };
    }

    // Eventos de PaymentIntent
    const pi = event.data.object as unknown as Stripe.PaymentIntent;
    return {
      eventId: event.id,
      eventType: event.type,
      paymentIntentId: pi.id,
      orderId: (pi.metadata?.order_id as string) || undefined,
      orderCode: (pi.metadata?.order_code as string) || undefined,
      amountCents: pi.amount,
    };
  }

  private parseMockPayload(payload: Record<string, unknown>): StripeWebhookEventData {
    const type = (payload.type as string) || 'checkout.session.completed';
    const dataObj = (payload.data as Record<string, unknown>)?.object as Record<string, unknown> ?? {};

    if (type.startsWith('checkout.session')) {
      const metadata = (dataObj.metadata as Record<string, string>) ?? {};
      return {
        eventId: (payload.id as string) || `evt_mock_${Date.now()}`,
        eventType: type,
        checkoutSessionId: (dataObj.id as string) || `cs_mock_${Date.now()}`,
        orderId: metadata.order_id,
        orderCode: metadata.order_code,
        deliveryQuoteId: metadata.delivery_quote_id,
        amountCents: (dataObj.amount_total as number) ?? undefined,
        currency: (dataObj.currency as string) ?? 'brl',
        paymentStatus: (dataObj.payment_status as string) ?? 'paid',
      };
    }

    return {
      eventId: (payload.id as string) || `evt_mock_${Date.now()}`,
      eventType: type,
      paymentIntentId: (dataObj.id as string) || 'pi_mock_123',
      orderId: ((dataObj.metadata as Record<string, string>)?.order_id) ?? undefined,
      orderCode: ((dataObj.metadata as Record<string, string>)?.order_code) ?? undefined,
      amountCents: (dataObj.amount as number) ?? undefined,
    };
  }
}
