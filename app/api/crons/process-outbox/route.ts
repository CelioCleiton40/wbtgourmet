import { NextResponse } from 'next/server';
import { ProcessOutboxDeliveryUseCase } from '@/application/deliveries/process-outbox-delivery/process-outbox-delivery.use-case';
import { getOutboxRepository } from '@/infrastructure/repositories/outbox-repository-factory';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import { UberDirectGateway } from '@/infrastructure/uber-direct/uber-direct-gateway';
import { Logger } from '@/shared/utils/logger';

const uberDirectGateway = new UberDirectGateway();

export async function GET(request: Request) {
  return handleCronJob(request);
}

export async function POST(request: Request) {
  return handleCronJob(request);
}

async function handleCronJob(request: Request): Promise<NextResponse> {
  const startTime = Date.now();
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    Logger.error(
      'CRON_SECRET não configurado nas variáveis de ambiente do servidor',
      new Error('MissingCRONSecret')
    );
    return NextResponse.json(
      { error: 'Serviço de agendamento não configurado adequadamente.' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  // Validar se o token do cron bate com a chave configurada
  if (token !== cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    Logger.warn('Tentativa não autorizada de disparo do Cron de Outbox');
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const outboxRepo = getOutboxRepository();
    const orderRepo = getOrderRepository();

    const useCase = new ProcessOutboxDeliveryUseCase(
      outboxRepo,
      orderRepo,
      uberDirectGateway
    );

    const processedCount = await useCase.processPendingEvents();

    Logger.info('Worker de Outbox executado com sucesso', {
      processedCount,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    Logger.error('Erro ao executar Worker de Outbox', err);
    return NextResponse.json({ error: 'Erro interno ao processar fila do outbox.' }, { status: 500 });
  }
}
