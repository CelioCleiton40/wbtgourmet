import { NextResponse } from 'next/server';
import { GetOrderStatusUseCase } from '@/application/orders/get-order-status/get-order-status.use-case';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import { getCheckoutSessionRepository } from '@/infrastructure/repositories/checkout-session-repository-factory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'session_id inválido ou ausente.' },
        { status: 400 }
      );
    }

    const orderRepo = getOrderRepository();
    const checkoutSessionRepository = getCheckoutSessionRepository();
    const useCase = new GetOrderStatusUseCase(orderRepo, checkoutSessionRepository);
    const result = await useCase.execute({ stripeSessionId: sessionId });

    return NextResponse.json({
      orderCode: result.orderCode,
      status: result.status,
      totalCents: result.totalCents,
      deliveryFeeCents: result.deliveryFeeCents,
      trackingUrl: result.trackingUrl ?? null,
      deliveryStatus: result.deliveryStatus ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno.';
    if (message.includes('não encontrada') || message.includes('não encontrado')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao consultar status do pedido.' }, { status: 500 });
  }
}
