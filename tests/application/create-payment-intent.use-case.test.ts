import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePaymentIntentUseCase } from '@/application/payments/create-payment-intent/create-payment-intent.use-case';
import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import { FakePaymentGateway } from '@/shared/fakes/fake-payment-gateway';

describe('CreatePaymentIntentUseCase (TDD com Fake)', () => {
  let orderRepo: InMemoryOrderRepository;
  let paymentGateway: FakePaymentGateway;
  let useCase: CreatePaymentIntentUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    paymentGateway = new FakePaymentGateway();
    useCase = new CreatePaymentIntentUseCase(orderRepo, paymentGateway);
  });

  it('deve gerar PaymentIntent no Stripe com valor idêntico ao total_cents do pedido', async () => {
    const order = Order.create({
      orderCode: OrderCode.create('WBT-8F42A1'),
      idempotencyKey: 'idemp-123',
      customerPhone: Phone.create('84988909408'),
      items: [
        OrderItem.create({
          productId: 'fm-gorgonzola',
          productName: 'Filé Mignon',
          unitPrice: Money.fromCents(4500),
          quantity: 2,
        }),
      ],
    });

    await orderRepo.save(order);

    const result = await useCase.execute({ orderId: 'WBT-8F42A1' });

    expect(result.paymentIntentId).toMatch(/^pi_fake_/);
    expect(result.amountCents).toBe(9000); // 4500 * 2 = 9000
    expect(result.clientSecret).toBeDefined();

    // Validar idempotência do Stripe
    const intentParams = paymentGateway.intents.get(result.paymentIntentId);
    expect(intentParams?.idempotencyKey).toBe('WBT-8F42A1:payment');
  });
});
