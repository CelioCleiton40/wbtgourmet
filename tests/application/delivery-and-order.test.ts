import { describe, it, expect, beforeEach } from 'vitest';
import { QuoteDeliveryUseCase } from '@/application/deliveries/quote-delivery/quote-delivery.use-case';
import { InMemoryDeliveryQuoteRepository } from '@/infrastructure/repositories/in-memory-delivery-quote-repository';
import { FakeDeliveryGateway } from '@/shared/fakes/fake-delivery-gateway';
import { CreateOrderUseCase } from '@/application/orders/create-order/create-order.use-case';
import { InMemoryOrderRepository } from '@/infrastructure/repositories/in-memory-order-repository';
import { MenuProductRepository } from '@/infrastructure/catalog/menu-product-repository';
import { DeliveryQuote } from '@/domain/deliveries/entities/delivery-quote';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';

// ── Testes de QuoteDeliveryUseCase ──────────────────────────────────────────

describe('QuoteDeliveryUseCase — persistência de cotação', () => {
  let deliveryGateway: FakeDeliveryGateway;
  let quoteRepo: InMemoryDeliveryQuoteRepository;
  let useCase: QuoteDeliveryUseCase;

  beforeEach(() => {
    deliveryGateway = new FakeDeliveryGateway();
    quoteRepo       = new InMemoryDeliveryQuoteRepository();
    useCase         = new QuoteDeliveryUseCase(deliveryGateway, quoteRepo);
  });

  it('persiste a cotação após obter do gateway', async () => {
    const result = await useCase.execute({
      dropoffAddress: {
        street: 'Rua das Flores',
        number: '100',
        district: 'Centro',
        city: 'Mossoró',
        state: 'RN',
        postalCode: '59600-000',
      },
    });

    // Deve retornar o UUID interno (não apenas o ID do provider)
    expect(result.quoteId).toBeTruthy();
    expect(result.providerQuoteId).toBeTruthy();

    // Deve estar persistida no repositório
    const persisted = await quoteRepo.findById(result.quoteId);
    expect(persisted).not.toBeNull();
    expect(persisted!.fee.cents).toBe(1200);
  });

  it('cotação tem expiresAt no futuro', async () => {
    const result = await useCase.execute({
      dropoffAddress: {
        street: 'Av. Principal',
        number: '200',
        district: 'Bela Vista',
        city: 'Mossoró',
        state: 'RN',
        postalCode: '59607-000',
      },
    });

    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('falha quando o gateway lança erro', async () => {
    deliveryGateway.shouldFail = true;

    await expect(useCase.execute({
      dropoffAddress: {
        street: 'Rua Erro',
        number: '1',
        district: 'Centro',
        city: 'Mossoró',
        state: 'RN',
        postalCode: '59600-000',
      },
    })).rejects.toThrow();
  });
});

// ── Testes de CreateOrderUseCase com quoteId ─────────────────────────────────

describe('CreateOrderUseCase — suporte a quoteId e frete', () => {
  let orderRepo: InMemoryOrderRepository;
  let quoteRepo: InMemoryDeliveryQuoteRepository;
  let productRepo: MenuProductRepository;
  let useCase: CreateOrderUseCase;

  const validInput = {
    items: [{ id: 'fm-gorgonzola', quantity: 1 }], // Produto com ID='fm-gorgonzola' do MenuProductRepository (R$ 45,00 = 4500 centavos)
    customerPhone: '84988909408',
    idempotencyKey: '',
  };

  beforeEach(() => {
    orderRepo   = new InMemoryOrderRepository();
    quoteRepo   = new InMemoryDeliveryQuoteRepository();
    productRepo = new MenuProductRepository();
    useCase     = new CreateOrderUseCase(orderRepo, productRepo, quoteRepo);
  });

  it('sem quoteId — total = subtotal (sem frete)', async () => {
    const input = { ...validInput, idempotencyKey: crypto.randomUUID() };
    const result = await useCase.execute(input);

    expect(result.deliveryFeeCents).toBe(0);
    expect(result.totalCents).toBe(result.subtotalCents);
  });

  it('com quoteId válido — total = subtotal + frete', async () => {
    // Inserir cotação no repositório
    const quote = DeliveryQuote.create({
      providerQuoteId: `dqt_test_${Date.now()}`,
      fee: Money.fromCents(1200),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await quoteRepo.save(quote);
    const saved = await quoteRepo.findByProviderQuoteId(quote.providerQuoteId);

    const input = { ...validInput, idempotencyKey: crypto.randomUUID(), quoteId: saved!.id };
    const result = await useCase.execute(input);

    expect(result.deliveryFeeCents).toBe(1200);
    expect(result.totalCents).toBe(result.subtotalCents + 1200);
  });

  it('rejeita quoteId de cotação expirada', async () => {
    const expiredQuote = DeliveryQuote.create({
      providerQuoteId: `dqt_expired_${Date.now()}`,
      fee: Money.fromCents(1200),
      expiresAt: new Date(Date.now() - 1000), // expirada
    });
    await quoteRepo.save(expiredQuote);
    const saved = await quoteRepo.findByProviderQuoteId(expiredQuote.providerQuoteId);

    const input = { ...validInput, idempotencyKey: crypto.randomUUID(), quoteId: saved!.id };
    await expect(useCase.execute(input)).rejects.toThrow(/expirada/i);
  });

  it('rejeita quoteId de cotação já vinculada a outro pedido', async () => {
    const quote = DeliveryQuote.create({
      providerQuoteId: `dqt_linked_${Date.now()}`,
      fee: Money.fromCents(1200),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      orderId: 'outro-order-id', // já vinculada
    });
    await quoteRepo.save(quote);
    const saved = await quoteRepo.findByProviderQuoteId(quote.providerQuoteId);

    const input = { ...validInput, idempotencyKey: crypto.randomUUID(), quoteId: saved!.id };
    await expect(useCase.execute(input)).rejects.toThrow(/vinculada/i);
  });

  it('rejeita quoteId inexistente', async () => {
    const input = { ...validInput, idempotencyKey: crypto.randomUUID(), quoteId: crypto.randomUUID() };
    await expect(useCase.execute(input)).rejects.toThrow(/não encontrada/i);
  });
});

// ── Testes de DeliveryQuote — métodos de domínio ─────────────────────────────

describe('DeliveryQuote — métodos de domínio', () => {

  it('linkToOrder vincula orderId corretamente', () => {
    const quote = DeliveryQuote.create({
      providerQuoteId: 'dqt_test',
      fee: Money.fromCents(1000),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    quote.linkToOrder('order-123');
    expect(quote.orderId).toBe('order-123');
  });

  it('linkToOrder lança erro se já vinculada', () => {
    const quote = DeliveryQuote.create({
      providerQuoteId: 'dqt_test',
      fee: Money.fromCents(1000),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      orderId: 'order-123',
    });
    expect(() => quote.linkToOrder('order-456')).toThrow(/já vinculada/i);
  });

  it('markUsed altera status para used', () => {
    const quote = DeliveryQuote.create({
      providerQuoteId: 'dqt_test',
      fee: Money.fromCents(1000),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    quote.markUsed();
    expect(quote.status).toBe('used');
  });

  it('markUsed lança erro se cotação expirada', () => {
    const quote = DeliveryQuote.create({
      providerQuoteId: 'dqt_test',
      fee: Money.fromCents(1000),
      expiresAt: new Date(Date.now() - 1000), // expirada
    });
    expect(() => quote.markUsed()).toThrow(/expirada/i);
  });

  it('isExpired retorna true após expiresAt', () => {
    const quote = DeliveryQuote.create({
      providerQuoteId: 'dqt_test',
      fee: Money.fromCents(1000),
      expiresAt: new Date(Date.now() - 1),
    });
    expect(quote.isExpired).toBe(true);
  });
});


describe('Order — deliveryFee no total', () => {

  it('total = subtotal + deliveryFee', () => {
    const item = OrderItem.create({
      productId: 'p1', productName: 'Burger', unitPrice: Money.fromCents(3000), quantity: 2,
    });
    const order = Order.create({
      orderCode: OrderCode.generate(),
      idempotencyKey: crypto.randomUUID(),
      customerPhone: Phone.create('84988909408'),
      items: [item],
      deliveryFeeCents: 1500,
    });
    expect(order.subtotal.cents).toBe(6000);
    expect(order.deliveryFee.cents).toBe(1500);
    expect(order.total.cents).toBe(7500);
  });

  it('total = subtotal quando frete = 0', () => {
    const item = OrderItem.create({
      productId: 'p1', productName: 'Burger', unitPrice: Money.fromCents(3000), quantity: 1,
    });
    const order = Order.create({
      orderCode: OrderCode.generate(),
      idempotencyKey: crypto.randomUUID(),
      customerPhone: Phone.create('84988909408'),
      items: [item],
      deliveryFeeCents: 0,
    });
    expect(order.total.cents).toBe(3000);
  });

  it('lança erro se deliveryFeeCents é negativo', () => {
    const item = OrderItem.create({
      productId: 'p1', productName: 'Burger', unitPrice: Money.fromCents(3000), quantity: 1,
    });
    expect(() => Order.create({
      orderCode: OrderCode.generate(),
      idempotencyKey: crypto.randomUUID(),
      customerPhone: Phone.create('84988909408'),
      items: [item],
      deliveryFeeCents: -100,
    })).toThrow(/inteiro não-negativo/i);
  });
});
