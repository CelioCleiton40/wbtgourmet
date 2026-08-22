import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { MercadoPagoPaymentGateway } from '@/infrastructure/mercadopago/mercadopago-payment-gateway';
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

export interface ProcessMercadoPagoWebhookInput {
  rawBody: string;
  signature?: string;
  queryTopic?: string;
  queryId?: string;
}

export interface ProcessMercadoPagoWebhookOutput {
  success: boolean;
  isDuplicate: boolean;
  eventId: string;
}

export class ProcessMercadoPagoWebhookUseCase {
  constructor(
    private readonly paymentGateway: MercadoPagoPaymentGateway,
    private readonly orderRepository: OrderRepository,
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly outboxRepository: OutboxRepository
  ) {}

  public async execute(input: ProcessMercadoPagoWebhookInput): Promise<ProcessMercadoPagoWebhookOutput> {
    // 1. Extrair ID do pagamento (pelo corpo JSON ou query params do webhook)
    let payload: Record<string, unknown> = {};
    try {
      if (input.rawBody) {
        payload = JSON.parse(input.rawBody);
      }
    } catch {
      payload = {};
    }

    const dataObj = (payload.data as Record<string, unknown>) || {};
    const paymentId = String(
      dataObj.id || payload.id || input.queryId || ''
    );

    const eventType = String(
      payload.type || payload.topic || input.queryTopic || 'payment'
    );

    const eventId = String(payload.id || paymentId || `mp_evt_${Date.now()}`);

    // Se não for evento de pagamento (ex: merchant_order simples), registramos e retornamos sucesso
    if (!paymentId || (eventType !== 'payment' && eventType !== 'payment.created' && eventType !== 'payment.updated')) {
      return { success: true, isDuplicate: false, eventId };
    }

    // 2. Deduplicação — não reprocessar eventos já tratados
    const alreadyProcessed = await this.webhookEventRepository.isProcessed(eventId);
    if (alreadyProcessed) {
      return { success: true, isDuplicate: true, eventId };
    }

    // 3. Consultar detalhes oficiais do pagamento diretamente na API do Mercado Pago
    let paymentDetails;
    try {
      paymentDetails = await this.paymentGateway.getPaymentDetails(paymentId);
    } catch (err: unknown) {
      Logger.error('Erro ao consultar detalhes do pagamento no Mercado Pago', err as Error, {
        paymentId,
      });
      throw err;
    }

    // Se o pagamento for aprovado ('approved')
    if (paymentDetails.status === 'approved') {
      await this.handlePaymentApproved(paymentDetails);
    } else {
      Logger.info('Notificação de pagamento Mercado Pago com status não aprovado', {
        paymentId,
        status: paymentDetails.status,
        externalReference: paymentDetails.externalReference,
      });
    }

    // 4. Marcar evento como processado
    await this.webhookEventRepository.markProcessed(eventId, `mercadopago.${eventType}.${paymentDetails.status}`);

    return { success: true, isDuplicate: false, eventId };
  }

  private async handlePaymentApproved(payment: {
    id: string;
    amountCents: number;
    currency: string;
    externalReference?: string;
    orderId?: string;
    deliveryQuoteId?: string;
  }): Promise<void> {
    const orderIdentifier = payment.externalReference || payment.orderId;
    if (!orderIdentifier) {
      Logger.warn('Mercado Pago Webhook: pagamento sem externalReference/orderId', {
        paymentId: payment.id,
      });
      return;
    }

    const order = (await this.orderRepository.findByOrderCode(orderIdentifier))
      ?? (await this.orderRepository.findById(orderIdentifier));

    if (!order) {
      Logger.warn('Mercado Pago Webhook: pedido não encontrado no banco de dados', {
        orderIdentifier,
        paymentId: payment.id,
      });
      return;
    }

    // Validação financeira — invariante crítico de centavos
    if (payment.amountCents !== order.total.cents) {
      Logger.error(
        'INCIDENTE FINANCEIRO: valor aprovado no Mercado Pago diverge de order.total_cents',
        new Error('AmountMismatch'),
        {
          paymentAmount: payment.amountCents,
          orderTotal: order.total.cents,
          orderCode: order.orderCode.value,
        }
      );
      return;
    }

    // Proteger contra reprocessamento de pedido já confirmado
    if (order.status !== 'pending_payment') {
      Logger.info('Pedido já estava confirmado — ignorando webhook duplicado', {
        orderCode: order.orderCode.value,
        status: order.status,
      });
      return;
    }

    // Atualizar status do pedido para payment_confirmed
    const updatedOrder = order.cloneWithStatus('payment_confirmed');
    await this.orderRepository.save(updatedOrder);

    Logger.info('Pagamento Mercado Pago aprovado com sucesso!', {
      orderCode: order.orderCode.value,
      paymentId: payment.id,
      totalCents: order.total.cents,
    });

    // Enfileirar entrega via Outbox (Transactional Outbox Pattern) para acionamento do Uber Direct
    await this.outboxRepository.addEvent({
      aggregateId: order.orderCode.value,
      eventType: 'delivery.requested',
      payload: {
        orderCode: order.orderCode.value,
        orderId: order.id ?? order.orderCode.value,
        customerPhone: order.customerPhone.value,
        deliveryQuoteId: payment.deliveryQuoteId ?? order.deliveryQuoteId,
      },
    });
  }
}
