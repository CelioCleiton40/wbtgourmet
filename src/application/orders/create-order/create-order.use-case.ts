import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { ProductRepository } from '@/domain/orders/repositories/product-repository';
import { DeliveryQuoteRepository } from '@/domain/deliveries/repositories/delivery-quote-repository';
import { Phone } from '@/domain/orders/value-objects/phone';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Order } from '@/domain/orders/entities/order';
import { ProductNotFoundError } from '@/shared/errors/domain-errors';
import { CreateOrderInput, CreateOrderOutput } from './create-order.types';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly deliveryQuoteRepository?: DeliveryQuoteRepository
  ) {}

  public async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 1. Verificar idempotência
    const existingOrder = await this.orderRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existingOrder) {
      return this.mapToOutput(existingOrder, true);
    }

    // 2. Normalizar e validar telefone
    const phone = Phone.create(input.customerPhone);

    // 3. Buscar produtos na fonte de verdade oficial e criar snapshots
    const orderItems: OrderItem[] = [];

    for (const itemInput of input.items) {
      const product = await this.productRepository.findById(itemInput.id);
      if (!product) {
        throw new ProductNotFoundError(itemInput.id);
      }

      const orderItem = OrderItem.create({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price, // Preço oficial em Money — nunca do frontend
        quantity: itemInput.quantity,
      });

      orderItems.push(orderItem);
    }

    // 4. Carregar cotação de entrega (se fornecida)
    let deliveryFeeCents = 0;
    let deliveryQuoteId: string | undefined;

    if (input.quoteId && this.deliveryQuoteRepository) {
      const quote = await this.deliveryQuoteRepository.findById(input.quoteId);

      if (!quote) {
        throw new Error(`Cotação de entrega "${input.quoteId}" não encontrada.`);
      }

      if (quote.isExpired) {
        throw new Error(
          'Cotação de entrega expirada. Solicite uma nova cotação antes de continuar.'
        );
      }

      if (quote.orderId) {
        // Se já vinculada a outro pedido, rejeitar (proteção contra reuso)
        throw new Error('Cotação de entrega já está vinculada a outro pedido.');
      }

      deliveryFeeCents = quote.fee.cents;
      deliveryQuoteId = quote.id;
    }

    // 5. Gerar código público do pedido e instanciar a entidade Order
    const orderCode = OrderCode.generate();

    const order = Order.create({
      orderCode,
      idempotencyKey: input.idempotencyKey,
      customerPhone: phone,
      items: orderItems,
      deliveryFeeCents,
      deliveryQuoteId,
      status: 'pending_payment',
    });

    // 6. Persistir o pedido
    const savedOrder = await this.orderRepository.save(order);

    // 7. Vincular a cotação ao pedido persistido (após ter o ID do pedido)
    if (input.quoteId && this.deliveryQuoteRepository && savedOrder.id) {
      const quote = await this.deliveryQuoteRepository.findById(input.quoteId);
      if (quote) {
        quote.linkToOrder(savedOrder.id);
        await this.deliveryQuoteRepository.save(quote);
      }
    }

    return this.mapToOutput(savedOrder, false);
  }

  private mapToOutput(order: Order, isExisting: boolean): CreateOrderOutput {
    return {
      orderId: order.id || order.orderCode.value,
      orderCode: order.orderCode.value,
      subtotalCents: order.subtotal.cents,
      deliveryFeeCents: order.deliveryFee.cents,
      totalCents: order.total.cents,
      totalItems: order.totalItems,
      customerPhone: order.customerPhone.value,
      status: order.status,
      createdAt: order.createdAt,
      isExisting,
    };
  }
}
