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
import { InMemoryDeliveryQuoteRepository } from '@/infrastructure/repositories/in-memory-delivery-quote-repository';
import { InMemoryCheckoutSessionRepository } from '@/infrastructure/repositories/in-memory-checkout-session-repository';
import { StripePaymentGateway } from '@/infrastructure/stripe/stripe-payment-gateway';
import { Logger } from '@/shared/utils/logger';

// Schema estrito — não aceita successUrl, cancelUrl, total, quoteId, price do cliente
const checkoutSessionSchema = z
  .object({
    orderId: z.string().min(1, 'orderId é obrigatório.').max(100),
    idempotencyKey: z.string().uuid('idempotencyKey deve ser UUID v4.').optional(),
  })
  .strict();

const stripePaymentGateway = new StripePaymentGateway();
// Repositórios em memória (substituir por Supabase em produção via fábrica)
const deliveryQuoteRepository = new InMemoryDeliveryQuoteRepository();
const checkoutSessionRepository = new InMemoryCheckoutSessionRepository();

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
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
    const useCase = new CreateCheckoutSessionUseCase(
      orderRepo,
      deliveryQuoteRepository,
      checkoutSessionRepository,
      stripePaymentGateway
    );

    const result = await useCase.execute({ orderId, idempotencyKey });

    Logger.info('Stripe Checkout Session criada com sucesso', {
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
