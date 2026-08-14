import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '@/application/orders/create-order/create-order.use-case';
import { CreateOrderInput } from '@/application/orders/create-order/create-order.types';
import { MenuProductRepository } from '@/infrastructure/catalog/menu-product-repository';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import { ProductNotFoundError } from '@/shared/errors/domain-errors';

describe('CreateOrderUseCase (TDD & Security)', () => {
  let orderRepo: InMemoryOrderRepository;
  let productRepo: MenuProductRepository;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    productRepo = new MenuProductRepository();
    useCase = new CreateOrderUseCase(orderRepo, productRepo);
  });

  it('deve criar um pedido com sucesso usando os preços oficiais', async () => {
    const input = {
      items: [
        { id: 'fm-gorgonzola', quantity: 2 }, // Preço oficial: R$ 45,00 (4500 centavos)
        { id: 'rf-coca', quantity: 1 },       // Preço oficial: R$ 7,00 (700 centavos)
      ],
      customerPhone: '84988909408',
      idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    };

    const output = await useCase.execute(input);

    expect(output.orderCode).toMatch(/^WBT-[A-F0-9]{6}$/);
    expect(output.customerPhone).toBe('5584988909408');
    expect(output.totalItems).toBe(3);
    expect(output.subtotalCents).toBe(9700); // 4500*2 + 700 = 9700
    expect(output.totalCents).toBe(9700);
    expect(output.status).toBe('pending_payment');
    expect(output.isExisting).toBe(false);
  });

  it('TESTE CRÍTICO DE SEGURANÇA: deve ignorar preço ou nome adulterado', async () => {
    // Mesmo que um invasor tente forçar um DTO com campos maliciosos via cast de tipo
    const maliciousInput = {
      items: [
        {
          id: 'fm-gorgonzola',
          quantity: 2,
          price: 0.01,
          name: 'Produto Hackeado por R$ 0,01',
        },
      ],
      customerPhone: '84988909408',
      idempotencyKey: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    } as unknown as CreateOrderInput;

    const output = await useCase.execute(maliciousInput);

    // Deve usar o preço oficial do cardápio: R$ 45,00 x 2 = R$ 90,00 (9000 centavos)
    expect(output.subtotalCents).toBe(9000);
    expect(output.totalCents).toBe(9000);
  });

  it('deve retornar o mesmo pedido em requisições duplicadas (Idempotência)', async () => {
    const input = {
      items: [{ id: 'fm-gorgonzola', quantity: 1 }],
      customerPhone: '84988909408',
      idempotencyKey: 'same-idempotency-key-uuid',
    };

    const firstResult = await useCase.execute(input);
    expect(firstResult.isExisting).toBe(false);

    const secondResult = await useCase.execute(input);
    expect(secondResult.isExisting).toBe(true);
    expect(secondResult.orderCode).toBe(firstResult.orderCode);
    expect(secondResult.totalCents).toBe(firstResult.totalCents);
  });

  it('deve lançar ProductNotFoundError se o produto não existir no cardápio', async () => {
    const input = {
      items: [{ id: 'produto-inexistente-123', quantity: 1 }],
      customerPhone: '84988909408',
      idempotencyKey: 'uuid-123456',
    };

    await expect(useCase.execute(input)).rejects.toThrow(ProductNotFoundError);
  });
});
