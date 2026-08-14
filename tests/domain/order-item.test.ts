import { describe, it, expect } from 'vitest';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';
import { InvalidQuantityError } from '@/shared/errors/domain-errors';

describe('OrderItem Entity', () => {
  it('deve criar um OrderItem e calcular o subtotal multiplicando o preço pela quantidade', () => {
    const item = OrderItem.create({
      productId: 'fm-gorgonzola',
      productName: 'Filé Mignon ao Molho de Gorgonzola',
      unitPrice: Money.fromCents(4500),
      quantity: 3,
    });

    expect(item.productId).toBe('fm-gorgonzola');
    expect(item.productName).toBe('Filé Mignon ao Molho de Gorgonzola');
    expect(item.unitPrice.cents).toBe(4500);
    expect(item.quantity).toBe(3);
    expect(item.subtotal.cents).toBe(13500); // 4500 * 3 = 13500
  });

  it('deve lançar InvalidQuantityError se a quantidade for menor ou igual a 0', () => {
    expect(() =>
      OrderItem.create({
        productId: 'fm-gorgonzola',
        productName: 'Filé Mignon',
        unitPrice: Money.fromCents(4500),
        quantity: 0,
      })
    ).toThrow(InvalidQuantityError);
  });

  it('deve lançar InvalidQuantityError se a quantidade for maior que 50', () => {
    expect(() =>
      OrderItem.create({
        productId: 'fm-gorgonzola',
        productName: 'Filé Mignon',
        unitPrice: Money.fromCents(4500),
        quantity: 51,
      })
    ).toThrow(InvalidQuantityError);
  });

  it('deve lançar erro se o produto não tiver ID ou nome válidos', () => {
    expect(() =>
      OrderItem.create({
        productId: '',
        productName: 'Filé Mignon',
        unitPrice: Money.fromCents(4500),
        quantity: 1,
      })
    ).toThrow('Produto deve conter ID e nome válidos.');
  });
});
