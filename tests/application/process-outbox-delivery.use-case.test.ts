import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessOutboxDeliveryUseCase } from '@/application/deliveries/process-outbox-delivery/process-outbox-delivery.use-case';
import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import { InMemoryOutboxRepository } from '@/infrastructure/repositories/in-memory-outbox-repository';
import { FakeDeliveryGateway } from '@/shared/fakes/fake-delivery-gateway';

describe('ProcessOutboxDeliveryUseCase (Worker Assíncrono)', () => {
  let outboxRepo: InMemoryOutboxRepository;
  let orderRepo: InMemoryOrderRepository;
  let deliveryGateway: FakeDeliveryGateway;
  let useCase: ProcessOutboxDeliveryUseCase;

  beforeEach(() => {
    outboxRepo = new InMemoryOutboxRepository();
    orderRepo = new InMemoryOrderRepository();
    deliveryGateway = new FakeDeliveryGateway();
    useCase = new ProcessOutboxDeliveryUseCase(
      outboxRepo,
      orderRepo,
      deliveryGateway
    );
  });

  it('deve consumir eventos da fila outbox e despachar a entrega na Uber Direct', async () => {
    const order = Order.create({
      orderCode: OrderCode.create('WBT-777777'),
      idempotencyKey: 'idemp-777',
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

    await outboxRepo.addEvent({
      aggregateId: 'WBT-777777',
      eventType: 'delivery.requested',
      payload: { orderCode: 'WBT-777777', orderId: order.id },
    });

    const count = await useCase.processPendingEvents();
    expect(count).toBe(1);

    const pending = await outboxRepo.findPendingEvents();
    expect(pending.length).toBe(0); // Evento marcado como concluído
  });
});
