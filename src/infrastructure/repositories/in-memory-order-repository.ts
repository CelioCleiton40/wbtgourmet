import { Order } from '@/domain/orders/entities/order';
import { OrderRepository } from '@/domain/orders/repositories/order-repository';

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  private idempotencyIndex: Map<string, Order> = new Map();
  private codeIndex: Map<string, Order> = new Map();

  public async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    return this.idempotencyIndex.get(idempotencyKey) ?? null;
  }

  public async findByOrderCode(orderCode: string): Promise<Order | null> {
    return this.codeIndex.get(orderCode.toUpperCase()) ?? null;
  }

  public async save(order: Order): Promise<Order> {
    const id = order.id || `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const savedOrder = Order.create({
      id,
      orderCode: order.orderCode,
      idempotencyKey: order.idempotencyKey,
      customerPhone: order.customerPhone,
      items: order.items,
      deliveryFeeCents: order.deliveryFee.cents,
      deliveryQuoteId: order.deliveryQuoteId,
      status: order.status,
      createdAt: order.createdAt,
      rawMessage: order.rawMessage,
    });

    this.orders.set(id, savedOrder);
    this.idempotencyIndex.set(order.idempotencyKey, savedOrder);
    this.codeIndex.set(order.orderCode.value, savedOrder);

    return savedOrder;
  }

  public clear(): void {
    this.orders.clear();
    this.idempotencyIndex.clear();
    this.codeIndex.clear();
  }
}
