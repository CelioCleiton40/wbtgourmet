import { NextResponse } from 'next/server';
import { ProcessUberWebhookUseCase } from '@/application/deliveries/process-uber-webhook/process-uber-webhook.use-case';
import { getWebhookEventRepository } from '@/infrastructure/repositories/webhook-event-repository-factory';
import { UberDirectGateway } from '@/infrastructure/uber-direct/uber-direct-gateway';
import { Logger } from '@/shared/utils/logger';

const uberDirectGateway = new UberDirectGateway();

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-uber-signature') || '';

    const webhookEventRepo = getWebhookEventRepository('uber');
    const processUberWebhookUseCase = new ProcessUberWebhookUseCase(
      uberDirectGateway,
      webhookEventRepo
    );

    const result = await processUberWebhookUseCase.execute({
      rawBody,
      signature,
    });

    Logger.info('Uber Direct Webhook processado com sucesso', {
      requestId,
      eventId: result.eventId,
      isDuplicate: result.isDuplicate,
      status: result.status,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      status: result.status,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error('Falha no webhook Uber Direct.');
    Logger.error('Erro no processamento do Uber Direct Webhook', err, { requestId, durationMs });

    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
