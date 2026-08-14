import { Money } from '@/domain/orders/value-objects/money';

// ─── PaymentIntent (mantido para compatibilidade com testes existentes) ─────

export interface CreatePaymentIntentParams {
  orderId: string;
  orderCode: string;
  amount: Money;
  customerPhone: string;
  idempotencyKey: string;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  status: string;
}

// ─── Checkout Session ─────────────────────────────────────────────────────────

export interface CheckoutLineItem {
  /** Nome legível exibido na página do Stripe. */
  name: string;
  /** Preço em centavos (fonte: banco de dados, nunca do frontend). */
  unitAmountCents: number;
  quantity: number;
}

export interface CreateCheckoutSessionParams {
  orderId: string;
  orderCode: string;
  /** line_items construídos exclusivamente pelo backend a partir do snapshot do pedido. */
  lineItems: CheckoutLineItem[];
  /** URLs construídas no servidor — nunca recebidas do frontend. */
  successUrl: string;
  cancelUrl: string;
  /** Metadata para correlacionar Session → Order. */
  metadata: {
    order_id: string;
    order_code: string;
    delivery_quote_id?: string;
  };
  idempotencyKey: string;
}

export interface CheckoutSessionResult {
  stripeSessionId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: string;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export interface StripeWebhookEventData {
  eventId: string;
  eventType: string;
  /** Para eventos payment_intent.* */
  paymentIntentId?: string;
  /** Para eventos checkout.session.* */
  checkoutSessionId?: string;
  /** Retirado de metadata.order_id */
  orderId?: string;
  /** Retirado de metadata.order_code */
  orderCode?: string;
  /** Retirado de metadata.delivery_quote_id */
  deliveryQuoteId?: string;
  amountCents?: number;
  currency?: string;
  /** payment_status da session: 'paid' | 'unpaid' | 'no_payment_required' */
  paymentStatus?: string;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PaymentGateway {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyWebhookSignature(rawBody: string, signature: string): Promise<StripeWebhookEventData>;
}
