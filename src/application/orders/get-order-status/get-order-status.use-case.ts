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
    // 1. Buscar a Checkout Session pelo ID do Stripe
    const session = await this.checkoutSessionRepository.findByStripeSessionId(
      input.stripeSessionId
    );

    if (!session) {
      throw new Error(`Checkout Session "${input.stripeSessionId}" não encontrada.`);
    }

    // 2. Buscar o pedido pelo orderId da session
    const order = await this.orderRepository.findById(session.orderId);

    if (!order) {
      throw new Error(`Pedido "${session.orderId}" não encontrado.`);
    }

    return {
      orderCode: order.orderCode.value,
      status: order.status,
      totalCents: order.total.cents,
      deliveryFeeCents: order.deliveryFee.cents,
      // trackingUrl e deliveryStatus serão preenchidos futuramente via delivery repository
    };
  }
}
