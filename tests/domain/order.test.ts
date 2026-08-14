import { describe, it, expect } from 'vitest';
import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { InvalidQuantityError } from '@/shared/errors/domain-errors';

describe('Order Aggregate Entity', () => {
  const samplePhone = Phone.create('84988909408');
  const sampleCode = OrderCode.create('WBT-123456');

  it('deve instanciar um Order válido com cálculo correto de subtotal e totalItems', () => {
    const item1 = OrderItem.create({
      productId: 'fm-gorgonzola',
      productName: 'Filé Mignon ao Molho de Gorgonzola',
      unitPrice: Money.fromCents(4500),
      quantity: 2,
    });
    const item2 = OrderItem.create({
      productId: 'rf-coca',
      productName: 'Coca-Cola Original ou Zero',
      unitPrice: Money.fromCents(700),
      quantity: 3,
    });

    const order = Order.create({
      orderCode: sampleCode,
      idempotencyKey: 'idemp-uuid-1',
      customerPhone: samplePhone,
      items: [item1, item2],
    });

    expect(order.orderCode.value).toBe('WBT-123456');
    expect(order.customerPhone.value).toBe('5584988909408');
    expect(order.items.length).toBe(2);
    expect(order.totalItems).toBe(5); // 2 + 3 = 5
    expect(order.subtotal.cents).toBe(11100); // (4500*2) + (700*3) = 9000 + 2100 = 11100
    expect(order.total.cents).toBe(11100);
    expect(order.status).toBe('pending_payment');
  });

  it('deve lançar InvalidQuantityError se a lista de itens estiver vazia', () => {
    expect(() =>
      Order.create({
        orderCode: sampleCode,
        idempotencyKey: 'idemp-uuid-2',
        customerPhone: samplePhone,
        items: [],
      })
    ).toThrow(InvalidQuantityError);
  });

  it('deve lançar InvalidQuantityError se houver mais de 50 itens distintos no pedido', () => {
    const items: OrderItem[] = [];
    for (let i = 0; i < 51; i++) {
      items.push(
        OrderItem.create({
          productId: `prod-${i}`,
          productName: `Produto ${i}`,
          unitPrice: Money.fromCents(100),
          quantity: 1,
        })
      );
    }

    expect(() =>
      Order.create({
        orderCode: sampleCode,
        idempotencyKey: 'idemp-uuid-3',
        customerPhone: samplePhone,
        items,
      })
    ).toThrow(InvalidQuantityError);
  });

  it('deve lançar erro se a idempotencyKey for ausente ou vazia', () => {
    const item = OrderItem.create({
      productId: 'fm-gorgonzola',
      productName: 'Filé Mignon',
      unitPrice: Money.fromCents(4500),
      quantity: 1,
    });

    expect(() =>
      Order.create({
        orderCode: sampleCode,
        idempotencyKey: '',
        customerPhone: samplePhone,
        items: [item],
      })
    ).toThrow('Chave de idempotência (idempotencyKey) é obrigatória.');
  });
});
