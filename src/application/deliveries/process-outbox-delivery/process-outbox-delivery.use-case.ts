import { DeliveryGateway } from '@/domain/deliveries/services/delivery-gateway';
import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { Address } from '@/domain/orders/value-objects/address';
import { OutboxRepository } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';

export class ProcessOutboxDeliveryUseCase {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly orderRepository: OrderRepository,
    private readonly deliveryGateway: DeliveryGateway
  ) {}

  public async processPendingEvents(): Promise<number> {
    const events = await this.outboxRepository.findPendingEvents();
    let processedCount = 0;

    for (const event of events) {
      if (event.eventType === 'delivery.requested') {
        try {
          const orderCode = String(event.payload.orderCode);
          const order = await this.orderRepository.findByOrderCode(orderCode);

          if (!order) {
            await this.outboxRepository.markFailed(event.id, 'Pedido não encontrado');
            continue;
          }

          const pickupAddress = Address.create({
            street: process.env.RESTAURANT_STREET || 'Avenida João da Escóssia',
            number: process.env.RESTAURANT_NUMBER || '1500',
            district: process.env.RESTAURANT_DISTRICT || 'Nova Betânia',
            city: process.env.RESTAURANT_CITY || 'Mossoró',
            state: process.env.RESTAURANT_STATE || 'RN',
            postalCode: process.env.RESTAURANT_POSTAL_CODE || '59607000',
          });

          // Se o pedido não possuir endereço de entrega, usar o padrão da cidade
          const dropoffAddress = Address.create({
            street: 'Rua Principal',
            number: '100',
            district: 'Centro',
            city: 'Mossoró',
            state: 'RN',
            postalCode: '59600000',
          });

          const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');

          await this.deliveryGateway.createDelivery({
            orderId: order.id || order.orderCode.value,
            orderCode: order.orderCode.value,
            quoteId: `quote-${order.orderCode.value}`,
            customerPhone: order.customerPhone.value,
            pickupAddress,
            dropoffAddress,
            itemsSummary,
          });

          await this.outboxRepository.markCompleted(event.id);
          processedCount++;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Falha ao despachar na Uber';
          await this.outboxRepository.markFailed(event.id, errMsg);
        }
      }
    }

    return processedCount;
  }
}
