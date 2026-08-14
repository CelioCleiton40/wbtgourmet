import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessStripeWebhookUseCase } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import {
  InMemoryOutboxRepository,
  InMemoryWebhookEventRepository,
} from '@/infrastructure/repositories/in-memory-outbox-repository';
import { FakePaymentGateway } from '@/shared/fakes/fake-payment-gateway';

describe('ProcessStripeWebhookUseCase (Outbox Pattern & Idempotency)', () => {
  let orderRepo: InMemoryOrderRepository;
  let paymentGateway: FakePaymentGateway;
  let webhookRepo: InMemoryWebhookEventRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let useCase: ProcessStripeWebhookUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    paymentGateway = new FakePaymentGateway();
    webhookRepo = new InMemoryWebhookEventRepository();
    outboxRepo = new InMemoryOutboxRepository();
    useCase = new ProcessStripeWebhookUseCase(
      paymentGateway,
      orderRepo,
      webhookRepo,
      outboxRepo
    );
  });

  it('deve processar o webhook Stripe com sucesso e registrar evento no Outbox sem chamar Uber síncrono', async () => {
    const order = Order.create({
      orderCode: OrderCode.create('WBT-999999'),
      idempotencyKey: 'idemp-999',
      customerPhone: Phone.create('84988909408'),
      items: [
        OrderItem.create({
          productId: 'fm-gorgonzola',
          productName: 'Filé Mignon',
          unitPrice: Money.fromCents(4500),
          quantity: 1,
        }),
      ],
    });
    await orderRepo.save(order);

    const rawBody = JSON.stringify({
      id: 'evt_stripe_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          amount: 4500,
          metadata: { order_code: 'WBT-999999' },
        },
      },
    });

    const result = await useCase.execute({
      rawBody,
      signature: 'valid_sig',
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(false);

    // Verificar se evento foi adicionado à fila do Outbox
    const pendingEvents = await outboxRepo.findPendingEvents();
    expect(pendingEvents.length).toBe(1);
    expect(pendingEvents[0].eventType).toBe('delivery.requested');
    expect(pendingEvents[0].aggregateId).toBe('WBT-999999');
  });

  it('deve IGNORAR chamadas duplicadas do Stripe Webhook (Idempotência de Webhook)', async () => {
    const rawBody = JSON.stringify({
      id: 'evt_duplicate_123',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', amount: 4500, metadata: { order_code: 'WBT-123456' } } },
    });

    const r1 = await useCase.execute({ rawBody, signature: 'valid_sig' });
    expect(r1.isDuplicate).toBe(false);

    const r2 = await useCase.execute({ rawBody, signature: 'valid_sig' });
    expect(r2.isDuplicate).toBe(true);
  });
});
