export type CheckoutSessionStatus =
  | 'pending'
  | 'open'
  | 'complete'
  | 'expired'
  | 'failed';

export interface CheckoutSessionProps {
  id?: string;
  orderId: string;
  stripeSessionId: string;
  amountCents: number;
  currency: string;
  status: CheckoutSessionStatus;
  successUrl: string;
  cancelUrl: string;
  deliveryQuoteId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Representa a Checkout Session criada no Stripe.
 * É a ponte entre o pedido (Order) e o pagamento processado pelo Stripe.
 */
export class CheckoutSession {
  public readonly id?: string;
  public readonly orderId: string;
  public readonly stripeSessionId: string;
  public readonly amountCents: number;
  public readonly currency: string;
  public status: CheckoutSessionStatus;
  public readonly successUrl: string;
  public readonly cancelUrl: string;
  public readonly deliveryQuoteId?: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: CheckoutSessionProps) {
    if (!props.orderId) throw new Error('CheckoutSession: orderId é obrigatório.');
    if (!props.stripeSessionId) throw new Error('CheckoutSession: stripeSessionId é obrigatório.');
    if (!Number.isInteger(props.amountCents) || props.amountCents <= 0) {
      throw new Error('CheckoutSession: amountCents deve ser um inteiro positivo.');
    }
    if (!props.currency) throw new Error('CheckoutSession: currency é obrigatório.');

    this.id = props.id;
    this.orderId = props.orderId;
    this.stripeSessionId = props.stripeSessionId;
    this.amountCents = props.amountCents;
    this.currency = props.currency.toLowerCase();
    this.status = props.status;
    this.successUrl = props.successUrl;
    this.cancelUrl = props.cancelUrl;
    this.deliveryQuoteId = props.deliveryQuoteId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public static create(props: CheckoutSessionProps): CheckoutSession {
    return new CheckoutSession(props);
  }

  public markComplete(): void {
    this.status = 'complete';
    this.updatedAt = new Date();
  }

  public markExpired(): void {
    this.status = 'expired';
    this.updatedAt = new Date();
  }

  public markFailed(): void {
    this.status = 'failed';
    this.updatedAt = new Date();
  }
}
