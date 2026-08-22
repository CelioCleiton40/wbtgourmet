import { NextResponse } from 'next/server';
import { ProcessMercadoPagoWebhookUseCase } from '@/application/payments/process-mercadopago-webhook/process-mercadopago-webhook.use-case';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import { getWebhookEventRepository } from '@/infrastructure/repositories/webhook-event-repository-factory';
import { getOutboxRepository } from '@/infrastructure/repositories/outbox-repository-factory';
import { MercadoPagoPaymentGateway } from '@/infrastructure/mercadopago/mercadopago-payment-gateway';
import { Logger } from '@/shared/utils/logger';

const paymentGateway = new MercadoPagoPaymentGateway();

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const url = new URL(request.url);
    const queryTopic = url.searchParams.get('topic') || url.searchParams.get('type') || undefined;
    const queryId = url.searchParams.get('id') || url.searchParams.get('data.id') || undefined;

    const signature = request.headers.get('x-signature') || '';
    const rawBody = await request.text();

    const orderRepository = getOrderRepository();
    const webhookEventRepository = getWebhookEventRepository();
    const outboxRepository = getOutboxRepository();

    const useCase = new ProcessMercadoPagoWebhookUseCase(
      paymentGateway,
      orderRepository,
      webhookEventRepository,
      outboxRepository
    );

    const result = await useCase.execute({
      rawBody,
      signature,
      queryTopic,
      queryId,
    });

    Logger.info('Webhook Mercado Pago processado com sucesso', {
      requestId,
      eventId: result.eventId,
      isDuplicate: result.isDuplicate,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    Logger.error('Erro ao processar Webhook Mercado Pago', err, { requestId, durationMs });

    // Retorna 200 para o Mercado Pago não travar a fila caso seja erro de parse/desconhecido,
    // a menos que queiramos retry explícito.
    return NextResponse.json({ error: err.message }, { status: 200 });
  }
}
