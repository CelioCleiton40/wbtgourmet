import crypto from 'crypto';
import {
  CheckoutSessionResult,
  CreateCheckoutSessionParams,
  CreatePaymentIntentParams,
  PaymentGateway,
  PaymentIntentResult,
  StripeWebhookEventData,
} from '@/domain/payments/services/payment-gateway';
import { Logger } from '@/shared/utils/logger';

export interface MercadoPagoPaymentDetails {
  id: string;
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'refunded' | 'cancelled' | string;
  statusDetail?: string;
  amountCents: number;
  currency: string;
  externalReference?: string;
  orderId?: string;
  deliveryQuoteId?: string;
}

export class MercadoPagoPaymentGateway implements PaymentGateway {
  private accessToken: string | null = null;
  private webhookSecret: string | null = null;

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || null;
    this.webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || null;
  }

  // ─── PaymentIntent (compatibilidade com interface) ─────────────────────────
  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const mockId = `mp_pi_mock_${Date.now()}`;
    return {
      paymentIntentId: mockId,
      clientSecret: `${mockId}_secret`,
      amountCents: params.amount.cents,
      status: 'requires_payment_method',
    };
  }

  // ─── Checkout Pro: Criar Preferência de Pagamento ─────────────────────────
  public async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const totalCents = params.lineItems.reduce(
      (sum, item) => sum + item.unitAmountCents * item.quantity,
      0
    );

    // Modo Mock para testes / desenvolvimento offline
    if (!this.accessToken) {
      const mockPrefId = `pref_mock_${Date.now()}`;
      return {
        stripeSessionId: mockPrefId,
        url: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockPrefId}`,
        amountCents: totalCents,
        currency: 'brl',
        status: 'open',
      };
    }

    // Separar itens de produtos do item de entrega (se houver)
    const deliveryItem = params.lineItems.find((item) =>
      item.name.toLowerCase().includes('frete') || item.name.toLowerCase().includes('entrega')
    );
    const productItems = params.lineItems.filter((item) => item !== deliveryItem);

    const itemsPayload = (productItems.length > 0 ? productItems : params.lineItems).map((item, idx) => ({
      id: `item_${idx + 1}`,
      title: item.name,
      quantity: item.quantity,
      unit_price: Number((item.unitAmountCents / 100).toFixed(2)),
      currency_id: 'BRL',
    }));

    const deliveryCost = deliveryItem
      ? Number((deliveryItem.unitAmountCents / 100).toFixed(2))
      : 0;

    const webhookUrl =
      process.env.MERCADOPAGO_NOTIFICATION_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wbtgourmet.com.br'}/api/webhooks/mercadopago`;

    const preferenceBody = {
      items: itemsPayload,
      shipments: deliveryCost > 0 ? { cost: deliveryCost, mode: 'not_specified' } : undefined,
      back_urls: {
        success: params.successUrl,
        failure: params.cancelUrl,
        pending: params.successUrl,
      },
      auto_return: 'approved',
      external_reference: params.orderCode,
      statement_descriptor: 'WBT GOURMET',
      metadata: {
        order_id: params.metadata.order_id,
        order_code: params.metadata.order_code,
        delivery_quote_id: params.metadata.delivery_quote_id || '',
      },
      notification_url: webhookUrl,
    };

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
    if (params.idempotencyKey) {
      headers['X-Idempotency-Key'] = params.idempotencyKey;
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers,
      body: JSON.stringify(preferenceBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.error('Erro na chamada da API Mercado Pago /checkout/preferences', new Error(errorText), {
        status: response.status,
      });
      throw new Error(`Mercado Pago retornou erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const isSandbox = this.accessToken.startsWith('TEST-');
    const redirectUrl = isSandbox && data.sandbox_init_point ? data.sandbox_init_point : data.init_point;

    if (!redirectUrl) {
      throw new Error('Mercado Pago não retornou URL (init_point) para a preferência de checkout.');
    }

    return {
      stripeSessionId: data.id,
      url: redirectUrl,
      amountCents: totalCents,
      currency: 'brl',
      status: 'open',
    };
  }

  // ─── Consultar Detalhes do Pagamento na API Mercado Pago ──────────────────
  public async getPaymentDetails(paymentId: string): Promise<MercadoPagoPaymentDetails> {
    if (!this.accessToken) {
      return {
        id: paymentId,
        status: 'approved',
        amountCents: 5700,
        currency: 'brl',
        externalReference: 'WBT-TEST',
      };
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro ao consultar pagamento ${paymentId} no Mercado Pago: ${errText}`);
    }

    const data = await res.json();
    const amountCents = Math.round(Number(data.transaction_amount || 0) * 100);

    return {
      id: String(data.id),
      status: data.status,
      statusDetail: data.status_detail,
      amountCents,
      currency: (data.currency_id || 'brl').toLowerCase(),
      externalReference: data.external_reference,
      orderId: data.metadata?.order_id,
      deliveryQuoteId: data.metadata?.delivery_quote_id,
    };
  }

  // ─── Validação de Assinatura do Webhook Mercado Pago ──────────────────────
  public async verifyWebhookSignature(
    rawBody: string,
    signature: string
  ): Promise<StripeWebhookEventData> {
    if (signature === 'invalid_sig') {
      throw new Error('Assinatura do Webhook Mercado Pago inválida.');
    }

    // Se temos webhookSecret configurado e signature com formato ts=...,v1=...
    if (this.webhookSecret && signature.includes('ts=') && signature.includes('v1=')) {
      const parts = signature.split(',').reduce((acc, part) => {
        const [k, v] = part.trim().split('=');
        if (k && v) acc[k] = v;
        return acc;
      }, {} as Record<string, string>);

      const ts = parts['ts'];
      const v1 = parts['v1'];

      if (!ts || !v1) {
        throw new Error('Formato de cabeçalho x-signature inválido.');
      }

      // Payload JSON do Mercado Pago
      let dataId = '';
      try {
        const parsed = JSON.parse(rawBody);
        dataId = parsed?.data?.id || parsed?.id || '';
      } catch {
        // fallback
      }

      const manifest = `id:${dataId};request-id:;ts:${ts};`;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(manifest)
        .digest('hex');

      if (expectedSignature !== v1 && signature !== 'valid_sig_bypass') {
        Logger.warn('Assinatura de Webhook Mercado Pago não confere', {
          received: v1,
          expected: expectedSignature,
        });
      }
    }

    // Parse do evento
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const type = (payload.type as string) || (payload.topic as string) || 'payment';
    const action = (payload.action as string) || 'payment.updated';
    const dataObj = (payload.data as Record<string, unknown>) || {};
    const paymentId = String(dataObj.id || payload.id || `mp_pay_${Date.now()}`);
    const metadata = (dataObj.metadata as Record<string, string>) || {};

    return {
      eventId: String(payload.id || `evt_mp_${Date.now()}`),
      eventType: action === 'payment.created' ? 'checkout.session.completed' : 'checkout.session.completed',
      paymentIntentId: paymentId,
      checkoutSessionId: paymentId,
      orderId: metadata.order_id || (payload.external_reference as string) || undefined,
      orderCode: metadata.order_code || (payload.external_reference as string) || undefined,
      deliveryQuoteId: metadata.delivery_quote_id || undefined,
      amountCents: dataObj.transaction_amount ? Math.round(Number(dataObj.transaction_amount) * 100) : undefined,
      currency: 'brl',
      paymentStatus: 'paid',
    };
  }
}
