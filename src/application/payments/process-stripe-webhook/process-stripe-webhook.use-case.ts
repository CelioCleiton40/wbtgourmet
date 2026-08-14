import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { PaymentGateway } from '@/domain/payments/services/payment-gateway';
import { Logger } from '@/shared/utils/logger';

export interface OutboxRepository {
  addEvent(event: { aggregateId: string; eventType: string; payload: Record<string, unknown> }): Promise<void>;
  findPendingEvents(): Promise<Array<{ id: string; aggregateId: string; eventType: string; payload: Record<string, unknown>; attempts: number }>>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
}

export interface WebhookEventRepository {
  isProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string, eventType: string): Promise<void>;
}

export interface ProcessStripeWebhookInput {
  rawBody: string;
  signature: string;
}

export interface ProcessStripeWebhookOutput {
  success: boolean;
  isDuplicate: boolean;
  eventId: string;
}

export class ProcessStripeWebhookUseCase {
  constructor(
    private readonly paymentGateway: PaymentGateway,
    private readonly orderRepository: OrderRepository,
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly outboxRepository: OutboxRepository
  ) {}

  public async execute(input: ProcessStripeWebhookInput): Promise<ProcessStripeWebhookOutput> {
    // 1. Validar assinatura usando corpo RAW (obrigatório — nunca usar request.json() antes)
    const event = await this.paymentGateway.verifyWebhookSignature(input.rawBody, input.signature);

    // 2. Deduplicação — não reprocessar eventos já tratados
    const alreadyProcessed = await this.webhookEventRepository.isProcessed(event.eventId);
    if (alreadyProcessed) {
      return { success: true, isDuplicate: true, eventId: event.eventId };
    }

    // 3. Roteamento por tipo de evento
    const { eventType } = event;

    if (
      eventType === 'checkout.session.completed' ||
      eventType === 'checkout.session.async_payment_succeeded'
    ) {
      await this.handleSessionSucceeded(event);
    } else if (eventType === 'checkout.session.async_payment_failed') {
      await this.handleSessionFailed(event);
    } else if (eventType === 'checkout.session.expired') {
      await this.handleSessionExpired(event);
    } else if (eventType === 'payment_intent.succeeded' && event.orderCode) {
      // Fallback para PaymentIntent direto (compatibilidade)
      await this.handlePaymentIntentSucceeded(event);
    }
    // Outros eventos são registrados mas não processados ativamente

    // 4. Marcar evento como processado
    await this.webhookEventRepository.markProcessed(event.eventId, event.eventType);

    return { success: true, isDuplicate: false, eventId: event.eventId };
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  private async handleSessionSucceeded(event: {
    eventType: string;
    orderCode?: string;
    orderId?: string;
    deliveryQuoteId?: string;
    amountCents?: number;
    paymentStatus?: string;
    currency?: string;
  }): Promise<void> {
    // Para checkout.session.completed: validar payment_status antes de confirmar
    if (event.eventType === 'checkout.session.completed' && event.paymentStatus !== 'paid') {
      Logger.warn('checkout.session.completed com payment_status != paid — não confirmando', {
        paymentStatus: event.paymentStatus,
        orderCode: event.orderCode,
      });
      return;
    }

    const order = event.orderCode
      ? await this.orderRepository.findByOrderCode(event.orderCode)
      : null;

    if (!order) {
      Logger.warn('Webhook Stripe: pedido não encontrado', { orderCode: event.orderCode });
      return;
    }

    // Validação financeira — invariante crítico
    if (event.amountCents !== undefined && event.amountCents !== order.total.cents) {
      Logger.error(
        'INCIDENTE FINANCEIRO: amount_total da Session diverge de order.total_cents',
        new Error('AmountMismatch'),
        {
          sessionAmount: event.amountCents,
          orderTotal: order.total.cents,
          orderCode: event.orderCode,
        }
      );
      // NÃO confirmar pagamento com valor divergente
      return;
    }

    // Validação de moeda
    if (event.currency && event.currency !== 'brl') {
      Logger.error(
        'INCIDENTE FINANCEIRO: currency da Session diverge do esperado (brl)',
        new Error('CurrencyMismatch'),
        { currency: event.currency, orderCode: event.orderCode }
      );
      return;
    }

    // Proteger contra reprocessamento de pedido já confirmado
    if (order.status !== 'pending_payment') {
      Logger.info('Pedido já estava confirmado — ignorando evento duplicado', {
        orderCode: event.orderCode,
        status: order.status,
      });
      return;
    }

    // Atualizar status do pedido
    const updatedOrder = order.cloneWithStatus('payment_confirmed');
    await this.orderRepository.save(updatedOrder);

    // Enfileirar entrega via Outbox (Transactional Outbox Pattern)
    await this.outboxRepository.addEvent({
      aggregateId: order.orderCode.value,
      eventType: 'delivery.requested',
      payload: {
        orderCode: order.orderCode.value,
        orderId: order.id ?? order.orderCode.value,
        customerPhone: order.customerPhone.value,
        deliveryQuoteId: event.deliveryQuoteId ?? order.deliveryQuoteId,
      },
    });
  }

  private async handleSessionFailed(event: {
    orderCode?: string;
    orderId?: string;
  }): Promise<void> {
    Logger.warn('Pagamento assíncrono falhou', { orderCode: event.orderCode });
    // O pedido permanece em pending_payment — cliente pode tentar novamente
    // Futuro: notificar via BotConversa
  }

  private async handleSessionExpired(event: {
    orderCode?: string;
    orderId?: string;
  }): Promise<void> {
    Logger.info('Checkout Session expirada', { orderCode: event.orderCode });
    // Política de negócio: manter pending_payment por ora
    // Futuro: mover para cancelled após timeout configurável
  }

  private async handlePaymentIntentSucceeded(event: {
    orderCode?: string;
    amountCents?: number;
    deliveryQuoteId?: string;
  }): Promise<void> {
    if (!event.orderCode) return;

    const order = await this.orderRepository.findByOrderCode(event.orderCode);
    if (!order || order.status !== 'pending_payment') return;

    const updatedOrder = order.cloneWithStatus('payment_confirmed');
    await this.orderRepository.save(updatedOrder);

    await this.outboxRepository.addEvent({
      aggregateId: order.orderCode.value,
      eventType: 'delivery.requested',
      payload: {
        orderCode: order.orderCode.value,
        orderId: order.id ?? order.orderCode.value,
        customerPhone: order.customerPhone.value,
        deliveryQuoteId: event.deliveryQuoteId ?? order.deliveryQuoteId,
      },
    });
  }
}
