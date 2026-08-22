import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessMercadoPagoWebhookUseCase } from '@/application/payments/process-mercadopago-webhook/process-mercadopago-webhook.use-case';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import { MercadoPagoPaymentGateway } from '@/infrastructure/mercadopago/mercadopago-payment-gateway';
import { Order } from '@/domain/orders/entities/order';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';

// ── Fakes de repositório auxiliar ──────────────────────────────────────────

class FakeWebhookEventRepository {
  private processed = new Set<string>();
  async isProcessed(id: string) { return this.processed.has(id); }
  async markProcessed(id: string) { this.processed.add(id); }
}

class FakeOutboxRepository {
  public events: Array<{ aggregateId: string; eventType: string; payload: Record<string, unknown> }> = [];
  async addEvent(e: typeof this.events[0]) { this.events.push(e); }
  async findPendingEvents() { return []; }
  async markCompleted() {}
  async markFailed() {}
}

// ── Fake Mercado Pago Gateway ───────────────────────────────────────────────

class FakeMercadoPagoGateway extends MercadoPagoPaymentGateway {
  public mockPaymentDetails = {
    id: 'pay_123456',
    status: 'approved',
    statusDetail: 'accredited',
    amountCents: 4400,
    currency: 'brl',
    externalReference: 'WBT-123456',
    orderId: '',
    deliveryQuoteId: '',
  };

  public override async getPaymentDetails(paymentId: string) {
    return {
      ...this.mockPaymentDetails,
      id: paymentId,
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeOrder(status: 'pending_payment' | 'payment_confirmed' = 'pending_payment') {
  const item = OrderItem.create({
    productId: 'prod-1',
    productName: 'Combo Smash Burger',
    unitPrice: Money.fromCents(3200),
    quantity: 1,
  });
  return Order.create({
    orderCode: OrderCode.generate(),
    idempotencyKey: crypto.randomUUID(),
    customerPhone: Phone.create('84988909408'),
    items: [item],
    deliveryFeeCents: 1200,
    status,
  });
}

function makeMercadoPagoWebhookBody(paymentId: string) {
  return JSON.stringify({
    action: 'payment.updated',
    api_version: 'v1',
    data: { id: paymentId },
    date_created: '2026-08-22T10:00:00Z',
    id: `evt_${paymentId}`,
    type: 'payment',
  });
}

// ── Setup ────────────────────────────────────────────────────────────────────

let orderRepo: InMemoryOrderRepository;
let webhookRepo: FakeWebhookEventRepository;
let outboxRepo: FakeOutboxRepository;
let gateway: FakeMercadoPagoGateway;
let useCase: ProcessMercadoPagoWebhookUseCase;

beforeEach(() => {
  orderRepo = new InMemoryOrderRepository();
  webhookRepo = new FakeWebhookEventRepository();
  outboxRepo = new FakeOutboxRepository();
  gateway = new FakeMercadoPagoGateway();
  useCase = new ProcessMercadoPagoWebhookUseCase(gateway, orderRepo, webhookRepo, outboxRepo);
});

// ── Testes ───────────────────────────────────────────────────────────────────

describe('ProcessMercadoPagoWebhookUseCase', () => {
  it('confirma pedido e despacha outbox quando status === approved e total bate', async () => {
    const order = await orderRepo.save(makeOrder());
    gateway.mockPaymentDetails = {
      id: 'pay_98765',
      status: 'approved',
      statusDetail: 'accredited',
      amountCents: order.total.cents,
      currency: 'brl',
      externalReference: order.orderCode.value,
      orderId: order.id || '',
      deliveryQuoteId: '',
    };

    const rawBody = makeMercadoPagoWebhookBody('pay_98765');
    const result = await useCase.execute({ rawBody });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(false);

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('payment_confirmed');
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0].eventType).toBe('delivery.requested');
    expect(outboxRepo.events[0].payload.orderCode).toBe(order.orderCode.value);
  });

  it('NÃO confirma quando status !== approved (pending / in_process / rejected)', async () => {
    const order = await orderRepo.save(makeOrder());
    gateway.mockPaymentDetails = {
      id: 'pay_pending_1',
      status: 'in_process',
      statusDetail: 'pending_contingency',
      amountCents: order.total.cents,
      currency: 'brl',
      externalReference: order.orderCode.value,
      orderId: order.id || '',
      deliveryQuoteId: '',
    };

    const rawBody = makeMercadoPagoWebhookBody('pay_pending_1');
    await useCase.execute({ rawBody });

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('pending_payment'); // continua aguardando
    expect(outboxRepo.events).toHaveLength(0);
  });

  it('NÃO confirma quando amountCents diverge do total do pedido — incidente financeiro', async () => {
    const order = await orderRepo.save(makeOrder());
    gateway.mockPaymentDetails = {
      id: 'pay_divergent',
      status: 'approved',
      statusDetail: 'accredited',
      amountCents: order.total.cents - 500, // divergente
      currency: 'brl',
      externalReference: order.orderCode.value,
      orderId: order.id || '',
      deliveryQuoteId: '',
    };

    const rawBody = makeMercadoPagoWebhookBody('pay_divergent');
    await useCase.execute({ rawBody });

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('pending_payment');
    expect(outboxRepo.events).toHaveLength(0);
  });

  it('deduplica notificações com o mesmo eventId', async () => {
    const order = await orderRepo.save(makeOrder());
    gateway.mockPaymentDetails = {
      id: 'pay_dedup',
      status: 'approved',
      statusDetail: 'accredited',
      amountCents: order.total.cents,
      currency: 'brl',
      externalReference: order.orderCode.value,
      orderId: order.id || '',
      deliveryQuoteId: '',
    };

    const rawBody = makeMercadoPagoWebhookBody('pay_dedup');
    const r1 = await useCase.execute({ rawBody });
    const r2 = await useCase.execute({ rawBody });

    expect(r1.isDuplicate).toBe(false);
    expect(r2.isDuplicate).toBe(true);
    expect(outboxRepo.events).toHaveLength(1);
  });

  it('suporta query params legados (topic=payment&id=...)', async () => {
    const order = await orderRepo.save(makeOrder());
    gateway.mockPaymentDetails = {
      id: 'pay_query_param',
      status: 'approved',
      statusDetail: 'accredited',
      amountCents: order.total.cents,
      currency: 'brl',
      externalReference: order.orderCode.value,
      orderId: order.id || '',
      deliveryQuoteId: '',
    };

    const result = await useCase.execute({
      rawBody: '',
      queryTopic: 'payment',
      queryId: 'pay_query_param',
    });

    expect(result.success).toBe(true);
    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('payment_confirmed');
    expect(outboxRepo.events).toHaveLength(1);
  });
});
