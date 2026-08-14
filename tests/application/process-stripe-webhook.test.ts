import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessStripeWebhookUseCase } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import { FakePaymentGateway } from '@/shared/fakes/fake-payment-gateway';
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeOrder(status: 'pending_payment' | 'payment_confirmed' = 'pending_payment') {
  const item = OrderItem.create({
    productId: 'prod-1',
    productName: 'Frango Grelhado',
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

function makeSessionEvent(overrides: {
  eventType?: string;
  paymentStatus?: string;
  amountTotal?: number;
  currency?: string;
  orderCode?: string;
}) {
  const id = `evt_test_${Date.now()}`;
  return JSON.stringify({
    id,
    type: overrides.eventType ?? 'checkout.session.completed',
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        payment_status: overrides.paymentStatus ?? 'paid',
        amount_total: overrides.amountTotal ?? 4400,
        currency: overrides.currency ?? 'brl',
        metadata: {
          order_code: overrides.orderCode ?? '',
          order_id: '',
          delivery_quote_id: '',
        },
      },
    },
  });
}

// ── Setup ────────────────────────────────────────────────────────────────────

let orderRepo: InMemoryOrderRepository;
let webhookRepo: FakeWebhookEventRepository;
let outboxRepo: FakeOutboxRepository;
let gateway: FakePaymentGateway;
let useCase: ProcessStripeWebhookUseCase;

beforeEach(() => {
  orderRepo   = new InMemoryOrderRepository();
  webhookRepo = new FakeWebhookEventRepository();
  outboxRepo  = new FakeOutboxRepository();
  gateway     = new FakePaymentGateway();
  useCase     = new ProcessStripeWebhookUseCase(gateway, orderRepo, webhookRepo, outboxRepo);
});

// ── Testes ───────────────────────────────────────────────────────────────────

describe('ProcessStripeWebhookUseCase — checkout.session.completed', () => {

  it('confirma pedido quando payment_status === paid e amount bate', async () => {
    const order  = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({ paymentStatus: 'paid', amountTotal: order.total.cents, orderCode: order.orderCode.value });

    const result = await useCase.execute({ rawBody, signature: 'valid_sig' });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(false);

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('payment_confirmed');
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0].eventType).toBe('delivery.requested');
  });

  it('NÃO confirma quando payment_status !== paid (unpaid)', async () => {
    const order  = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({ paymentStatus: 'unpaid', amountTotal: order.total.cents, orderCode: order.orderCode.value });

    await useCase.execute({ rawBody, signature: 'valid_sig' });

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('pending_payment'); // não mudou
    expect(outboxRepo.events).toHaveLength(0);
  });

  it('NÃO confirma quando amount_total diverge do total do pedido — incidente financeiro', async () => {
    const order   = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({
      paymentStatus: 'paid',
      amountTotal: order.total.cents - 100, // valor manipulado
      orderCode: order.orderCode.value,
    });

    await useCase.execute({ rawBody, signature: 'valid_sig' });

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('pending_payment'); // não confirmado
    expect(outboxRepo.events).toHaveLength(0);
  });

  it('NÃO confirma quando currency !== brl', async () => {
    const order  = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({ paymentStatus: 'paid', amountTotal: order.total.cents, currency: 'usd', orderCode: order.orderCode.value });

    await useCase.execute({ rawBody, signature: 'valid_sig' });

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('pending_payment');
    expect(outboxRepo.events).toHaveLength(0);
  });

  it('deduplica — evento já processado não é reprocessado', async () => {
    const order  = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({ paymentStatus: 'paid', amountTotal: order.total.cents, orderCode: order.orderCode.value });

    const r1 = await useCase.execute({ rawBody, signature: 'valid_sig' });
    const r2 = await useCase.execute({ rawBody, signature: 'valid_sig' });

    expect(r1.isDuplicate).toBe(false);
    expect(r2.isDuplicate).toBe(true);

    // Outbox só tem 1 evento (do primeiro processamento)
    expect(outboxRepo.events).toHaveLength(1);
  });

  it('ignora se pedido já estava payment_confirmed (proteção contra duplicação tardia)', async () => {
    const order        = await orderRepo.save(makeOrder('payment_confirmed'));
    const rawBody       = makeSessionEvent({ paymentStatus: 'paid', amountTotal: order.total.cents, orderCode: order.orderCode.value });

    await useCase.execute({ rawBody, signature: 'valid_sig' });

    // Nenhum evento de outbox — pedido já confirmado
    expect(outboxRepo.events).toHaveLength(0);
  });

  it('rejeita assinatura inválida', async () => {
    const rawBody = makeSessionEvent({});
    await expect(useCase.execute({ rawBody, signature: 'invalid_sig' }))
      .rejects.toThrow('Assinatura');
  });
});

describe('ProcessStripeWebhookUseCase — checkout.session.async_payment_succeeded', () => {

  it('confirma pedido via pagamento assíncrono', async () => {
    const order  = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({
      eventType: 'checkout.session.async_payment_succeeded',
      paymentStatus: 'paid',
      amountTotal: order.total.cents,
      orderCode: order.orderCode.value,
    });

    await useCase.execute({ rawBody, signature: 'valid_sig' });

    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('payment_confirmed');
    expect(outboxRepo.events).toHaveLength(1);
  });
});

describe('ProcessStripeWebhookUseCase — checkout.session.async_payment_failed', () => {

  it('não confirma pedido quando pagamento assíncrono falha', async () => {
    const order  = await orderRepo.save(makeOrder());
    const rawBody = makeSessionEvent({
      eventType: 'checkout.session.async_payment_failed',
      orderCode: order.orderCode.value,
    });

    const result = await useCase.execute({ rawBody, signature: 'valid_sig' });

    expect(result.success).toBe(true);
    const updated = await orderRepo.findByOrderCode(order.orderCode.value);
    expect(updated?.status).toBe('pending_payment'); // permanece aguardando
    expect(outboxRepo.events).toHaveLength(0);
  });
});
