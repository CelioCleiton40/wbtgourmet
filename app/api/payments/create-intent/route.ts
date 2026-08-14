import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CreatePaymentIntentUseCase } from '@/application/payments/create-payment-intent/create-payment-intent.use-case';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import { StripePaymentGateway } from '@/infrastructure/stripe/stripe-payment-gateway';
import { ProductNotFoundError } from '@/shared/errors/domain-errors';
import { Logger } from '@/shared/utils/logger';

const intentSchema = z
  .object({
    orderId: z.string().min(1, 'ID do pedido é obrigatório.'),
  })
  .strict();

const stripePaymentGateway = new StripePaymentGateway();

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser application/json.' },
        { status: 400 }
      );
    }

    const bodyText = await request.text();
    const rawJson = JSON.parse(bodyText);
    const validatedData = intentSchema.parse(rawJson);

    const orderRepo = getOrderRepository();
    const useCase = new CreatePaymentIntentUseCase(orderRepo, stripePaymentGateway);
    const result = await useCase.execute(validatedData);

    Logger.info('Stripe PaymentIntent gerado com sucesso', {
      requestId,
      orderId: validatedData.orderId,
      paymentIntentId: result.paymentIntentId,
      amountCents: result.amountCents,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      amountCents: result.amountCents,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;

    if (error instanceof ProductNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID do pedido inválido.' }, { status: 400 });
    }

    const err = error instanceof Error ? error : new Error('Erro ao inicializar o pagamento no Stripe.');
    Logger.error('Erro ao gerar Stripe PaymentIntent', err, { requestId, durationMs });
    return NextResponse.json(
      { error: 'Erro ao inicializar o pagamento no Stripe.' },
      { status: 500 }
    );
  }
}
