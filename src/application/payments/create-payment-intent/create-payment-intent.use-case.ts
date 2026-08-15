import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { PaymentGateway } from '@/domain/payments/services/payment-gateway';
import { ProductNotFoundError } from '@/shared/errors/domain-errors';

export interface CreatePaymentIntentInput {
  orderId: string;
}

export interface CreatePaymentIntentOutput {
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
}

export class CreatePaymentIntentUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  public async execute(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentOutput> {
    const targetOrder = (await this.orderRepository.findById(input.orderId))
      || (await this.orderRepository.findByOrderCode(input.orderId))
      || (await this.orderRepository.findByIdempotencyKey(input.orderId));

    if (!targetOrder) {
      throw new ProductNotFoundError(`Pedido "${input.orderId}" não encontrado para pagamento.`);
    }

    const idempotencyKey = `${targetOrder.orderCode.value}:payment`;

    const result = await this.paymentGateway.createPaymentIntent({
      orderId: targetOrder.orderCode.value,
      orderCode: targetOrder.orderCode.value,
      amount: targetOrder.total,
      customerPhone: targetOrder.customerPhone.value,
      idempotencyKey,
    });

    return {
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      amountCents: result.amountCents,
    };
  }
}
