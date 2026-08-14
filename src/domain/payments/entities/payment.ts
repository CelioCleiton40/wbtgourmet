export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded';

import { Money } from '@/domain/orders/value-objects/money';

export interface PaymentProps {
  id?: string;
  orderId: string;
  provider?: string;
  providerPaymentId: string;
  amount: Money;
  currency?: string;
  status?: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment {
  public readonly id?: string;
  public readonly orderId: string;
  public readonly provider: string;
  public readonly providerPaymentId: string;
  public readonly amount: Money;
  public readonly currency: string;
  public status: PaymentStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: PaymentProps) {
    if (!props.orderId || !props.providerPaymentId) {
      throw new Error('Pagamento deve conter orderId e providerPaymentId válidos.');
    }

    this.id = props.id;
    this.orderId = props.orderId;
    this.provider = props.provider || 'stripe';
    this.providerPaymentId = props.providerPaymentId;
    this.amount = props.amount;
    this.currency = props.currency || 'BRL';
    this.status = props.status || 'pending';
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public static create(props: PaymentProps): Payment {
    return new Payment(props);
  }

  public markSucceeded(): void {
    this.status = 'succeeded';
    this.updatedAt = new Date();
  }

  public markFailed(): void {
    this.status = 'failed';
    this.updatedAt = new Date();
  }

  public markRefunded(): void {
    this.status = 'refunded';
    this.updatedAt = new Date();
  }
}
