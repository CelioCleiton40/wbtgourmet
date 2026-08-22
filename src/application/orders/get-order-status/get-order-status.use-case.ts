import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { CheckoutSessionRepository } from '@/domain/payments/repositories/checkout-session-repository';

export interface GetOrderStatusInput {
  /** ID da Stripe Checkout Session (cs_...) recebido na URL de retorno. */
  stripeSessionId: string;
}

export interface GetOrderStatusOutput {
  orderCode: string;
  status: string;
  /** Presente quando status = payment_confirmed */
  trackingUrl?: string;
  deliveryStatus?: string;
  totalCents?: number;
  deliveryFeeCents?: number;
}

export class GetOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly checkoutSessionRepository: CheckoutSessionRepository
  ) {}

  public async execute(input: GetOrderStatusInput): Promise<GetOrderStatusOutput> {
    // 1. Buscar a Checkout Session pelo ID da Session / Preferência
    const session = await this.checkoutSessionRepository.findByStripeSessionId(
      input.stripeSessionId
    );

    let order = null;
    if (session) {
      order = await this.orderRepository.findById(session.orderId);
    }

    // 2. Se não encontrou pela session, tenta buscar diretamente pelo orderCode ou orderId
    if (!order) {
      order = (await this.orderRepository.findByOrderCode(input.stripeSessionId))
        ?? (await this.orderRepository.findById(input.stripeSessionId));
    }

    if (!order) {
      throw new Error(`Sessão ou Pedido "${input.stripeSessionId}" não encontrado.`);
    }

    return {
      orderCode: order.orderCode.value,
      status: order.status,
      totalCents: order.total.cents,
      deliveryFeeCents: order.deliveryFee.cents,
    };
  }
}
