import { Order } from '../entities/order';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
  findByOrderCode(orderCode: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
}
