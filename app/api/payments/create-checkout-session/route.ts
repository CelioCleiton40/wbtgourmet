import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateCheckoutSessionUseCase } from '@/application/payments/create-checkout-session/create-checkout-session.use-case';
import {
  AmountMismatchError,
  DeliveryQuoteExpiredError,
  DeliveryQuoteNotFoundError,
  DeliveryQuoteOwnershipError,
  OrderNotFoundForCheckoutError,
  OrderNotInPendingPaymentError,
} from '@/application/payments/create-checkout-session/create-checkout-session.use-case';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import { getDeliveryQuoteRepository } from '@/infrastructure/repositories/delivery-quote-repository-factory';
import { getCheckoutSessionRepository } from '@/infrastructure/repositories/checkout-session-repository-factory';
import { getPaymentGateway } from '@/infrastructure/payments/payment-gateway-factory';
import { Logger } from '@/shared/utils/logger';

import { RateLimiter } from '@/shared/rate-limit/rate-limiter';
import { RateLimitError } from '@/shared/errors/domain-errors';

// Schema estrito — não aceita successUrl, cancelUrl, total, quoteId, price do cliente
const checkoutSessionSchema = z
  .object({
    orderId: z.string().min(1, 'orderId é obrigatório.').max(100),
    idempotencyKey: z.string().uuid('idempotencyKey deve ser UUID v4.').optional(),
  })
  .strict();

const checkoutRateLimiter = new RateLimiter(10, 60);

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    checkoutRateLimiter.check(`checkout:${clientIp}`);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type deve ser application/json.' }, { status: 400 });
    }

    const bodyText = await request.text();
    if (bodyText.length > 2048) {
      return NextResponse.json({ error: 'Payload excede o tamanho máximo.' }, { status: 413 });
    }

    const rawJson = JSON.parse(bodyText);
    const { orderId, idempotencyKey } = checkoutSessionSchema.parse(rawJson);

    const orderRepo = getOrderRepository();
    const deliveryQuoteRepository = getDeliveryQuoteRepository();
    const checkoutSessionRepository = getCheckoutSessionRepository();
    const paymentGateway = getPaymentGateway();

    const useCase = new CreateCheckoutSessionUseCase(
      orderRepo,
      deliveryQuoteRepository,
      checkoutSessionRepository,
      paymentGateway
    );

    const result = await useCase.execute({ orderId, idempotencyKey });

    Logger.info('Checkout Session (Mercado Pago / Stripe) criada com sucesso', {
      requestId,
      orderId,
      stripeSessionId: result.stripeSessionId,
      amountCents: result.amountCents,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      stripeSessionId: result.stripeSessionId,
      amountCents: result.amountCents,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;

    if (error instanceof RateLimitError) {
      Logger.error('Rate Limit excedido na criação de Checkout Session', error, { requestId, durationMs });
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error instanceof OrderNotFoundForCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderNotInPendingPaymentError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof DeliveryQuoteExpiredError) {
      return NextResponse.json({ error: error.message }, { status: 410 });
    }
    if (error instanceof DeliveryQuoteNotFoundError || error instanceof DeliveryQuoteOwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AmountMismatchError) {
      Logger.error('INCIDENTE FINANCEIRO na criação de Checkout Session', error as Error, { requestId, durationMs });
      return NextResponse.json({ error: 'Erro interno ao calcular o total do pedido.' }, { status: 500 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos: ' + (error.issues[0]?.message || 'Formato incorreto.') }, { status: 400 });
    }

    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    Logger.error('Erro ao criar Checkout Session', err, { requestId, durationMs });
    return NextResponse.json({ error: 'Erro interno ao iniciar pagamento.' }, { status: 500 });
  }
}
