import { NextResponse } from 'next/server';
import { z } from 'zod';
import { QuoteDeliveryUseCase } from '@/application/deliveries/quote-delivery/quote-delivery.use-case';
import { UberDirectGateway } from '@/infrastructure/uber-direct/uber-direct-gateway';
import { getDeliveryQuoteRepository } from '@/infrastructure/repositories/delivery-quote-repository-factory';
import { Logger } from '@/shared/utils/logger';
import { RateLimiter } from '@/shared/rate-limit/rate-limiter';
import { DeliveryUndeliverableError, RateLimitError } from '@/shared/errors/domain-errors';

const addressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória.'),
  number: z.string().min(1, 'Número é obrigatório.'),
  district: z.string().min(1, 'Bairro é obrigatório.'),
  city: z.string().min(1, 'Cidade é obrigatória.'),
  state: z.string().min(2, 'Estado (UF) é obrigatório.').max(2),
  postalCode: z.string().min(8, 'CEP é obrigatório.').max(10),
  complement: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const quoteSchema = z
  .object({
    dropoffAddress: addressSchema.optional(),
    address: addressSchema.optional(),
  })
  .refine((data) => Boolean(data.dropoffAddress || data.address), {
    message: 'Endereço de entrega (dropoffAddress ou address) é obrigatório.',
  });

const uberDirectGateway = new UberDirectGateway();
const quoteRateLimiter = new RateLimiter(15, 60);

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    quoteRateLimiter.check(`quote:${clientIp}`);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser application/json.' },
        { status: 400 }
      );
    }

    const bodyText = await request.text();
    const rawJson = JSON.parse(bodyText);
    const validatedData = quoteSchema.parse(rawJson);
    const dropoffAddress = (validatedData.dropoffAddress || validatedData.address)!;

    const deliveryQuoteRepository = getDeliveryQuoteRepository();
    const quoteDeliveryUseCase = new QuoteDeliveryUseCase(uberDirectGateway, deliveryQuoteRepository);
    const result = await quoteDeliveryUseCase.execute({ dropoffAddress });

    Logger.info('Cotação de entrega Uber Direct realizada', {
      requestId,
      quoteId: result.quoteId,
      feeCents: result.feeCents,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      quoteId: result.quoteId,
      feeCents: result.feeCents,
      feeFormattedBRL: result.feeFormattedBRL,
      expiresAt: result.expiresAt,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const errMessage = error instanceof Error ? error.message : 'Erro ao consultar valor da entrega Uber Direct.';

    if (error instanceof DeliveryUndeliverableError) {
      Logger.warn('Cotação recusada: endereço fora da área de entrega', { requestId, durationMs });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof RateLimitError) {
      Logger.error('Rate Limit excedido na cotação de entrega', error, { requestId, durationMs });
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Dados de endereço inválidos.' },
        { status: 400 }
      );
    }

    Logger.error('Erro ao cotar entrega Uber Direct', error instanceof Error ? error : new Error(errMessage), { requestId, durationMs });
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
