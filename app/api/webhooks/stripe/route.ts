import { NextResponse } from 'next/server';
import { ProcessOutboxDeliveryUseCase } from '@/application/deliveries/process-outbox-delivery/process-outbox-delivery.use-case';
import { ProcessStripeWebhookUseCase } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import {
  InMemoryOutboxRepository,
  InMemoryWebhookEventRepository,
} from '@/infrastructure/repositories/in-memory-outbox-repository';
import { StripePaymentGateway } from '@/infrastructure/stripe/stripe-payment-gateway';
import { UberDirectGateway } from '@/infrastructure/uber-direct/uber-direct-gateway';
import { Logger } from '@/shared/utils/logger';

const stripePaymentGateway = new StripePaymentGateway();
const uberDirectGateway = new UberDirectGateway();
const outboxRepo = new InMemoryOutboxRepository();
const webhookEventRepo = new InMemoryWebhookEventRepository();

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // 1. Ler o corpo RAW da requisição para validação de assinatura (Requirement #6)
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const orderRepo = getOrderRepository();

    const processWebhookUseCase = new ProcessStripeWebhookUseCase(
      stripePaymentGateway,
      orderRepo,
      webhookEventRepo,
      outboxRepo
    );

    const result = await processWebhookUseCase.execute({
      rawBody,
      signature,
    });

    // Disparar o Outbox Worker de forma assíncrona desacoplada do webhook (Requirement #1)
    const outboxWorker = new ProcessOutboxDeliveryUseCase(
      outboxRepo,
      orderRepo,
      uberDirectGateway
    );

    outboxWorker.processPendingEvents().catch((err) => {
      Logger.error('Erro no processamento em segundo plano do Outbox Worker', err, { requestId });
    });

    Logger.info('Stripe Webhook processado com sucesso', {
      requestId,
      eventId: result.eventId,
      isDuplicate: result.isDuplicate,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ received: true, eventId: result.eventId });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error('Falha na validação do webhook Stripe.');
    Logger.error('Erro na validação do Stripe Webhook', err, { requestId, durationMs });

    // Em caso de falha de assinatura, retornar 400
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
