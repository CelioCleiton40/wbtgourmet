import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { DeliveryQuoteRepository } from '@/domain/deliveries/repositories/delivery-quote-repository';
import { CheckoutSessionRepository } from '@/domain/payments/repositories/checkout-session-repository';
import { CheckoutSession } from '@/domain/payments/entities/checkout-session';
import {
  PaymentGateway,
  CheckoutLineItem,
} from '@/domain/payments/services/payment-gateway';

export interface CreateCheckoutSessionInput {
  orderId: string;
  /** Chave de idempotência gerada no frontend — garante 1 session por intenção de pagamento. */
  idempotencyKey?: string;
}

export interface CreateCheckoutSessionOutput {
  /** URL da Stripe Hosted Page — único dado retornado ao frontend. */
  url: string;
  stripeSessionId: string;
  amountCents: number;
}

// Erros semânticos específicos para esta operação
export class OrderNotFoundForCheckoutError extends Error {
  constructor(orderId: string) {
    super(`Pedido "${orderId}" não encontrado para iniciar pagamento.`);
    this.name = 'OrderNotFoundForCheckoutError';
  }
}

export class OrderNotInPendingPaymentError extends Error {
  constructor(status: string) {
    super(`Pedido não está aguardando pagamento (status atual: ${status}).`);
    this.name = 'OrderNotInPendingPaymentError';
  }
}

export class DeliveryQuoteNotFoundError extends Error {
  constructor() {
    super('Cotação de entrega não encontrada para este pedido.');
    this.name = 'DeliveryQuoteNotFoundError';
  }
}

export class DeliveryQuoteExpiredError extends Error {
  constructor() {
    super('Cotação de entrega expirada. Solicite uma nova cotação de frete.');
    this.name = 'DeliveryQuoteExpiredError';
  }
}

export class DeliveryQuoteOwnershipError extends Error {
  constructor() {
    super('Cotação de entrega não pertence a este pedido.');
    this.name = 'DeliveryQuoteOwnershipError';
  }
}

export class AmountMismatchError extends Error {
  constructor(expected: number, got: number) {
    super(
      `Divergência financeira: order.total_cents=${expected}, calculado=${got}. Sessão não criada.`
    );
    this.name = 'AmountMismatchError';
  }
}

export class CreateCheckoutSessionUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly deliveryQuoteRepository: DeliveryQuoteRepository,
    private readonly checkoutSessionRepository: CheckoutSessionRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  public async execute(
    input: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionOutput> {
    // 1. Carregar o pedido
    const order = await this.orderRepository.findByOrderCode(input.orderId)
      ?? await this.orderRepository.findByIdempotencyKey(input.orderId);

    // Tenta por UUID interno também
    if (!order) {
      throw new OrderNotFoundForCheckoutError(input.orderId);
    }

    // 2. Order deve estar aguardando pagamento
    if (order.status !== 'pending_payment') {
      throw new OrderNotInPendingPaymentError(order.status);
    }

    // 3. Idempotência — se já existe session ativa, retorná-la
    if (order.id) {
      const existing = await this.checkoutSessionRepository.findByOrderId(order.id);
      if (existing && existing.status === 'open') {
        return {
          url: `https://checkout.stripe.com/c/pay/${existing.stripeSessionId}`,
          stripeSessionId: existing.stripeSessionId,
          amountCents: existing.amountCents,
        };
      }
    }

    // 4. Carregar e validar a cotação de entrega
    const quote = order.deliveryQuoteId
      ? await this.deliveryQuoteRepository.findById(order.deliveryQuoteId)
      : null;

    // Se o pedido tem frete mas não tem cotação vinculada, ou tem quoteId mas não encontrou
    if (order.deliveryFee.cents > 0 && !quote) {
      throw new DeliveryQuoteNotFoundError();
    }

    if (quote) {
      // 4a. Pertence ao pedido correto?
      if (quote.orderId !== order.id) {
        throw new DeliveryQuoteOwnershipError();
      }

      // 4b. Ainda está válida?
      if (quote.isExpired) {
        throw new DeliveryQuoteExpiredError();
      }
    }

    // 5. Construir line_items EXCLUSIVAMENTE a partir do snapshot do pedido (fonte: banco de dados)
    const lineItems: CheckoutLineItem[] = order.items.map((item) => ({
      name: item.productName,
      unitAmountCents: item.unitPrice.cents,
      quantity: item.quantity,
    }));

    // Adicionar frete como item separado (se > 0)
    if (order.deliveryFee.cents > 0) {
      lineItems.push({
        name: 'Frete — Uber Direct',
        unitAmountCents: order.deliveryFee.cents,
        quantity: 1,
      });
    }

    // 6. Verificar invariante financeiro: soma dos line_items === order.total_cents
    const computedTotal = lineItems.reduce(
      (sum, item) => sum + item.unitAmountCents * item.quantity,
      0
    );
    if (computedTotal !== order.total.cents) {
      throw new AmountMismatchError(order.total.cents, computedTotal);
    }

    // 7. Construir URLs no servidor — nunca recebidas do frontend
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/checkout/cancel`;

    const idempotencyKey = input.idempotencyKey
      ?? `order:${order.id ?? order.orderCode.value}:checkout-session`;

    // 8. Criar Stripe Checkout Session
    const sessionResult = await this.paymentGateway.createCheckoutSession({
      orderId: order.id ?? order.orderCode.value,
      orderCode: order.orderCode.value,
      lineItems,
      successUrl,
      cancelUrl,
      metadata: {
        order_id: order.id ?? order.orderCode.value,
        order_code: order.orderCode.value,
        delivery_quote_id: quote?.id,
      },
      idempotencyKey,
    });

    // 9. Persistir a session localmente
    if (order.id) {
      const checkoutSession = CheckoutSession.create({
        orderId: order.id,
        stripeSessionId: sessionResult.stripeSessionId,
        amountCents: sessionResult.amountCents,
        currency: sessionResult.currency,
        status: 'open',
        successUrl,
        cancelUrl,
        deliveryQuoteId: quote?.id,
      });
      await this.checkoutSessionRepository.save(checkoutSession);
    }

    return {
      url: sessionResult.url,
      stripeSessionId: sessionResult.stripeSessionId,
      amountCents: sessionResult.amountCents,
    };
  }
}
